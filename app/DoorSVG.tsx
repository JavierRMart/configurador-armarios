export default function DoorSVG({ puerta }: any) {
  const ancho = puerta.ancho;
  const alto = puerta.alto;
  const cerco = puerta.anchoCerco;

  const scale = Math.min(150 / ancho, 200 / alto);
  const w = ancho * scale;
  const h = alto * scale;
  const c = cerco * scale;

  const startX = 60;
  const startY = 40;

  const colors = {
    line: '#2D2823',
    accent: '#B08D57',
    fill: '#FAF7F2',
    vidrio: '#E8F4F8',
  };

  let svg = `<svg viewBox="0 0 ${w + 120} ${h + 100}" style="width: 100%; max-height: 250px;">`;

  // Marco del cerco
  svg += `<rect x="${startX}" y="${startY}" width="${w}" height="${h}" fill="${colors.fill}" stroke="${colors.line}" stroke-width="2" />`;

  // Cerco (línea interior)
  const cercoX = startX + c;
  const cercoY = startY + c;
  const cercoW = w - c * 2;
  const cercoH = h - c * 2;
  svg += `<rect x="${cercoX}" y="${cercoY}" width="${cercoW}" height="${cercoH}" fill="white" stroke="${colors.line}" stroke-width="1.5" />`;

  // TIPO DE PUERTA
  if (puerta.tipo === 'CIEGA') {
    // Puerta ciega: relleno liso
    svg += `<rect x="${cercoX + 2}" y="${cercoY + 2}" width="${cercoW - 4}" height="${cercoH - 4}" fill="${colors.fill}" stroke="none" />`;

    // Pernios (bisagras)
    const pernioY1 = cercoY + 20;
    const pernioY2 = cercoY + cercoH - 20;
    const pernioX = cercoX + 8;
    svg += `<circle cx="${pernioX}" cy="${pernioY1}" r="3" fill="${colors.accent}" />`;
    svg += `<circle cx="${pernioX}" cy="${pernioY2}" r="3" fill="${colors.accent}" />`;

    // Tirador
    const tiradorX = cercoX + cercoW - 12;
    const tiradorY = cercoY + cercoH / 2;
    svg += `<rect x="${tiradorX - 2}" y="${tiradorY - 10}" width="3" height="20" fill="${colors.accent}" rx="1" />`;
  } else {
    // Puerta vidriera: con vidrio
    svg += `<rect x="${cercoX + 2}" y="${cercoY + 2}" width="${cercoW - 4}" height="${cercoH - 4}" fill="${colors.vidrio}" stroke="none" />`;

    // Líneas de vidrio según subtipo
    const numVidrios = puerta.subtipo === 'V-1' ? 1 : puerta.subtipo === 'V-2' ? 2 : puerta.subtipo === 'V-3' ? 3 : 4;
    const vidrioAncho = (cercoW - 4) / numVidrios;

    for (let i = 1; i < numVidrios; i++) {
      const x = cercoX + 2 + vidrioAncho * i;
      svg += `<line x1="${x}" y1="${cercoY + 2}" x2="${x}" y2="${cercoY + cercoH - 2}" stroke="${colors.line}" stroke-width="0.8" />`;
    }

    // Tirador vidriera
    const tiradorX = cercoX + cercoW - 12;
    const tiradorY = cercoY + cercoH / 2;
    svg += `<rect x="${tiradorX - 2}" y="${tiradorY - 12}" width="3" height="24" fill="${colors.accent}" rx="1" />`;
  }

  // COTAS
  // Alto
  svg += `<line x1="${startX - 25}" y1="${startY}" x2="${startX - 25}" y2="${startY + h}" stroke="${colors.line}" stroke-width="0.6" />`;
  svg += `<line x1="${startX - 30}" y1="${startY}" x2="${startX - 20}" y2="${startY}" stroke="${colors.line}" stroke-width="0.6" />`;
  svg += `<line x1="${startX - 30}" y1="${startY + h}" x2="${startX - 20}" y2="${startY + h}" stroke="${colors.line}" stroke-width="0.6" />`;
  svg += `<text x="${startX - 40}" y="${startY + h / 2}" font-size="10" font-weight="bold" fill="${colors.line}">${alto}</text>`;

  // Ancho
  svg += `<line x1="${startX}" y1="${startY + h + 30}" x2="${startX + w}" y2="${startY + h + 30}" stroke="${colors.line}" stroke-width="0.6" />`;
  svg += `<line x1="${startX}" y1="${startY + h + 25}" x2="${startX}" y2="${startY + h + 35}" stroke="${colors.line}" stroke-width="0.6" />`;
  svg += `<line x1="${startX + w}" y1="${startY + h + 25}" x2="${startX + w}" y2="${startY + h + 35}" stroke="${colors.line}" stroke-width="0.6" />`;
  svg += `<text x="${startX + w / 2}" y="${startY + h + 50}" text-anchor="middle" font-size="10" font-weight="bold" fill="${colors.line}">${ancho}</text>`;

  // Tipo y subtipo
  svg += `<text x="${startX + w / 2}" y="${startY - 15}" text-anchor="middle" font-size="11" font-weight="bold" fill="${colors.line}">${puerta.tipo} - ${puerta.subtipo}</text>`;

  svg += `</svg>`;

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}