import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODELO = 'claude-sonnet-5';

const CATEGORIAS = [
  'puerta', 'armario', 'hoja', 'cerco', 'tapeta', 'moldura',
  'rodapie', 'herraje', 'pernio', 'manilla', 'suplemento', 'otro',
];
const UNIDADES = ['ud', 'm2', 'ml', 'juego', 'tira'];
const TIPOS_PRECIO = ['fijo', 'porcentaje'];

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Falta la clave de la API en el servidor.' },
        { status: 500 }
      );
    }

    const { pdfBase64, paginaInicio, paginaFin, soloContar } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'No se ha recibido ningún PDF.' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.load(Buffer.from(pdfBase64, 'base64'));
    const totalPaginas = pdfDoc.getPageCount();

    if (soloContar) {
      return NextResponse.json({ totalPaginas });
    }

    const inicio = Math.max(0, paginaInicio ?? 0);
    const fin = Math.min(paginaFin ?? 0, totalPaginas - 1);

    if (inicio > fin) {
      return NextResponse.json({ error: 'Rango de páginas no válido.' }, { status: 400 });
    }

    const bloquePdf = await PDFDocument.create();
    const indices = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
    const copiadas = await bloquePdf.copyPages(pdfDoc, indices);
    copiadas.forEach((p) => bloquePdf.addPage(p));

    const bloqueBase64 = Buffer.from(await bloquePdf.save()).toString('base64');

    const prompt = construirPrompt(inicio, fin);

    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: bloqueBase64 },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!respuesta.ok) {
      const textoError = await respuesta.text();
      return NextResponse.json(
        { error: `La IA devolvió un error (${respuesta.status})`, detalle: textoError.substring(0, 300) },
        { status: 502 }
      );
    }

    const datos = await respuesta.json();
    const contenido = datos.content?.[0]?.text || '';
    const limpio = contenido.replace(/```json/g, '').replace(/```/g, '').trim();

    let items: any[] = [];
    try {
      const parseado = JSON.parse(limpio);
      items = Array.isArray(parseado) ? parseado : [];
    } catch {
      return NextResponse.json({
        items: [],
        totalPaginas,
        paginaInicio: inicio,
        paginaFin: fin,
        avisoParseo: 'La IA no devolvió un JSON válido en este bloque.',
        muestra: contenido.substring(0, 400),
      });
    }

    const itemsValidos = items.filter(
      (it: any) =>
        it &&
        CATEGORIAS.includes(it.categoria) &&
        UNIDADES.includes(it.unidad) &&
        TIPOS_PRECIO.includes(it.tipo_precio || 'fijo') &&
        typeof it.precio === 'number' &&
        it.precio > 0 &&
        typeof it.descripcion === 'string' &&
        it.descripcion.trim().length > 0
    );

    return NextResponse.json({
      items: itemsValidos,
      descartados: items.length - itemsValidos.length,
      totalPaginas,
      paginaInicio: inicio,
      paginaFin: fin,
      modelo: MODELO,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error inesperado en el servidor.' },
      { status: 500 }
    );
  }
}

function construirPrompt(inicio: number, fin: number): string {
  return `Eres un extractor de precios de tarifas de fabricantes de puertas y armarios.
Analizas las páginas ${inicio + 1} a ${fin + 1} de una tarifa de IMALASA.

=== CÓMO ESTÁN MONTADAS ESTAS TABLAS ===

No son listas de "concepto y precio". Son tablas que hay que DESPLEGAR.

Estructura típica:
- Un ENCABEZADO naranja nombra VARIOS MODELOS que comparten el mismo precio.
  Ejemplo: "MOD. LAC 0.4, LAC 2.0, LAC 0.6 y LAC 0.2C" son CUATRO modelos.
- Las FILAS son TIPOS de puerta (CIEGA, V1L, V3, Parrilla Enrasada V1, CARPELINO...).
  Una fila puede agrupar VARIOS tipos: "V1L, V1C" son DOS tipos al mismo precio.
- Las COLUMNAS son FORMATOS DE VENTA:
  · BLOCK = puerta completa montada (hoja + cerco + tapetas + herraje)
  · HOJA  = solo la puerta, sin marco ni herrajes
  · KIT   = equivalente al BLOCK pero en tablas de armario
- Algunas páginas parten las columnas en subcolumnas de VARIANTE:
  "Ángulo Redondo / Ángulo Recto" o "Fresado 10º / Fresado Twin".
  Cada subcolumna es un precio distinto.

REGLA DE DESPLIEGUE, la más importante de todas:
  nº modelos del encabezado × nº tipos de la fila × nº columnas con precio

Ejemplo trabajado:
  Encabezado: "MOD. LAC 0.4, LAC 2.0, LAC 0.6 y LAC 0.2C"  → 4 modelos
  Fila:       "V1L, V1C    196,42 (BLOCK)    123,11 (HOJA)" → 2 tipos, 2 columnas
  Resultado:  4 × 2 × 2 = 16 líneas de precio, no 2.

Una página de tabla completa debe dar entre 40 y 80 líneas. Si sacas 3, estás fallando.

=== CASILLAS VACÍAS ===

Una casilla vacía es información, no un error de lectura. Significa que ese
producto no se vende en ese formato. NO generes línea para casillas vacías.
Ejemplos reales: CARPELINO nunca tiene BLOCK. ABATIBLE 2H nunca tiene HOJA.

=== QUÉ CATEGORÍA PONER ===

- "puerta"     → blocks y hojas de puertas de paso, blindadas, técnicas
- "armario"    → frentes de armario abatibles y correderas (columnas KIT/HOJA)
- "cerco"      → cercos sueltos vendidos por tira o metro
- "tapeta"     → tapajuntas
- "moldura"    → molduras
- "rodapie"    → rodapiés
- "herraje"    → cerraduras, picaportes, kits de corredera
- "pernio"     → bisagras y pernios
- "manilla"    → manillas
- "suplemento" → incrementos y opciones que se SUMAN a un precio base
- "otro"       → lo que no encaje

=== INCREMENTOS Y PORCENTAJES ===

Las páginas de "opciones e incrementos" no venden productos: modifican precios.
Cada línea lleva un campo "tipo_precio":
- "fijo"       → el número son euros. Ejemplo: burlete de goma +14,28 € → precio 14.28
- "porcentaje" → el número son puntos porcentuales. Ejemplo: alto hasta 2400 +30% → precio 30

En estos casos rellena también "aplica_a" explicando sobre qué se aplica.
Ejemplos: "alto hasta 2400", "solo BLOCK", "colores oscuros", "puertas de paso".

=== FORMATO DE SALIDA ===

Devuelve SOLO un array JSON. Sin explicaciones, sin markdown, sin bloques de código.

Cada objeto lleva:
- categoria     : una de las de la lista de arriba
- referencia    : código del producto si aparece, si no ""
- descripcion   : descripción legible y COMPLETA. Debe bastar por sí sola para
                  saber qué es. Ejemplo: "LAC 0.4 CIEGA - BLOCK"
- atributos     : objeto con lo que caracteriza esta línea. Usa las claves que
                  apliquen: modelo, tipo, formato, variante, medida, acabado.
                  Ejemplo: {"modelo":"LAC 0.4","tipo":"CIEGA","formato":"BLOCK"}
- precio        : número con punto decimal. "173,57" → 173.57
- tipo_precio   : "fijo" o "porcentaje"
- unidad        : "ud", "m2", "ml", "juego" o "tira"
- aplica_a      : solo para suplementos. Si no aplica, ""
- pagina_origen : número de página real del documento (entre ${inicio + 1} y ${fin + 1})
- aviso         : si algo no se lee con seguridad, explícalo. Si está claro, ""

=== REGLAS ===

- No inventes precios. No interpoles. No redondees.
- Los precios llevan coma decimal en el PDF: conviértela a punto.
- Si una página dice "consultar precio" o "precios mediante presupuesto",
  NO generes líneas para ella.
- Si una página es portada, índice o fotos sin precios, devuelve [].
- Prefiere desplegar de más a de menos: es mejor una línea de sobra que
  una que falte.

=== EJEMPLO DE SALIDA ===

[
  {"categoria":"puerta","referencia":"","descripcion":"LAC 0.4 CIEGA - BLOCK","atributos":{"modelo":"LAC 0.4","tipo":"CIEGA","formato":"BLOCK"},"precio":173.57,"tipo_precio":"fijo","unidad":"ud","aplica_a":"","pagina_origen":11,"aviso":""},
  {"categoria":"puerta","referencia":"","descripcion":"LAC 0.4 CIEGA - HOJA","atributos":{"modelo":"LAC 0.4","tipo":"CIEGA","formato":"HOJA"},"precio":100.26,"tipo_precio":"fijo","unidad":"ud","aplica_a":"","pagina_origen":11,"aviso":""},
  {"categoria":"armario","referencia":"","descripcion":"LAC 0.4 ABATIBLE 1H hasta 2400x600 - KIT","atributos":{"modelo":"LAC 0.4","tipo":"ABATIBLE 1H","formato":"KIT","medida":"2400x600"},"precio":146.49,"tipo_precio":"fijo","unidad":"ud","aplica_a":"","pagina_origen":11,"aviso":""},
  {"categoria":"suplemento","referencia":"","descripcion":"Incremento por alto hasta 2400 mm","atributos":{},"precio":30,"tipo_precio":"porcentaje","unidad":"ud","aplica_a":"alto hasta 2400","pagina_origen":43,"aviso":""}
]`;
}