import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PAGES_PER_BLOCK = 10; // Procesar 10 páginas por llamada a Claude

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

    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Cargar el PDF para contar páginas
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();

    console.log(`Total pages in PDF: ${totalPages}`);

    // Dividir en bloques
    const blocks = [];
    for (let i = 0; i < totalPages; i += PAGES_PER_BLOCK) {
      const startPage = i;
      const endPage = Math.min(i + PAGES_PER_BLOCK - 1, totalPages - 1);
      blocks.push({ startPage, endPage });
    }

    console.log(`Processing ${blocks.length} blocks`);

    // Procesar cada bloque
    const allItems: any[] = [];
    const failedBlocks: any[] = [];

    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex];
      console.log(`Processing block ${blockIndex + 1}/${blocks.length}: pages ${block.startPage}-${block.endPage}`);

      try {
        // Extraer páginas del bloque
        const blockPdf = await PDFDocument.create();
        const copiedPages = await blockPdf.copyPages(pdfDoc, 
          Array.from({ length: block.endPage - block.startPage + 1 }, (_, i) => block.startPage + i)
        );
        copiedPages.forEach((page) => blockPdf.addPage(page));

        const blockPdfBytes = await blockPdf.save();
        const blockBase64 = Buffer.from(blockPdfBytes).toString('base64');

        // Llamar a Claude para este bloque
        const blockItems = await extractPricesFromBlock(blockBase64, block.startPage, block.endPage);
        allItems.push(...blockItems);

        console.log(`Block ${blockIndex + 1} completed: ${blockItems.length} items extracted`);
      } catch (blockError: any) {
        console.error(`Block ${blockIndex + 1} failed:`, blockError.message);
        failedBlocks.push({
          block: blockIndex + 1,
          pages: `${block.startPage}-${block.endPage}`,
          error: blockError.message,
        });
      }
    }

    console.log(`Total items extracted: ${allItems.length}`);
    console.log(`Failed blocks: ${failedBlocks.length}`);

    // Validar items
    const validItems = allItems.filter((item: any) => {
      return (
        ['hoja', 'cerco', 'tapeta', 'herraje', 'pernio', 'manilla', 'suplemento', 'otro'].includes(item.categoria) &&
        ['ud', 'm2', 'ml', 'juego'].includes(item.unidad) &&
        typeof item.precio === 'number' &&
        item.precio > 0
      );
    });

    return NextResponse.json({
      items: validItems,
      totalPages,
      blocksProcessed: blocks.length - failedBlocks.length,
      failedBlocks,
      extraction: {
        model: 'claude-opus-4-1',
        date: new Date().toISOString(),
        totalPages,
        blocksProcessed: blocks.length - failedBlocks.length,
        itemsExtracted: validItems.length,
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in extract-prices:', error);
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
): Promise<any[]> {
  const prompt = `Extrae todos los precios de este bloque de PDF de tarifa de puertas (páginas ${startPage + 1}-${endPage + 1}).

Para cada línea de precio, devuelve un JSON con:
- categoria: uno de estos valores EXACTAMENTE: "hoja", "cerco", "tapeta", "herraje", "pernio", "manilla", "suplemento", "otro"
- referencia: código o referencia del producto (si existe)
- descripcion: descripción del producto
- precio: número sin símbolos (ej: 145.50)
- unidad: uno de estos: "ud", "m2", "ml", "juego"
- pagina_origen: número de página donde aparece (${startPage + 1}-${endPage + 1})
- aviso: si hay algo dudoso, escribe aquí qué. Si está claro, deixa vacío.

Devuelve SOLO un array JSON válido, nada más. Si no hay precios, devuelve [].

Ejemplo de respuesta:
[
  {"categoria":"hoja","referencia":"LISA700","descripcion":"Hoja de puerta lisa blanca 700mm","precio":45.50,"unidad":"ud","pagina_origen":2,"aviso":""},
  {"categoria":"cerco","referencia":"","descripcion":"Cerco de madera pino","precio":12.00,"unidad":"ud","pagina_origen":2,"aviso":"precio poco claro"}
]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
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
      console.error(`Claude API error (pages ${startPage}-${endPage}):`, errorText);
      throw new Error(`Claude API returned ${response.status}: ${errorText}`);
    }

    const rawText = await response.text();
    console.log(`Claude response (pages ${startPage}-${endPage}):`, rawText.substring(0, 200));

    const data = JSON.parse(rawText);
    const content = data.content[0]?.text || '';

    let items = [];
    try {
      items = JSON.parse(content);
      if (!Array.isArray(items)) items = [];
    } catch (e) {
      console.error(`Failed to parse items (pages ${startPage}-${endPage}):`, content.substring(0, 200));
      return [];
    }

    return items;
  } catch (error: any) {
    console.error(`Error extracting block (pages ${startPage}-${endPage}):`, error.message);
    throw error;
  }
}