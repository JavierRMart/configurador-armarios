import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODELO = 'claude-sonnet-5';

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key no configurada.' }, { status: 500 });
    }

    const { pdfBase64, paginaInicio, paginaFin, soloContar } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF requerido.' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.load(Buffer.from(pdfBase64, 'base64'));
    const totalPaginas = pdfDoc.getPageCount();

    if (soloContar) {
      return NextResponse.json({ totalPaginas });
    }

    const inicio = Math.max(0, paginaInicio ?? 0);
    const fin = Math.min(paginaFin ?? 0, totalPaginas - 1);

    if (inicio > fin) {
      return NextResponse.json({ error: 'Rango inválido.' }, { status: 400 });
    }

    const bloquePdf = await PDFDocument.create();
    const indices = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
    const copiadas = await bloquePdf.copyPages(pdfDoc, indices);
    copiadas.forEach((p) => bloquePdf.addPage(p));

    const bloqueBase64 = Buffer.from(await bloquePdf.save()).toString('base64');

    const prompt = `Extrae TODOS los precios de estas páginas de tarifa de puertas.

IMPORTANTE: Si ves una tabla con encabezados (modelos nombrados) y filas (tipos de puerta),
debes DESPLEGAR cada combinación modelo × tipo × formato en una línea separada.

Ejemplo:
  Si encabezado dice "LAC 0.4, LAC 2.0" (2 modelos)
  Y fila "CIEGA" tiene precio BLOCK=100, HOJA=50
  Genera 4 líneas: (LAC0.4-CIEGA-BLOCK, LAC0.4-CIEGA-HOJA, LAC2.0-CIEGA-BLOCK, LAC2.0-CIEGA-HOJA)

No hagas línea si la casilla está vacía.

Devuelve SOLO array JSON, sin explicaciones.

Campos obligatorios:
{
  "categoria": "puerta" | "armario" | "cerco" | "tapeta" | "herraje" | "pernio" | "suplemento" | "otro",
  "referencia": "string o empty",
  "descripcion": "descripción legible",
  "precio": número,
  "tipo_precio": "fijo" | "porcentaje",
  "unidad": "ud" | "m2" | "ml" | "juego",
  "aplica_a": "string o empty",
  "atributos": {"modelo": "...", "tipo": "...", "formato": "...", ...},
  "pagina_origen": número,
  "aviso": "string o empty"
}`;

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
        messages: [{
          role: 'user',
          content: [{
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: bloqueBase64 },
          }, {
            type: 'text',
            text: prompt,
          }],
        }],
      }),
    });

    if (!respuesta.ok) {
      const errorText = await respuesta.text();
      return NextResponse.json({ error: errorText.substring(0, 300) }, { status: 502 });
    }

    const datos = await respuesta.json();
    const contenido = datos.content?.[0]?.text || '';
    const limpio = contenido.replace(/```json/g, '').replace(/```/g, '').trim();

    let items = [];
    try {
      items = JSON.parse(limpio);
      if (!Array.isArray(items)) items = [];
    } catch {
      return NextResponse.json({ items: [], error: 'No se parseó JSON', raw: contenido.substring(0, 200) });
    }

    const CATEGORIAS = ['puerta', 'armario', 'cerco', 'tapeta', 'moldura', 'rodapie', 'herraje', 'pernio', 'manilla', 'suplemento', 'otro'];
    const UNIDADES = ['ud', 'm2', 'ml', 'juego', 'tira'];

    const validos = items.filter((it: any) =>
      CATEGORIAS.includes(it.categoria) &&
      UNIDADES.includes(it.unidad) &&
      typeof it.precio === 'number' &&
      it.precio > 0
    );

    return NextResponse.json({
      items: validos,
      totalPaginas,
      paginaInicio: inicio,
      paginaFin: fin,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}