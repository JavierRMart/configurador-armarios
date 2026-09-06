'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DatosEmpresa } from '@/lib/empresa';
import { ResumenPresupuesto } from '@/lib/presupuestos';
import { reservarSiguienteNumero } from '@/lib/presupuestos-generados';

const C = {
  tinta: '#1A1612',
  carbon: '#2D2823',
  oro: '#B08D57',
  crema: '#FAF7F2',
  arena: '#EDE4D6',
  humo: '#6B5D4F',
  linea: '#D9CDB8',
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";

function formatoEuro(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function descripcionProducto(linea: any): string {
  const partes = [];
  if (linea.color) partes.push(`Color: ${linea.color}`);
  partes.push(linea.cerco);
  if (linea.tapetas) partes.push(`Tapetas ${linea.tapetas}`);
  if (linea.pernios) partes.push(`Pernios ${linea.pernios}`);
  if (linea.herraje) partes.push(`Herraje ${linea.herraje}`);
  return partes.join(' · ');
}

function paginaPresupuesto(
  numero: string,
  empresa: DatosEmpresa,
  projectData: any,
  resumen: ResumenPresupuesto
): string {
  const filasSoportadas = resumen.lineas.filter((l) => l.soportado);
  const filasPendientes = resumen.lineas.filter((l) => !l.soportado);

  const filasHtml = filasSoportadas.map((l) => `
    <tr>
      <td style="padding:8px 0; border-bottom:0.3mm solid ${C.linea}; vertical-align:top;">
        <div style="font-family:${SANS}; font-size:11px; font-weight:bold; color:${C.tinta};">
          ${l.ubicacion} — ${l.modelo}
        </div>
        <div style="font-family:${SANS}; font-size:9px; color:${C.humo}; margin-top:2px;">
          ${l.tipo} / ${l.subtipo} · ${descripcionProducto(l)}
        </div>
      </td>
      <td style="padding:8px 0; border-bottom:0.3mm solid ${C.linea}; text-align:center;
                  font-family:${SANS}; font-size:11px; color:${C.humo}; vertical-align:top;">
        ${l.unidades}
      </td>
      <td style="padding:8px 0; border-bottom:0.3mm solid ${C.linea}; text-align:right;
                  font-family:${SANS}; font-size:11px; color:${C.tinta}; vertical-align:top; font-weight:bold;">
        ${formatoEuro(l.subtotal || 0)}
      </td>
    </tr>
  `).join('');

  const pendientesHtml = filasPendientes.length > 0 ? `
    <div style="margin-top:6mm; padding:4mm 5mm; background:${C.arena}; border-radius:2mm;">
      <div style="font-family:${SANS}; font-size:9px; font-weight:bold; color:${C.humo};
                  text-transform:uppercase; letter-spacing:1px; margin-bottom:2mm;">
        Pendientes de valorar
      </div>
      ${filasPendientes.map((l) => `
        <div style="font-family:${SANS}; font-size:10px; color:${C.humo}; margin-bottom:1mm;">
          ${l.ubicacion}${l.modelo && l.modelo !== '(sin modelo)' ? ` — ${l.modelo}` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <div style="width:210mm; height:297mm; background:white; position:relative;
                box-sizing:border-box; padding:20mm 18mm; font-family:${SANS};">

      <!-- Cabecera: empresa y número de presupuesto -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start;
                  padding-bottom:6mm; border-bottom:0.5mm solid ${C.tinta}; margin-bottom:8mm;">
        <div>
          <div style="font-family:${SERIF}; font-size:20px; color:${C.tinta}; font-weight:bold;">
            ${empresa.nombre_sociedad || '(nombre de la empresa sin definir)'}
          </div>
          <div style="font-family:${SANS}; font-size:9px; color:${C.humo}; margin-top:2mm; line-height:1.5;">
            ${empresa.direccion ? `${empresa.direccion}<br/>` : ''}
            ${empresa.cif ? `CIF: ${empresa.cif}<br/>` : ''}
            ${empresa.telefono ? `Tel: ${empresa.telefono}` : ''}${empresa.telefono && empresa.email ? ' · ' : ''}${empresa.email || ''}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:${SANS}; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:${C.humo};">
            Presupuesto
          </div>
          <div style="font-family:${SERIF}; font-size:22px; color:${C.oro}; font-weight:bold;">
            Nº ${numero}
          </div>
          <div style="font-family:${SANS}; font-size:9px; color:${C.humo}; margin-top:1mm;">
            ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <!-- Datos del cliente -->
      <div style="margin-bottom:10mm;">
        <div style="font-family:${SANS}; font-size:9px; letter-spacing:1px; text-transform:uppercase;
                    color:${C.humo}; margin-bottom:2mm;">
          Cliente
        </div>
        <div style="font-family:${SERIF}; font-size:16px; color:${C.tinta};">
          ${projectData.clientName || '(sin nombre)'}
        </div>
        ${projectData.address ? `
        <div style="font-family:${SANS}; font-size:10px; color:${C.humo}; margin-top:1mm;">
          ${projectData.address}
        </div>` : ''}
      </div>

      <!-- Tabla de líneas -->
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding-bottom:4mm; border-bottom:0.5mm solid ${C.tinta};
                        font-family:${SANS}; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:${C.humo};">
              Producto
            </th>
            <th style="text-align:center; padding-bottom:4mm; border-bottom:0.5mm solid ${C.tinta};
                        font-family:${SANS}; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:${C.humo};">
              Uds.
            </th>
            <th style="text-align:right; padding-bottom:4mm; border-bottom:0.5mm solid ${C.tinta};
                        font-family:${SANS}; font-size:9px; letter-spacing:1px; text-transform:uppercase; color:${C.humo};">
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          ${filasHtml}
        </tbody>
      </table>

      ${pendientesHtml}

      <!-- Totales -->
      <div style="margin-top:10mm; display:flex; justify-content:flex-end;">
        <div style="width:80mm;">
          <div style="display:flex; justify-content:space-between; padding:2mm 0;
                      font-family:${SANS}; font-size:11px; color:${C.humo};">
            <span>Base imponible</span>
            <span>${formatoEuro(resumen.subtotalSinIva)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2mm 0;
                      font-family:${SANS}; font-size:11px; color:${C.humo};
                      border-bottom:0.3mm solid ${C.linea};">
            <span>IVA (${resumen.ivaPorcentaje}%)</span>
            <span>${formatoEuro(resumen.cantidadIva)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:3mm 0;
                      font-family:${SERIF}; font-size:16px; font-weight:bold; color:${C.tinta};">
            <span>Total</span>
            <span>${formatoEuro(resumen.totalConIva)}</span>
          </div>
        </div>
      </div>

      <!-- Pie -->
      <div style="position:absolute; bottom:15mm; left:18mm; right:18mm;
                  padding-top:3mm; border-top:0.3mm solid ${C.linea};
                  font-family:${SANS}; font-size:8px; color:${C.humo}; text-align:center;">
        Presupuesto válido durante 30 días desde la fecha de emisión. Precios sujetos a confirmación de existencias.
      </div>
    </div>
  `;
}

export default function ExportPresupuestoPDF({
  proyectoId,
  nombreProyecto,
  empresa,
  projectData,
  resumen,
}: {
  proyectoId: string;
  nombreProyecto: string;
  empresa: DatosEmpresa;
  projectData: any;
  resumen: ResumenPresupuesto;
}) {
  const [loading, setLoading] = useState(false);

  const exportarPDF = async () => {
    setLoading(true);
    try {
      const numero = await reservarSiguienteNumero(proyectoId, resumen.totalConIva);

      const doc = new jsPDF('p', 'mm', 'a4');
      const html = paginaPresupuesto(numero, empresa, projectData, resumen);

      const cont = document.createElement('div');
      cont.style.position = 'fixed';
      cont.style.left = '-10000px';
      cont.style.top = '0';
      cont.style.width = '210mm';
      cont.style.height = '297mm';
      cont.style.backgroundColor = '#ffffff';
      cont.innerHTML = html;
      document.body.appendChild(cont);

      const canvas = await html2canvas(cont, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      document.body.removeChild(cont);

      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      doc.save(`Presupuesto-${numero}-${nombreProyecto}.pdf`);
    } catch (error: any) {
      console.error('Error al generar el presupuesto:', error);
      alert('No se pudo generar el PDF: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportarPDF}
      disabled={loading}
      style={{
        background: C.tinta,
        color: 'white',
        border: 'none',
        padding: '14px 24px',
        borderRadius: '4px',
        cursor: loading ? 'wait' : 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        marginTop: '20px',
        width: '100%',
        letterSpacing: '0.5px',
      }}
    >
      {loading ? 'Generando presupuesto...' : 'Descargar presupuesto en PDF'}
    </button>
  );
}