'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ExportPDF({ projectData, armarios }: any) {
  const [loading, setLoading] = useState(false);

  const exportarPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < armarios.length; i++) {
        const armario = armarios[i];

        const container = document.createElement('div');
        container.style.width = '210mm';
        container.style.height = '297mm';
        container.style.padding = '12mm';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.backgroundColor = 'white';
        container.style.boxSizing = 'border-box';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        container.innerHTML = `
          <!-- HEADER -->
          <div style="background: linear-gradient(135deg, #2D2823 0%, #1a1612 100%); color: white; padding: 8mm; border-radius: 3mm; margin-bottom: 8mm;">
            <h1 style="margin: 0 0 2mm 0; font-size: 20px; font-weight: bold;">
              ${projectData.clientName}
            </h1>
            <div style="font-size: 9px; opacity: 0.9; line-height: 1.5;">
              📍 ${projectData.address} | 💰 ${projectData.budget}€ | 📅 ${projectData.date}
            </div>
          </div>

          <!-- TITULO ARMARIO -->
          <div style="margin-bottom: 6mm;">
            <h2 style="margin: 0; font-size: 14px; font-weight: bold; color: #1a1612;">
              ${armario.ubicacion}${armario.name ? ' • ' + armario.name : ''}
            </h2>
            <div style="font-size: 9px; color: #666;">
              Sistema: <strong>${armario.type === 'abatible' ? 'Puertas Abatibles' : 'Puertas Correderas'}</strong>
            </div>
          </div>

          <!-- VISTAS TECNICAS -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; margin-bottom: 8mm; flex: 1;">
            <!-- ALZADO -->
            <div style="border: 1px solid #d9cdb8; padding: 4mm; border-radius: 2mm; background: #faf7f2;">
              <div style="text-align: center; margin-bottom: 3mm;">
                ${CabinetSVGAlzado(armario)}
              </div>
              <div style="text-align: center; font-size: 9px; font-weight: bold; color: #1a1612;">ALZADO</div>
              <div style="text-align: center; font-size: 8px; color: #666; margin-top: 1mm;">
                ${Math.round(armario.ancho * 10)} × ${Math.round(armario.alto * 10)} mm
              </div>
            </div>

            <!-- PLANTA -->
            <div style="border: 1px solid #d9cdb8; padding: 4mm; border-radius: 2mm; background: #faf7f2;">
              <div style="text-align: center; margin-bottom: 3mm;">
                ${CabinetSVGPlanta(armario)}
              </div>
              <div style="text-align: center; font-size: 9px; font-weight: bold; color: #1a1612;">PLANTA</div>
              <div style="text-align: center; font-size: 8px; color: #666; margin-top: 1mm;">
                ${Math.round(armario.ancho * 10)} × ${Math.round(armario.profundidad * 10)} mm
              </div>
            </div>

            <!-- SECCION -->
            <div style="border: 1px solid #d9cdb8; padding: 4mm; border-radius: 2mm; background: #faf7f2;">
              <div style="text-align: center; margin-bottom: 3mm;">
                ${CabinetSVGSeccion(armario)}
              </div>
              <div style="text-align: center; font-size: 9px; font-weight: bold; color: #1a1612;">SECCIÓN</div>
              <div style="text-align: center; font-size: 8px; color: #666; margin-top: 1mm;">
                ${Math.round(armario.profundidad * 10)} × ${Math.round(armario.alto * 10)} mm
              </div>
            </div>
          </div>

          <!-- ESPECIFICACIONES EN GRID -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 6mm;">
            <!-- MEDIDAS -->
            <div style="border-left: 3mm solid #B08D57; padding-left: 4mm;">
              <div style="font-size: 9px; font-weight: bold; color: #1a1612; margin-bottom: 2mm;">MEDIDAS</div>
              <div style="font-size: 8px; color: #666; line-height: 1.6;">
                <div>📏 Ancho: <strong>${Math.round(armario.ancho * 10)} mm</strong></div>
                <div>📏 Alto: <strong>${Math.round(armario.alto * 10)} mm</strong></div>
                <div>📏 Profundidad: <strong>${Math.round(armario.profundidad * 10)} mm</strong></div>
              </div>
            </div>

            <!-- INTERIOR -->
            <div style="border-left: 3mm solid #B08D57; padding-left: 4mm;">
              <div style="font-size: 9px; font-weight: bold; color: #1a1612; margin-bottom: 2mm;">INTERIOR</div>
              <div style="font-size: 8px; color: #666; line-height: 1.6;">
                <div>🔧 Barra colgante: <strong>${armario.interior.barraColgar ? '✓ Sí' : '✗ No'}</strong></div>
                <div>📚 Baldas: <strong>${armario.interior.baldas ? '✓ Sí' : '✗ No'}</strong></div>
                <div>🔗 Cremallera: <strong>${armario.interior.cremallera ? '✓ Sí' : '✗ No'}</strong></div>
                <div>📦 Cajones: <strong>${armario.interior.cajones}</strong></div>
              </div>
            </div>

            <!-- ACABADOS -->
            <div style="border-left: 3mm solid #B08D57; padding-left: 4mm;">
              <div style="font-size: 9px; font-weight: bold; color: #1a1612; margin-bottom: 2mm;">ACABADOS</div>
              <div style="font-size: 8px; color: #666; line-height: 1.6;">
                <div>🎨 Interior Textil: <strong>${armario.finishes.interiorTextil}</strong></div>
                <div>🔨 Tirador: <strong>${armario.finishes.handle}</strong></div>
                <div>👁️ Costados Vistos: <strong>${armario.finishes.costadosVistos ? '✓ Sí' : '✗ No'}</strong></div>
              </div>
            </div>

            <!-- NOTAS -->
            ${armario.notes ? `
            <div style="border-left: 3mm solid #B08D57; padding-left: 4mm;">
              <div style="font-size: 9px; font-weight: bold; color: #1a1612; margin-bottom: 2mm;">NOTAS</div>
              <div style="font-size: 8px; color: #666; line-height: 1.4;">
                ${armario.notes}
              </div>
            </div>
            ` : ''}
          </div>

          <!-- CAJETIN CAD -->
          <div style="border: 2px solid #1a1612; margin-top: auto;">
            <table style="width: 100%; font-size: 8px; border-collapse: collapse;">
              <tr>
                <td style="border-right: 1px solid #1a1612; padding: 4mm; width: 65%;">
                  <div style="font-weight: bold; font-size: 10px;">PROYECTO</div>
                  <div style="font-size: 11px; font-weight: bold; color: #B08D57;">${projectData.clientName}</div>
                </td>
                <td style="padding: 4mm; text-align: center; width: 35%;">
                  <div style="font-weight: bold;">Nº PLANO</div>
                  <div style="font-size: 18px; font-weight: bold; color: #B08D57;">A${i + 1}</div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="border-top: 1px solid #1a1612; padding: 3mm;">
                  <div style="font-weight: bold;">PLANO: TÉCNICO - ${armario.ubicacion.toUpperCase()}${armario.name ? ' · ' + armario.name.toUpperCase() : ''}</div>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px solid #1a1612; padding: 3mm; border-right: 1px solid #1a1612; width: 33%;">
                  <div style="font-weight: bold; font-size: 8px;">ESCALA</div>
                  <div>S/ESCALA</div>
                </td>
                <td style="border-top: 1px solid #1a1612; padding: 3mm; border-right: 1px solid #1a1612; width: 33%;">
                  <div style="font-weight: bold; font-size: 8px;">FECHA</div>
                  <div>${projectData.date}</div>
                </td>
                <td style="border-top: 1px solid #1a1612; padding: 3mm; width: 34%;">
                  <div style="font-weight: bold; font-size: 8px;">DIBUJO</div>
                  <div>LVMeritus</div>
                </td>
              </tr>
            </table>
          </div>
        `;

        document.body.appendChild(container);
        const canvas = await html2canvas(container, {
          scale: 2,
          backgroundColor: '#ffffff',
          windowHeight: 1400,
        });
        document.body.removeChild(container);

        if (i > 0) doc.addPage();
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }

      doc.save(`planos-${projectData.clientName}-${projectData.date}.pdf`);
      alert(`✅ PDF generado: ${armarios.length} página(s)`);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportarPDF}
      disabled={loading}
      style={{
        background: '#1a1612',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        marginTop: '20px',
        width: '100%',
      }}
    >
      {loading ? '⏳ Generando PDF...' : '📥 Descargar PDF Profesional'}
    </button>
  );
}

// ============ FUNCIONES SVG ============

function CabinetSVGAlzado(armario: any) {
  const ancho = Math.round(armario.ancho * 10);
  const alto = Math.round(armario.alto * 10);
  const scale = Math.min(90 / ancho, 130 / alto);
  const w = ancho * scale;
  const h = alto * scale;

  let svg = `<svg viewBox="0 0 ${w + 60} ${h + 80}" style="width: 100%; max-height: 150px;">`;
  
  // Cuerpo
  svg += `<rect x="30" y="25" width="${w}" height="${h}" fill="#FAF7F2" stroke="#2D2823" stroke-width="2" />`;
  
  // Barra colgante
  if (armario.interior.barraColgar) {
    svg += `<line x1="35" y1="${25 + h * 0.18}" x2="${w + 25}" y2="${25 + h * 0.18}" stroke="#B08D57" stroke-width="2" />`;
  }
  
  // Baldas
  if (armario.interior.baldas) {
    [0.4, 0.6, 0.8].forEach(pos => {
      svg += `<line x1="33" y1="${25 + h * pos}" x2="${w + 27}" y2="${25 + h * pos}" stroke="#6B5D4F" stroke-width="0.8" stroke-dasharray="3 2" />`;
    });
  }

  // Divisiones de puertas
  const doorCount = armario.doors.length;
  const doorWidth = w / doorCount;
  for (let i = 1; i < doorCount; i++) {
    svg += `<line x1="${30 + doorWidth * i}" y1="25" x2="${30 + doorWidth * i}" y2="${25 + h}" stroke="#2D2823" stroke-width="1.2" />`;
  }

  // COTAS - Ancho
  svg += `<line x1="30" y1="10" x2="${30 + w}" y2="10" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="30" y1="5" x2="30" y2="15" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${30 + w}" y1="5" x2="${30 + w}" y2="15" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<text x="${30 + w/2}" y="8" text-anchor="middle" font-size="10" font-weight="bold" fill="#2D2823">${ancho}mm</text>`;

  // COTAS - Alto
  svg += `<line x1="${w + 45}" y1="25" x2="${w + 45}" y2="${25 + h}" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${w + 40}" y1="25" x2="${w + 50}" y2="25" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${w + 40}" y1="${25 + h}" x2="${w + 50}" y2="${25 + h}" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<text x="${w + 55}" y="${25 + h/2 + 3}" font-size="10" font-weight="bold" fill="#2D2823">${alto}mm</text>`;

  svg += `</svg>`;
  return svg;
}

function CabinetSVGPlanta(armario: any) {
  const ancho = Math.round(armario.ancho * 10);
  const prof = Math.round(armario.profundidad * 10);
  const scale = Math.min(90 / ancho, 90 / prof);
  const w = ancho * scale;
  const p = prof * scale;

  let svg = `<svg viewBox="0 0 ${w + 60} ${p + 80}" style="width: 100%; max-height: 150px;">`;
  svg += `<rect x="30" y="25" width="${w}" height="${p}" fill="#FAF7F2" stroke="#2D2823" stroke-width="2" />`;
  
  // Divisiones
  const doorCount = armario.doors.length;
  const doorWidth = w / doorCount;
  for (let i = 1; i < doorCount; i++) {
    svg += `<line x1="${30 + doorWidth * i}" y1="25" x2="${30 + doorWidth * i}" y2="${25 + p}" stroke="#2D2823" stroke-width="1.2" ${armario.type === 'corredera' ? 'stroke-dasharray="4 2"' : ''} />`;
  }

  // COTAS - Ancho
  svg += `<line x1="30" y1="10" x2="${30 + w}" y2="10" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="30" y1="5" x2="30" y2="15" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${30 + w}" y1="5" x2="${30 + w}" y2="15" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<text x="${30 + w/2}" y="8" text-anchor="middle" font-size="10" font-weight="bold" fill="#2D2823">${ancho}mm</text>`;

  // COTAS - Profundidad
  svg += `<line x1="${w + 45}" y1="25" x2="${w + 45}" y2="${25 + p}" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${w + 40}" y1="25" x2="${w + 50}" y2="25" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${w + 40}" y1="${25 + p}" x2="${w + 50}" y2="${25 + p}" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<text x="${w + 55}" y="${25 + p/2 + 3}" font-size="10" font-weight="bold" fill="#2D2823">${prof}mm</text>`;

  svg += `</svg>`;
  return svg;
}

function CabinetSVGSeccion(armario: any) {
  const prof = Math.round(armario.profundidad * 10);
  const alto = Math.round(armario.alto * 10);
  const scale = Math.min(90 / prof, 130 / alto);
  const p = prof * scale;
  const h = alto * scale;

  let svg = `<svg viewBox="0 0 ${p + 60} ${h + 80}" style="width: 100%; max-height: 150px;">`;
  svg += `<rect x="30" y="25" width="${p}" height="${h}" fill="#FAF7F2" stroke="#2D2823" stroke-width="2" />`;
  
  // Barra colgante
  if (armario.interior.barraColgar) {
    svg += `<line x1="35" y1="${25 + h * 0.18}" x2="${p + 25}" y2="${25 + h * 0.18}" stroke="#B08D57" stroke-width="2" />`;
  }

  // Cajones
  if (armario.interior.cajones > 0) {
    const cajonH = (h * (armario.interior.cajones * armario.interior.cajonHeight / armario.alto)) / armario.interior.cajones;
    for (let i = 1; i < armario.interior.cajones; i++) {
      const y = 25 + h - (cajonH * i);
      svg += `<line x1="30" y1="${y}" x2="${p + 30}" y2="${y}" stroke="#2D2823" stroke-width="1" />`;
    }
  }

  // COTAS - Profundidad
  svg += `<line x1="30" y1="10" x2="${30 + p}" y2="10" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="30" y1="5" x2="30" y2="15" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${30 + p}" y1="5" x2="${30 + p}" y2="15" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<text x="${30 + p/2}" y="8" text-anchor="middle" font-size="10" font-weight="bold" fill="#2D2823">${prof}mm</text>`;

  // COTAS - Alto
  svg += `<line x1="${p + 45}" y1="25" x2="${p + 45}" y2="${25 + h}" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${p + 40}" y1="25" x2="${p + 50}" y2="25" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<line x1="${p + 40}" y1="${25 + h}" x2="${p + 50}" y2="${25 + h}" stroke="#2D2823" stroke-width="0.8" />`;
  svg += `<text x="${p + 55}" y="${25 + h/2 + 3}" font-size="10" font-weight="bold" fill="#2D2823">${alto}mm</text>`;

  svg += `</svg>`;
  return svg;
}