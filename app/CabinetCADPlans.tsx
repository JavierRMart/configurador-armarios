'use client';

export default function CabinetCADPlans({ armario }: any) {
  const ancho = armario.ancho; // 2000 mm
  const alto = armario.alto; // 2400 mm
  const profundidad = armario.profundidad; // 600 mm
  const numPuertas = armario.doors.length;

  const colors = {
    line: '#2D2823',
    lineSoft: '#6B5D4F',
    accent: '#B08D57',
    cotaRoja: '#E63946',
    fill: '#FAF7F2',
    fillPuerta: '#F1EADC',
  };

  // ============ PLANTA (VISTA DESDE ARRIBA) ============
  const plantaScale = 0.15;
  const plantaW = ancho * plantaScale;
  const plantaH = profundidad * plantaScale;
  const plantaPadding = 60;

  const plantaSvgWidth = plantaW + plantaPadding * 2;
  const plantaSvgHeight = plantaH + plantaPadding * 2.5;

  let plantaSvg = `<svg width="${plantaSvgWidth}" height="${plantaSvgHeight}" viewBox="0 0 ${plantaSvgWidth} ${plantaSvgHeight}" style="background: white; border: 1px solid #ddd;">`;

  // Marco exterior
  plantaSvg += `<rect x="${plantaPadding}" y="${plantaPadding}" width="${plantaW}" height="${plantaH}" fill="${colors.fill}" stroke="${colors.line}" stroke-width="2" />`;

  // Rayado técnico (puertas)
  const puertaWidth = plantaW / numPuertas;
  for (let i = 1; i < numPuertas; i++) {
    plantaSvg += `<line x1="${plantaPadding + puertaWidth * i}" y1="${plantaPadding}" x2="${plantaPadding + puertaWidth * i}" y2="${plantaPadding + plantaH}" stroke="${colors.line}" stroke-width="1.5" />`;
  }

  // Etiqueta PLANTA
  plantaSvg += `<text x="${plantaSvgWidth / 2}" y="${plantaPadding - 20}" text-anchor="middle" font-size="14" font-weight="bold" fill="${colors.line}">PLANTA</text>`;

  // Cotas PLANTA - Ancho
  plantaSvg += `<line x1="${plantaPadding}" y1="${plantaPadding + plantaH + 35}" x2="${plantaPadding + plantaW}" y2="${plantaPadding + plantaH + 35}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  plantaSvg += `<line x1="${plantaPadding}" y1="${plantaPadding + plantaH + 30}" x2="${plantaPadding}" y2="${plantaPadding + plantaH + 40}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  plantaSvg += `<line x1="${plantaPadding + plantaW}" y1="${plantaPadding + plantaH + 30}" x2="${plantaPadding + plantaW}" y2="${plantaPadding + plantaH + 40}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  plantaSvg += `<text x="${plantaPadding + plantaW / 2}" y="${plantaPadding + plantaH + 55}" text-anchor="middle" font-size="11" font-weight="bold" fill="${colors.cotaRoja}">${ancho}</text>`;

  // Cotas PLANTA - Profundidad
  plantaSvg += `<line x1="${plantaPadding - 35}" y1="${plantaPadding}" x2="${plantaPadding - 35}" y2="${plantaPadding + plantaH}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  plantaSvg += `<line x1="${plantaPadding - 40}" y1="${plantaPadding}" x2="${plantaPadding - 30}" y2="${plantaPadding}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  plantaSvg += `<line x1="${plantaPadding - 40}" y1="${plantaPadding + plantaH}" x2="${plantaPadding - 30}" y2="${plantaPadding + plantaH}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  plantaSvg += `<text x="${plantaPadding - 55}" y="${plantaPadding + plantaH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="${colors.cotaRoja}" transform="rotate(-90 ${plantaPadding - 55} ${plantaPadding + plantaH / 2})">${profundidad}</text>`;

  plantaSvg += `</svg>`;

  // ============ ALZADO FRONTAL (VISTA DE FRENTE) ============
  const alzadoScale = 0.2;
  const alzadoW = ancho * alzadoScale;
  const alzadoH = alto * alzadoScale;
  const alzadoPadding = 60;

  const alzadoSvgWidth = alzadoW + alzadoPadding * 2;
  const alzadoSvgHeight = alzadoH + alzadoPadding * 2.5;

  let alzadoSvg = `<svg width="${alzadoSvgWidth}" height="${alzadoSvgHeight}" viewBox="0 0 ${alzadoSvgWidth} ${alzadoSvgHeight}" style="background: white; border: 1px solid #ddd;">`;

  // Marco exterior
  alzadoSvg += `<rect x="${alzadoPadding}" y="${alzadoPadding}" width="${alzadoW}" height="${alzadoH}" fill="${colors.fill}" stroke="${colors.line}" stroke-width="2" />`;

  // Divisiones de puertas
  const puertaHeightAlzado = alzadoW / numPuertas;
  for (let i = 1; i < numPuertas; i++) {
    alzadoSvg += `<line x1="${alzadoPadding + puertaHeightAlzado * i}" y1="${alzadoPadding}" x2="${alzadoPadding + puertaHeightAlzado * i}" y2="${alzadoPadding + alzadoH}" stroke="${colors.line}" stroke-width="1.5" />`;
  }

  // Barra colgante (línea de referencia)
  if (armario.interior?.barraColgar) {
    alzadoSvg += `<line x1="${alzadoPadding + 5}" y1="${alzadoPadding + alzadoH * 0.15}" x2="${alzadoPadding + alzadoW - 5}" y2="${alzadoPadding + alzadoH * 0.15}" stroke="${colors.accent}" stroke-width="2" />`;
  }

  // Etiqueta ALZADO
  alzadoSvg += `<text x="${alzadoSvgWidth / 2}" y="${alzadoPadding - 20}" text-anchor="middle" font-size="14" font-weight="bold" fill="${colors.line}">ALZADO FRONTAL</text>`;

  // Cotas ALZADO - Ancho
  alzadoSvg += `<line x1="${alzadoPadding}" y1="${alzadoPadding + alzadoH + 35}" x2="${alzadoPadding + alzadoW}" y2="${alzadoPadding + alzadoH + 35}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  alzadoSvg += `<line x1="${alzadoPadding}" y1="${alzadoPadding + alzadoH + 30}" x2="${alzadoPadding}" y2="${alzadoPadding + alzadoH + 40}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  alzadoSvg += `<line x1="${alzadoPadding + alzadoW}" y1="${alzadoPadding + alzadoH + 30}" x2="${alzadoPadding + alzadoW}" y2="${alzadoPadding + alzadoH + 40}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  alzadoSvg += `<text x="${alzadoPadding + alzadoW / 2}" y="${alzadoPadding + alzadoH + 55}" text-anchor="middle" font-size="11" font-weight="bold" fill="${colors.cotaRoja}">${ancho}</text>`;

  // Cotas ALZADO - Alto
  alzadoSvg += `<line x1="${alzadoPadding + alzadoW + 35}" y1="${alzadoPadding}" x2="${alzadoPadding + alzadoW + 35}" y2="${alzadoPadding + alzadoH}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  alzadoSvg += `<line x1="${alzadoPadding + alzadoW + 30}" y1="${alzadoPadding}" x2="${alzadoPadding + alzadoW + 40}" y2="${alzadoPadding}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  alzadoSvg += `<line x1="${alzadoPadding + alzadoW + 30}" y1="${alzadoPadding + alzadoH}" x2="${alzadoPadding + alzadoW + 40}" y2="${alzadoPadding + alzadoH}" stroke="${colors.cotaRoja}" stroke-width="1" />`;
  alzadoSvg += `<text x="${alzadoPadding + alzadoW + 55}" y="${alzadoPadding + alzadoH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="${colors.cotaRoja}">${alto}</text>`;

  alzadoSvg += `</svg>`;

  // ============ RENDER ============
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
      <div>
        <div dangerouslySetInnerHTML={{ __html: plantaSvg }} />
      </div>
      <div>
        <div dangerouslySetInnerHTML={{ __html: alzadoSvg }} />
      </div>
    </div>
  );
}