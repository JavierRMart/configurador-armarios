import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PAGES_PER_BLOCK = 3;

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }

    const { pdfBase64 } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF requerido' },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();

    const blocks = [];
    for (let i = 0; i < totalPages; i += PAGES_PER_BLOCK) {
      const startPage = i;
      const endPage = Math.min(i + PAGES_PER_BLOCK - 1, totalPages - 1);
      blocks.push({ startPage, endPage });
    }

    const allItems: any[] = [];
    const failedBlocks: any[] = [];
    const debugSamples: any[] = [];

    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex];

      try {
        const blockPdf = await PDFDocument.create();
        const copiedPages = await blockPdf.copyPages(
          pdfDoc,
          Array.from(
            { length: block.endPage - block.startPage + 1 },
            (_, i) => block.startPage + i
          )
        );
        copiedPages.forEach((page) => blockPdf.addPage(page));

        const blockPdfBytes = await blockPdf.save();
        const blockBase64 = Buffer.from(blockPdfBytes).toString('base64');

        const result = await extractPricesFromBlock(
          blockBase64,
          block.startPage,
          block.endPage
        );

        allItems.push(...result.items);

        if (debugSamples.length < 3 && result.rawText) {
          debugSamples.push({
            paginas: `${block.startPage + 1}-${block.endPage + 1}`,
            respuesta: result.rawText.substring(0, 500),
          });
        }
      } catch (blockError: any) {
        failedBlocks.push({
          block: blockIndex + 1,
          pages: `${block.startPage + 1}-${block.endPage + 1}`,
          error: blockError.message,
        });
      }
    }

    const validItems = allItems.filter((item: any) => {
      return (
        ['hoja', 'cerco', 'tapeta', 'herraje', 'pernio', 'manilla', 'suplemento', 'otro'].includes(item.categoria) &&
        ['ud', 'm2', 'ml', 'juego'].includes(item.unidad) &&
        typeof item.precio === 'number' &&
        item.precio > 0
      );
    });

    if (validItems.length === 0) {
      return NextResponse.json({
        items: [],
        totalPages,
        totalBlocks: blocks.length,
        itemsSinValidar: allItems.length,
        muestraItemsSinValidar: allItems.slice(0, 5),
        failedBlocks,
        muestrasRespuestaClaude: debugSamples,
      });
    }

    return NextResponse.json({
      items: validItems,
      totalPages,
      blocksProcessed: blocks.length - failedBlocks.length,
      failedBlocks,
      extraction: {
        model: 'claude-sonnet-5',
        date: new Date().toISOString(),
        totalPages,
        blocksProcessed: blocks.length - failedBlocks.length,
        itemsExtracted: validItems.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

async function extractPricesFromBlock(
  blockBase64: string,
  startPage: number,
  endPage: number
): Promise<{ items: any[]; rawText: string }> {
  const prompt = `Extrae todos los precios de este bloque de PDF de tarifa de puertas (páginas ${startPage + 1}-${endPage + 1}).

Para cada línea de precio, devuelve un objeto con:
- categoria: uno de estos valores EXACTAMENTE: "hoja", "cerco", "tapeta", "herraje", "pernio", "manilla", "suplemento", "otro"
- referencia: código o referencia del producto (si existe)
- descripcion: descripción del producto
- precio: número sin símbolos (ej: 145.50)
- unidad: uno de estos EXACTAMENTE: "ud", "m2", "ml", "juego"
- pagina_origen: número de página donde aparece
- aviso: si hay algo dudoso, escribe aquí qué. Si está claro, deja vacío.

Devuelve SOLO un array JSON válido, sin explicaciones, sin bloques de código markdown. Si no hay precios, devuelve [].

Ejemplo:
[{"categoria":"hoja","referencia":"LISA700","descripcion":"Hoja lisa blanca 700mm","precio":45.50,"unidad":"ud","pagina_origen":2,"aviso":""}]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
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
                data: blockBase64,
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
    throw new Error(`Claude API ${response.status}: ${errorText.substring(0, 300)}`);
  }

  const rawText = await response.text();
  const data = JSON.parse(rawText);
  const content = data.content[0]?.text || '';

  const limpio = content.replace(/```json/g, '').replace(/```/g, '').trim();

  let items = [];
  try {
    items = JSON.parse(limpio);
    if (!Array.isArray(items)) items = [];
  } catch (e) {
    return { items: [], rawText: content };
  }

  return { items, rawText: content };
}