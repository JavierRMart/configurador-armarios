import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }

    const { pdfBase64, pageStart = 1, pageEnd = 20 } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF requerido' },
        { status: 400 }
      );
    }

    const prompt = `Extrae todos los precios de este PDF de tarifa de puertas.

Para cada línea de precio, devuelve un JSON con:
- categoria: uno de estos valores EXACTAMENTE: "hoja", "cerco", "tapeta", "herraje", "pernio", "manilla", "suplemento", "otro"
- referencia: código o referencia del producto (si existe)
- descripcion: descripción del producto
- precio: número sin símbolos (ej: 145.50)
- unidad: uno de estos: "ud", "m2", "ml", "juego"
- pagina_origen: número de página donde aparece
- aviso: si hay algo dudoso, escribe aquí qué. Si está claro, deixa vacío.

Devuelve SOLO un array JSON válido, nada más. Si no hay precios, devuelve [].

Ejemplo de respuesta:
[
  {"categoria":"hoja","referencia":"LISA700","descripcion":"Hoja de puerta lisa blanca 700mm","precio":45.50,"unidad":"ud","pagina_origen":2,"aviso":""},
  {"categoria":"cerco","referencia":"","descripcion":"Cerco de madera pino","precio":12.00,"unidad":"ud","pagina_origen":2,"aviso":"precio poco claro"}
]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      return NextResponse.json(
        { error: `Claude API error: ${errorText}` },
        { status: response.status }
      );
    }

    const rawText = await response.text();
    console.log('Claude raw response:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('Failed to parse Claude response:', rawText);
      return NextResponse.json(
        { error: 'No se pudo parsear la respuesta de Claude', raw: rawText },
        { status: 400 }
      );
    }

    const content = data.content[0]?.text || '';
    
    let items = [];
    try {
      items = JSON.parse(content);
      if (!Array.isArray(items)) items = [];
    } catch (e) {
      console.error('Failed to parse items JSON:', content);
      return NextResponse.json(
        { error: 'No se pudo parsear los items de la respuesta', raw: content },
        { status: 400 }
      );
    }

    return NextResponse.json({ items, pages: { start: pageStart, end: pageEnd } });
  } catch (error: any) {
    console.error('Unexpected error in extract-prices:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}