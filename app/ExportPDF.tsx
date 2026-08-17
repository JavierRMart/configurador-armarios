'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ============ IDENTIDAD ARVE ============
const ARVE = {
  nombre: 'ARVE',
  claim: 'ARMARIOS Y VESTIDORES EXCLUSIVOS',
  tagline: 'Tu aliado en la creación de espacios exclusivos',
  telefono: '+34 603 274 670',
  email: 'info@armariosyvestidoresarve.es',
  direccion: 'Calle Mónaco 24, 1º planta · Las Rozas de Madrid · 28232',
  web: 'armariosyvestidoresarve.es',
  logo: '/logo-arve.png',
};

async function cargarLogo(): Promise<string> {
  try {
    const res = await fetch(ARVE.logo);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(ARVE.logo);
      fr.readAsDataURL(blob);
    });
  } catch {
    return ARVE.logo;
  }
}

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

export default function ExportPDF({ projectData, armarios, puertas }: any) {
  const [loading, setLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState(ARVE.logo);

  // ---------- Renderiza un bloque HTML como página A4 ----------
  const renderPagina = async (doc: any, html: string, esPrimera: boolean) => {
    const cont = document.createElement('div');
    cont.setAttribute('translate', 'no');
    cont.className = 'notranslate';
    cont.lang = 'es';
    cont.style.position = 'fixed';
    cont.style.left = '-10000px';
    cont.style.top = '0';
    cont.style.width = '210mm';
    cont.style.height = '297mm';
    cont.style.backgroundColor = '#ffffff';
    cont.style.boxSizing = 'border-box';
    cont.style.fontFamily = SANS;
    cont.innerHTML = html;

    document.body.appendChild(cont);

    // Esperar a que carguen las imágenes
    const imgs = Array.from(cont.querySelectorAll('img'));
    await Promise.all(
      imgs.map(
        (img: any) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              })
      )
    );

    const canvas = await html2canvas(cont, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    document.body.removeChild(cont);

    if (!esPrimera) doc.addPage();
    doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  };

  const exportarPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const logoData = await cargarLogo();
      setLogoSrc(logoData);
      let primera = true;

      // ===== 1. PORTADA =====
      await renderPagina(doc, portada(projectData, armarios, logoData), primera);
      primera = false;

      // ===== 2. UNA PÁGINA POR ARMARIO =====
      for (let i = 0; i < armarios.length; i++) {
        await renderPagina(doc, paginaArmario(armarios[i], i, armarios.length, projectData, logoData), false);
      }

      // ===== 3. PUERTAS (si hay) =====
      if (puertas && puertas.length > 0) {
        await renderPagina(doc, paginaPuertas(puertas, projectData, logoData), false);
      }

      // ===== 4. ANEXO TÉCNICO =====
      for (let i = 0; i < armarios.length; i++) {
        await renderPagina(doc, paginaAnexo(armarios[i], i, projectData, logoData), false);
      }

      // ===== 5. CONTRAPORTADA =====
      await renderPagina(doc, contraportada(projectData, logoData), false);

      doc.save(`Propuesta-Arve-${projectData.clientName}-${projectData.date}.pdf`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar el PDF');
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
      {loading ? 'Generando propuesta...' : 'Descargar propuesta en PDF'}
    </button>
  );
}

/* ==========================================================
   HELPERS DE DATOS
   ========================================================== */

function getBaldas(seccion: any): any[] {
  if (Array.isArray(seccion?.interior?.baldas)) return seccion.interior.baldas;
  if (Array.isArray(seccion?.interior?.elementos)) {
    return seccion.interior.elementos
      .filter((e: any) => e.tipo === 'balda')
      .map((e: any) => ({ id: e.id, altura: e.altura || 0, grosor: e.grosor ?? 16 }));
  }
  return [];
}

function getCajonera(seccion: any): any {
  if (seccion?.interior?.cajonera) return seccion.interior.cajonera;
  if (Array.isArray(seccion?.interior?.elementos)) {
    const c = seccion.interior.elementos.find((e: any) => e.tipo === 'cajonera');
    if (c) return { id: c.id, cajones: c.cajones || [] };
  }
  return null;
}

function hCajonera(cajonera: any): number {
  if (!cajonera) return 0;
  return (cajonera.cajones || []).reduce((s: number, c: any) => s + (c.altura || 0), 0);
}

function resumenGlobal(armarios: any[]) {
  let baldas = 0, cajoneras = 0, cajones = 0, barras = 0, secciones = 0;
  armarios.forEach((a: any) => {
    (a.secciones || []).forEach((s: any) => {
      secciones++;
      baldas += getBaldas(s).length;
      const c = getCajonera(s);
      if (c) { cajoneras++; cajones += (c.cajones || []).length; }
      if (s.interior?.tieneBarraAqui) barras++;
    });
  });
  return { baldas, cajoneras, cajones, barras, secciones };
}

/* ==========================================================
   COMPONENTES HTML REUTILIZABLES
   ========================================================== */

function cabeceraDiscreta(texto: string, logoSrc: string) {
  return `
    <div style="display:flex; justify-content:space-between; align-items:center;
                padding-bottom:4mm; border-bottom:0.4mm solid ${C.linea}; margin-bottom:8mm;">
      <img src="${logoSrc}" style="height:9mm; width:auto;" />
      <div style="font-family:${SANS}; font-size:7.5px; letter-spacing:2px;
                  text-transform:uppercase; color:${C.humo};">${texto}</div>
    </div>
  `;
}

function pieDiscreto(pagina: string) {
  return `
    <div style="position:absolute; bottom:12mm; left:15mm; right:15mm;
                display:flex; justify-content:space-between; align-items:center;
                padding-top:3mm; border-top:0.3mm solid ${C.linea};
                font-family:${SANS}; font-size:7px; color:${C.humo}; letter-spacing:1px;">
      <span>${ARVE.nombre} · ${ARVE.telefono}</span>
      <span>${pagina}</span>
    </div>
  `;
}

/* ==========================================================
   PÁGINA 1 · PORTADA
   ========================================================== */

function portada(p: any, armarios: any[], logoSrc: string): string {
  const r = resumenGlobal(armarios);

  return `
    <div style="width:210mm; height:297mm; background:${C.crema}; position:relative;
                box-sizing:border-box; padding:0;">

      <!-- Banda superior -->
      <div style="height:6mm; background:${C.tinta};"></div>

      <!-- Logo -->
      <div style="display:flex; justify-content:center; padding:28mm 0 0 0;">
        <img src="${logoSrc}" style="height:22mm; width:auto;" />
      </div>

      <!-- Filete dorado -->
      <div style="width:24mm; height:0.6mm; background:${C.oro}; margin:14mm auto;"></div>

      <!-- Título -->
      <div style="text-align:center; padding:0 25mm;">
        <div style="font-family:${SANS}; font-size:9px; letter-spacing:5px;
                    text-transform:uppercase; color:${C.humo}; margin-bottom:8mm;">
          Propuesta de diseño
        </div>
        <div style="font-family:${SERIF}; font-size:40px; color:${C.tinta};
                    line-height:1.15; letter-spacing:0.5px;">
          ${p.clientName}
        </div>
        ${p.address ? `
        <div style="font-family:${SERIF}; font-size:14px; color:${C.humo};
                    margin-top:6mm; font-style:italic;">
          ${p.address}
        </div>` : ''}
      </div>

      <!-- Filete dorado -->
      <div style="width:24mm; height:0.6mm; background:${C.oro}; margin:14mm auto;"></div>

      <!-- Resumen del proyecto -->
      <div style="display:flex; justify-content:center; gap:16mm; padding:0 25mm;">
        ${bloqueCifra(armarios.length, armarios.length === 1 ? 'Armario' : 'Armarios')}
        ${bloqueCifra(r.secciones, r.secciones === 1 ? 'Sección' : 'Secciones')}
        ${bloqueCifra(r.baldas, r.baldas === 1 ? 'Balda' : 'Baldas')}
        ${r.cajoneras > 0 ? bloqueCifra(r.cajones, r.cajones === 1 ? 'Cajón' : 'Cajones') : ''}
      </div>

      <!-- Tagline -->
      <div style="position:absolute; bottom:46mm; left:0; right:0; text-align:center;">
        <div style="font-family:${SERIF}; font-size:13px; color:${C.humo};
                    font-style:italic; letter-spacing:0.3px;">
          «${ARVE.tagline}»
        </div>
      </div>

      <!-- Pie de portada -->
      <div style="position:absolute; bottom:0; left:0; right:0;
                  background:${C.tinta}; color:${C.crema}; padding:8mm 15mm;
                  font-family:${SANS}; font-size:8px; letter-spacing:0.8px;
                  display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="letter-spacing:2.5px; color:${C.oro}; margin-bottom:1.5mm;">${ARVE.claim}</div>
          <div style="opacity:0.75;">${ARVE.direccion}</div>
        </div>
        <div style="text-align:right;">
          <div>${ARVE.telefono}</div>
          <div style="opacity:0.75;">${ARVE.web}</div>
        </div>
      </div>

      <!-- Fecha discreta -->
      <div style="position:absolute; top:14mm; right:15mm;
                  font-family:${SANS}; font-size:8px; letter-spacing:2px; color:${C.humo};">
        ${p.date}
      </div>
    </div>
  `;
}

function bloqueCifra(valor: any, etiqueta: string): string {
  return `
    <div style="text-align:center;">
      <div style="font-family:${SERIF}; font-size:30px; color:${C.oro}; line-height:1;">${valor}</div>
      <div style="font-family:${SANS}; font-size:7.5px; letter-spacing:2px;
                  text-transform:uppercase; color:${C.humo}; margin-top:3mm;">${etiqueta}</div>
    </div>
  `;
}

/* ==========================================================
   PÁGINA POR ARMARIO
   ========================================================== */

function paginaArmario(armario: any, idx: number, total: number, p: any, logoSrc: string): string {
  const secciones = armario.secciones || [];

  return `
    <div style="width:210mm; height:297mm; background:white; position:relative;
                box-sizing:border-box; padding:15mm;">

      ${cabeceraDiscreta(`Armario ${idx + 1} de ${total}`, logoSrc)}

      <!-- Título del armario -->
      <div style="margin-bottom:8mm;">
        <div style="font-family:${SANS}; font-size:8px; letter-spacing:3px;
                    text-transform:uppercase; color:${C.oro}; margin-bottom:2mm;">
          ${armario.type === 'abatible' ? 'Puertas abatibles' : 'Puertas correderas'}
        </div>
        <div style="font-family:${SERIF}; font-size:26px; color:${C.tinta}; line-height:1.2;">
          ${armario.ubicacion}${armario.name ? `<span style="color:${C.humo}; font-style:italic;"> · ${armario.name}</span>` : ''}
        </div>
      </div>

      <!-- ALZADO PROTAGONISTA -->
      <div style="background:${C.crema}; border:0.4mm solid ${C.linea};
                  padding:8mm 6mm 6mm 6mm; margin-bottom:8mm;">
        ${alzadoElegante(armario)}
      </div>

      <!-- Medidas en línea -->
      <div style="display:flex; gap:0; margin-bottom:7mm; border:0.4mm solid ${C.linea};">
        ${celdaMedida('Ancho', armario.ancho)}
        ${celdaMedida('Alto', armario.alto)}
        ${celdaMedida('Fondo', armario.profundidad, true)}
      </div>

      <!-- Distribución interior + acabados -->
      <div style="display:grid; grid-template-columns: 1.35fr 1fr; gap:8mm;">

        <div>
          <div style="font-family:${SANS}; font-size:8px; letter-spacing:2.5px;
                      text-transform:uppercase; color:${C.oro};
                      padding-bottom:2.5mm; border-bottom:0.3mm solid ${C.linea}; margin-bottom:4mm;">
            Distribución interior
          </div>
          ${secciones.map((s: any) => tarjetaSeccion(s)).join('')}
        </div>

        <div>
          <div style="font-family:${SANS}; font-size:8px; letter-spacing:2.5px;
                      text-transform:uppercase; color:${C.oro};
                      padding-bottom:2.5mm; border-bottom:0.3mm solid ${C.linea}; margin-bottom:4mm;">
            Acabados
          </div>
          ${filaAcabado('Interior textil', armario.finishes?.interiorTextil || 'Por definir')}
          ${filaAcabado('Tirador', armario.finishes?.handle || 'Por definir')}
          ${filaAcabado('Costados vistos', armario.finishes?.costadosVistos ? 'Sí' : 'No')}

          ${armario.notes ? `
            <div style="margin-top:6mm; background:${C.crema}; border-left:1mm solid ${C.oro};
                        padding:4mm;">
              <div style="font-family:${SANS}; font-size:7px; letter-spacing:2px;
                          text-transform:uppercase; color:${C.oro}; margin-bottom:2mm;">
                Observaciones
              </div>
              <div style="font-family:${SERIF}; font-size:10px; color:${C.carbon};
                          line-height:1.5; font-style:italic;">
                ${armario.notes}
              </div>
            </div>` : ''}
        </div>
      </div>

      ${pieDiscreto(`${p.clientName} · ${p.date}`)}
    </div>
  `;
}

function celdaMedida(etiqueta: string, valor: any, ultima = false): string {
  return `
    <div style="flex:1; text-align:center; padding:5mm 0;
                ${ultima ? '' : `border-right:0.3mm solid ${C.linea};`}">
      <div style="font-family:${SANS}; font-size:7px; letter-spacing:2.5px;
                  text-transform:uppercase; color:${C.humo}; margin-bottom:2.5mm;">${etiqueta}</div>
      <div style="font-family:${SERIF}; font-size:19px; color:${C.tinta};">
        ${valor}<span style="font-size:10px; color:${C.humo};"> mm</span>
      </div>
    </div>
  `;
}

function tarjetaSeccion(seccion: any): string {
  const cajonera = getCajonera(seccion);
  const baldas = getBaldas(seccion);
  const hCaj = hCajonera(cajonera);

  const items: string[] = [];

  if (cajonera && hCaj > 0) {
    const n = (cajonera.cajones || []).length;
    items.push(item(`Cajonera de ${n} ${n === 1 ? 'cajón' : 'cajones'}`, `${hCaj} mm`));
  }
  if (baldas.length > 0) {
    items.push(item(`${baldas.length} ${baldas.length === 1 ? 'balda' : 'baldas'}`, ''));
  }
  if (seccion.interior?.tieneBarraAqui) {
    items.push(item('Barra de colgar', ''));
  }
  if (items.length === 0) {
    items.push(`<div style="font-family:${SERIF}; font-size:10px; color:${C.humo};
                            font-style:italic;">Espacio diáfano</div>`);
  }

  return `
    <div style="margin-bottom:4mm; padding-bottom:4mm; border-bottom:0.2mm solid ${C.linea};">
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2.5mm;">
        <span style="font-family:${SERIF}; font-size:12px; color:${C.tinta};">
          Sección ${seccion.numero}
        </span>
        <span style="font-family:${SANS}; font-size:8px; color:${C.humo}; letter-spacing:1px;">
          ${seccion.ancho} mm
        </span>
      </div>
      ${items.join('')}
    </div>
  `;
}

function item(texto: string, detalle: string): string {
  return `
    <div style="display:flex; align-items:baseline; gap:2.5mm; margin-bottom:1.5mm;">
      <span style="color:${C.oro}; font-size:9px;">◆</span>
      <span style="font-family:${SANS}; font-size:9px; color:${C.carbon}; flex:1;">${texto}</span>
      ${detalle ? `<span style="font-family:${SANS}; font-size:8px; color:${C.humo};">${detalle}</span>` : ''}
    </div>
  `;
}

function filaAcabado(etiqueta: string, valor: string): string {
  return `
    <div style="margin-bottom:4mm;">
      <div style="font-family:${SANS}; font-size:7px; letter-spacing:1.5px;
                  text-transform:uppercase; color:${C.humo}; margin-bottom:1.5mm;">${etiqueta}</div>
      <div style="font-family:${SERIF}; font-size:13px; color:${C.tinta};">${valor}</div>
    </div>
  `;
}

/* ==========================================================
   ALZADO CON CADENAS DE COTAS
   ========================================================== */

function alzadoElegante(armario: any): string {
  const ancho = armario.ancho;
  const alto = armario.alto;
  const secciones = armario.secciones || [];
  const nSec = secciones.length || armario.numSecciones || 1;

  const W = 620;
  const H = 360;
  const padL = 30, padR = 58, padT = 34, padB = 58;

  const anchoCadena = 26;
  const dispW = W - padL - padR - anchoCadena * nSec;
  const dispH = H - padT - padB;
  const escala = Math.min(dispW / ancho, dispH / alto);

  const w = ancho * escala;
  const h = alto * escala;
  const x0 = padL + anchoCadena * nSec + (dispW - w) / 2;
  const y0 = padT + (dispH - h) / 2;
  const suelo = y0 + h;
  const secW = w / nSec;

  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; display:block;">`;

  s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#FFFFFF" stroke="${C.carbon}" stroke-width="1.6"/>`;

  secciones.forEach((sec: any, i: number) => {
    const sx = x0 + secW * i;
    const cajonera = getCajonera(sec);
    const baldas = getBaldas(sec);
    const hCaj = hCajonera(cajonera);

    if (cajonera && hCaj > 0) {
      const hd = hCaj * escala;
      const yTop = suelo - hd;
      if (yTop >= y0) {
        s += `<rect x="${sx}" y="${yTop}" width="${secW}" height="${hd}" fill="${C.arena}" stroke="${C.carbon}" stroke-width="1"/>`;
        const cajones = cajonera.cajones || [];
        cajones.forEach((c: any, j: number) => {
          if (j < cajones.length - 1) {
            const acum = cajones.slice(0, j + 1).reduce((t: number, x: any) => t + (x.altura || 0), 0);
            const yl = suelo - acum * escala;
            s += `<line x1="${sx}" y1="${yl}" x2="${sx + secW}" y2="${yl}" stroke="${C.carbon}" stroke-width="0.7"/>`;
          }
          const ant = cajones.slice(0, j).reduce((t: number, x: any) => t + (x.altura || 0), 0);
          const yc = suelo - (ant + (c.altura || 0) / 2) * escala;
          s += `<line x1="${sx + secW * 0.34}" y1="${yc}" x2="${sx + secW * 0.66}" y2="${yc}" stroke="${C.oro}" stroke-width="2" stroke-linecap="round"/>`;
        });
      }
    }

    let acum = hCaj;
    baldas.forEach((b: any) => {
      acum += b.altura || 0;
      const y = suelo - acum * escala;
      const g = Math.max((b.grosor || 16) * escala, 1.2);
      if (y < y0) return;
      s += `<rect x="${sx}" y="${y - g}" width="${secW}" height="${g}" fill="${C.humo}" stroke="none"/>`;
      acum += b.grosor || 16;
    });

    if (sec.interior?.tieneBarraAqui) {
      const yb = y0 + h * 0.13;
      s += `<line x1="${sx + 5}" y1="${yb}" x2="${sx + secW - 5}" y2="${yb}" stroke="${C.oro}" stroke-width="2.4" stroke-linecap="round"/>`;
      s += `<circle cx="${sx + 5}" cy="${yb}" r="1.8" fill="${C.oro}"/>`;
      s += `<circle cx="${sx + secW - 5}" cy="${yb}" r="1.8" fill="${C.oro}"/>`;
    }

    s += `<text x="${sx + secW / 2}" y="${y0 - 10}" text-anchor="middle"
            font-family="${SANS}" font-size="7.5" letter-spacing="1.5" fill="${C.humo}">${sec.numero}</text>`;
  });

  secciones.forEach((sec: any, i: number) => {
    const cajonera = getCajonera(sec);
    const baldas = getBaldas(sec);
    const hCaj = hCajonera(cajonera);

    const tramos: { mm: number; tipo: 'hueco' | 'pieza' }[] = [];

    if (cajonera && hCaj > 0) {
      (cajonera.cajones || []).forEach((c: any) => {
        tramos.push({ mm: c.altura || 0, tipo: 'hueco' });
      });
    }
    baldas.forEach((b: any) => {
      tramos.push({ mm: b.altura || 0, tipo: 'hueco' });
      tramos.push({ mm: b.grosor || 16, tipo: 'pieza' });
    });

    const ocupado = tramos.reduce((t, x) => t + x.mm, 0);
    if (ocupado < alto) {
      tramos.push({ mm: alto - ocupado, tipo: 'hueco' });
    }

    if (tramos.length === 0) return;

    const xLinea = x0 - 8 - (nSec - 1 - i) * anchoCadena;

    s += `<line x1="${xLinea}" y1="${y0}" x2="${xLinea}" y2="${suelo}" stroke="${C.linea}" stroke-width="0.5"/>`;

    let acumMM = 0;
    tramos.forEach((t) => {
      const yInf = suelo - acumMM * escala;
      acumMM += t.mm;
      const ySup = suelo - acumMM * escala;
      const centro = (yInf + ySup) / 2;
      const altoTramo = yInf - ySup;

      s += `<line x1="${xLinea - 2.5}" y1="${ySup}" x2="${xLinea + 2.5}" y2="${ySup}" stroke="${C.humo}" stroke-width="0.5"/>`;

      if (altoTramo >= 9) {
        s += `<text x="${xLinea - 3.5}" y="${centro + 2.4}" text-anchor="end"
                font-family="${SANS}" font-size="${t.tipo === 'pieza' ? 5.2 : 6.4}"
                fill="${t.tipo === 'pieza' ? C.linea : C.humo}">${t.mm}</text>`;
      }
    });

    s += `<line x1="${xLinea - 2.5}" y1="${suelo}" x2="${xLinea + 2.5}" y2="${suelo}" stroke="${C.humo}" stroke-width="0.5"/>`;
  });

  for (let i = 1; i < nSec; i++) {
    s += `<line x1="${x0 + secW * i}" y1="${y0}" x2="${x0 + secW * i}" y2="${suelo}" stroke="${C.carbon}" stroke-width="1.2"/>`;
  }

  const yParcial = suelo + 18;
  s += `<line x1="${x0}" y1="${yParcial}" x2="${x0 + w}" y2="${yParcial}" stroke="${C.linea}" stroke-width="0.5"/>`;
  secciones.forEach((sec: any, i: number) => {
    const sxa = x0 + secW * i;
    s += `<line x1="${sxa}" y1="${yParcial - 2.5}" x2="${sxa}" y2="${yParcial + 2.5}" stroke="${C.humo}" stroke-width="0.5"/>`;
    s += `<rect x="${sxa + secW / 2 - 15}" y="${yParcial - 5}" width="30" height="10" fill="${C.crema}"/>`;
    s += `<text x="${sxa + secW / 2}" y="${yParcial + 2.6}" text-anchor="middle"
            font-family="${SANS}" font-size="6.4" fill="${C.humo}">${sec.ancho}</text>`;
  });
  s += `<line x1="${x0 + w}" y1="${yParcial - 2.5}" x2="${x0 + w}" y2="${yParcial + 2.5}" stroke="${C.humo}" stroke-width="0.5"/>`;

  const yc = suelo + 36;
  s += `<line x1="${x0}" y1="${yc}" x2="${x0 + w}" y2="${yc}" stroke="${C.humo}" stroke-width="0.6"/>`;
  s += `<line x1="${x0}" y1="${yc - 4}" x2="${x0}" y2="${yc + 4}" stroke="${C.humo}" stroke-width="0.6"/>`;
  s += `<line x1="${x0 + w}" y1="${yc - 4}" x2="${x0 + w}" y2="${yc + 4}" stroke="${C.humo}" stroke-width="0.6"/>`;
  s += `<rect x="${x0 + w / 2 - 24}" y="${yc - 7}" width="48" height="14" fill="${C.crema}"/>`;
  s += `<text x="${x0 + w / 2}" y="${yc + 4}" text-anchor="middle" font-family="${SERIF}" font-size="11" fill="${C.tinta}">${ancho}</text>`;

  const xcTot = x0 + w + 24;
  s += `<line x1="${xcTot}" y1="${y0}" x2="${xcTot}" y2="${suelo}" stroke="${C.humo}" stroke-width="0.6"/>`;
  s += `<line x1="${xcTot - 4}" y1="${y0}" x2="${xcTot + 4}" y2="${y0}" stroke="${C.humo}" stroke-width="0.6"/>`;
  s += `<line x1="${xcTot - 4}" y1="${suelo}" x2="${xcTot + 4}" y2="${suelo}" stroke="${C.humo}" stroke-width="0.6"/>`;
  s += `<rect x="${xcTot - 9}" y="${y0 + h / 2 - 24}" width="18" height="48" fill="${C.crema}"/>`;
  s += `<text x="${xcTot}" y="${y0 + h / 2}" text-anchor="middle" font-family="${SERIF}" font-size="11" fill="${C.tinta}"
          transform="rotate(-90 ${xcTot} ${y0 + h / 2})">${alto}</text>`;

  s += `<line x1="${x0 - 10}" y1="${suelo}" x2="${x0 + w + 8}" y2="${suelo}" stroke="${C.carbon}" stroke-width="2"/>`;

  s += `<text x="${W / 2}" y="${H - 6}" text-anchor="middle" font-family="${SANS}"
          font-size="7" letter-spacing="3" fill="${C.humo}">ALZADO FRONTAL · COTAS EN MM</text>`;

  s += `</svg>`;
  return s;
}

/* ==========================================================
   PÁGINA DE PUERTAS
   ========================================================== */

function paginaPuertas(puertas: any[], p: any, logoSrc: string): string {
  const filas = puertas.map((pu: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? C.crema : 'white'};">
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; font-family:${SERIF}; font-size:11px;">${pu.unidades ?? '—'}</td>
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; font-size:9px;">${pu.ubicacion || '—'}</td>
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; font-size:9px;">${pu.modelo || '—'}</td>
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; font-size:9px;">${pu.color || '—'}</td>
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; font-size:9px;">${pu.tipo || '—'}</td>
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; font-size:9px;">${pu.subtipo || '—'}</td>
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right; font-family:${SERIF}; font-size:11px;">${pu.alto || '—'}</td>
      <td style="padding:3.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right; font-family:${SERIF}; font-size:11px;">${pu.ancho || '—'}</td>
    </tr>
  `).join('');

  const th = (t: string, right = false) => `
    <th style="padding:3mm 3.5mm; text-align:${right ? 'right' : 'left'};
               font-family:${SANS}; font-size:7px; letter-spacing:1.5px;
               text-transform:uppercase; color:${C.oro}; font-weight:normal;
               border-bottom:0.4mm solid ${C.carbon};">${t}</th>`;

  return `
    <div style="width:210mm; height:297mm; background:white; position:relative;
                box-sizing:border-box; padding:15mm;">
      ${cabeceraDiscreta('Puertas', logoSrc)}

      <div style="font-family:${SERIF}; font-size:24px; color:${C.tinta}; margin-bottom:8mm;">
        Relación de puertas
      </div>

      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>
          ${th('Ud.')}${th('Ubicación')}${th('Modelo')}${th('Color')}
          ${th('Tipo')}${th('Subtipo')}${th('Alto', true)}${th('Ancho', true)}
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>

      <div style="margin-top:5mm; font-family:${SANS}; font-size:7.5px; color:${C.humo};
                  letter-spacing:0.5px;">Medidas expresadas en milímetros.</div>

      ${pieDiscreto(`${p.clientName} · ${p.date}`)}
    </div>
  `;
}

/* ==========================================================
   ANEXO TÉCNICO
   ========================================================== */

function paginaAnexo(armario: any, idx: number, p: any, logoSrc: string): string {
  const secciones = armario.secciones || [];
  const prof = armario.profundidad;

  const bloques = secciones.map((sec: any) => {
    const cajonera = getCajonera(sec);
    const baldas = getBaldas(sec);
    const hCaj = hCajonera(cajonera);
    const total = hCaj + baldas.reduce((s: number, b: any) => s + (b.altura || 0), 0);
    const excede = total > armario.alto;

    let filas = '';

    if (cajonera && hCaj > 0) {
      const cajones = cajonera.cajones || [];
      const det = cajones.map((c: any, i: number) => `C${i + 1}: ${c.altura || 0}`).join(' · ');
      filas += `
        <tr style="background:${C.arena};">
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea};"><strong>Cajonera</strong></td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">${hCaj}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">0</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;"><strong>${hCaj}</strong></td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">${sec.ancho}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">${prof}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea};">${cajones.length} cajones · ${det}</td>
        </tr>`;
    }

    let acum = hCaj;
    baldas.forEach((b: any, i: number) => {
      const base = acum;
      acum += b.altura || 0;
      filas += `
        <tr style="background:${i % 2 === 0 ? 'white' : C.crema};">
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea};">Balda ${i + 1}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">${b.altura || 0}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">${base}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;"><strong>${acum}</strong></td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">${sec.ancho}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea}; text-align:right;">${prof}</td>
          <td style="padding:2.5mm; border-bottom:0.2mm solid ${C.linea};">Grosor ${b.grosor ?? 16} mm</td>
        </tr>`;
    });

    if (!filas) {
      filas = `<tr><td colspan="7" style="padding:3mm; text-align:center; color:${C.humo};
                 font-style:italic;">Sección sin elementos interiores</td></tr>`;
    }

    const th = (t: string, right = false) => `
      <th style="padding:2.5mm; text-align:${right ? 'right' : 'left'};
                 font-family:${SANS}; font-size:6.5px; letter-spacing:1px;
                 text-transform:uppercase; color:${C.oro}; font-weight:normal;
                 border-bottom:0.4mm solid ${C.carbon};">${t}</th>`;

    return `
      <div style="margin-bottom:7mm;">
        <div style="display:flex; justify-content:space-between; align-items:baseline;
                    margin-bottom:2.5mm;">
          <span style="font-family:${SERIF}; font-size:13px; color:${C.tinta};">
            Sección ${sec.numero}</span>
          <span style="font-family:${SANS}; font-size:7.5px; color:${C.humo}; letter-spacing:1px;">
            ${sec.ancho} mm · Barra: ${sec.interior?.tieneBarraAqui ? 'Sí' : 'No'}</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-family:${SANS}; font-size:8px; color:${C.carbon};">
          <thead><tr>
            ${th('Elemento')}${th('Hueco', true)}${th('Arranca', true)}${th('Cota suelo', true)}
            ${th('Ancho', true)}${th('Fondo', true)}${th('Detalle')}
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
        <div style="margin-top:2mm; font-family:${SANS}; font-size:7.5px;
                    color:${excede ? '#C0392B' : C.humo}; letter-spacing:0.5px;">
          Ocupado ${total} mm de ${armario.alto} mm ${excede
            ? '· REVISAR: supera el alto disponible'
            : `· libre por encima ${armario.alto - total} mm`}
        </div>
      </div>`;
  }).join('');

  return `
    <div style="width:210mm; height:297mm; background:white; position:relative;
                box-sizing:border-box; padding:15mm;">
      ${cabeceraDiscreta('Anexo técnico', logoSrc)}

      <div style="margin-bottom:7mm;">
        <div style="font-family:${SERIF}; font-size:22px; color:${C.tinta};">
          Detalle de medidas · ${armario.ubicacion}
        </div>
        <div style="font-family:${SANS}; font-size:8px; color:${C.humo};
                    letter-spacing:1px; margin-top:2mm;">
          ${armario.ancho} × ${armario.alto} × ${armario.profundidad} mm
        </div>
      </div>

      ${bloques}

      <div style="position:absolute; bottom:24mm; left:15mm; right:15mm;
                  font-family:${SANS}; font-size:7px; color:${C.humo}; line-height:1.6;">
        Todas las cotas en milímetros. «Cota suelo» indica la altura desde el suelo interior del armario.
        La cajonera se apoya sobre el suelo del mueble; las baldas se acotan a partir de ella.
      </div>

      ${pieDiscreto(`${p.clientName} · ${p.date}`)}
    </div>
  `;
}

/* ==========================================================
   CONTRAPORTADA
   ========================================================== */

function contraportada(p: any, logoSrc: string): string {
  return `
    <div style="width:210mm; height:297mm; background:${C.tinta}; color:${C.crema};
                position:relative; box-sizing:border-box; padding:15mm;">

      <div style="position:absolute; top:0; left:0; right:0; height:6mm; background:${C.oro};"></div>

      <div style="display:flex; justify-content:center; padding-top:70mm;">
        <div style="background:white; padding:7mm 10mm; display:flex;">
          <img src="${logoSrc}" style="height:18mm; width:auto;" />
        </div>
      </div>

      <div style="width:24mm; height:0.6mm; background:${C.oro}; margin:16mm auto;"></div>

      <div style="text-align:center; padding:0 30mm;">
        <div style="font-family:${SERIF}; font-size:17px; font-style:italic;
                    line-height:1.7; opacity:0.92;">
          Gracias por confiar en nosotros para diseñar su espacio.
        </div>
        <div style="font-family:${SANS}; font-size:9px; line-height:2;
                    letter-spacing:0.5px; opacity:0.7; margin-top:10mm;">
          Esta propuesta es orientativa y podrá ajustarse tras la medición definitiva en obra.
        </div>
      </div>

      <div style="position:absolute; bottom:30mm; left:15mm; right:15mm; text-align:center;">
        <div style="font-family:${SANS}; font-size:8px; letter-spacing:3.5px;
                    text-transform:uppercase; color:${C.oro}; margin-bottom:7mm;">
          ${ARVE.claim}
        </div>
        <div style="font-family:${SERIF}; font-size:15px; margin-bottom:3mm;">${ARVE.telefono}</div>
        <div style="font-family:${SANS}; font-size:9px; opacity:0.8; line-height:1.9;">
          ${ARVE.email}<br/>
          ${ARVE.direccion}<br/>
          <span style="opacity:0.7;">Siempre con cita previa</span>
        </div>
      </div>
    </div>
  `;
}