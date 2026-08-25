import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODELO = 'claude-sonnet-5';

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Falta la clave de la API. Revisa la configuración del servidor.' },
        { status: 500 }
      );
    }

    const { pdfBase64, paginaInicio, paginaFin, soloContar } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'No se ha recibido ningún PDF.' },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPaginas = pdfDoc.getPageCount();

    // Primera llamada: solo queremos saber cuántas páginas tiene
    if (soloContar) {
      return NextResponse.json({ totalPaginas });
    }

    const inicio = Math.max(0, paginaInicio ?? 0);
    const fin = Math.min(paginaFin ?? 0, totalPaginas - 1);

    if (inicio > fin) {
      return NextResponse.json(
        { error: 'El rango de páginas no es válido.' },
        { status: 400 }
      );
    }

    // Recortar solo las páginas de este bloque
    const bloquePdf = await PDFDocument.create();
    const indices = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
    const paginasCopiadas = await bloquePdf.copyPages(pdfDoc, indices);
    paginasCopiadas.forEach((p) => bloquePdf.addPage(p));

    const bloqueBytes = await bloquePdf.save();
    const bloqueBase64 = Buffer.from(bloqueBytes).toString('base64');

    const prompt = `Extrae todos los precios de este fragmento de una tarifa de puertas.
Corresponde a las páginas ${inicio + 1} a ${fin + 1} del documento original.

Para cada línea de precio devuelve un objeto con estos campos:
- categoria: exactamente uno de estos: "hoja", "cerco", "tapeta", "herraje", "pernio", "manilla", "suplemento", "otro"
- referencia: el código del producto si aparece, si no cadena vacía
- descripcion: descripción del producto
- precio: número, sin símbolo de moneda (ejemplo: 145.50)
- unidad: exactamente uno de estos: "ud", "m2", "ml", "juego"
- pagina_origen: número de página del documento original (entre ${inicio + 1} y ${fin + 1})
- aviso: si el precio no se lee con seguridad, explica aquí por qué. Si está claro, cadena vacía.

Reglas:
- No inventes precios. No interpoles. No redondees.
- Si no hay precios en estas páginas, devuelve un array vacío.

Responde SOLO con el array JSON. Sin explicaciones, sin bloques de código markdown.

Ejemplo del formato esperado:
[{"categoria":"hoja","referencia":"LISA700","descripcion":"Hoja lisa blanca 700mm","precio":45.50,"unidad":"ud","pagina_origen":${inicio + 1},"aviso":""}]`;

    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: bloqueBase64,
                },
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
        {
          error: `La IA devolvió un error (${respuesta.status})`,
          detalle: textoError.substring(0, 300),
        },
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
        avisoParseo: 'La IA no devolvió un JSON válido para este bloque.',
        muestra: contenido.substring(0, 300),
      });
    }

    const categoriasValidas = ['hoja', 'cerco', 'tapeta', 'herraje', 'pernio', 'manilla', 'suplemento', 'otro'];
    const unidadesValidas = ['ud', 'm2', 'ml', 'juego'];

    const itemsValidos = items.filter(
      (item: any) =>
        item &&
        categoriasValidas.includes(item.categoria) &&
        unidadesValidas.includes(item.unidad) &&
        typeof item.precio === 'number' &&
        item.precio > 0 &&
        typeof item.descripcion === 'string' &&
        item.descripcion.length > 0
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