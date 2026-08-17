export default function CabinetSVG({ armario, forPrint = false }: any) {
  const ancho = armario.ancho;
  const alto = armario.alto;
  const numSecciones = armario.numSecciones || armario.secciones?.length || 1;

  const padding = forPrint ? 60 : 70;
  const maxWidth = forPrint ? 300 : 280;
  const maxHeight = forPrint ? 380 : 320;

  const scale = Math.min(maxWidth / ancho, maxHeight / alto);
  const drawWidth = ancho * scale;
  const drawHeight = alto * scale;

  const svgWidth = drawWidth + padding * 2;
  const svgHeight = drawHeight + padding * 2.5;

  const startX = padding;
  const startY = padding;

  const colors = {
    line: '#2D2823',
    lineSoft: '#6B5D4F',
    accent: '#B08D57',
    fill: '#FAF7F2',
    fillBalda: '#F1EADC',
    fillCajonera: '#E8DCC8',
  };

  const seccionWidth = drawWidth / numSecciones;
  const isCorredera = armario.type === 'corredera';

  // ============ HELPERS (mismos criterios que el editor) ============
  const getBaldas = (seccion: any): any[] => {
    if (Array.isArray(seccion?.interior?.baldas)) return seccion.interior.baldas;
    if (Array.isArray(seccion?.interior?.elementos)) {
      return seccion.interior.elementos
        .filter((e: any) => e.tipo === 'balda')
        .map((e: any) => ({ id: e.id, altura: e.altura || 0, grosor: e.grosor ?? 16 }));
    }
    return [];
  };

  const getCajonera = (seccion: any): any => {
    if (seccion?.interior?.cajonera) return seccion.interior.cajonera;
    if (Array.isArray(seccion?.interior?.elementos)) {
      const c = seccion.interior.elementos.find((e: any) => e.tipo === 'cajonera');
      if (c) return { id: c.id, cajones: c.cajones || [] };
    }
    return null;
  };

  const alturaCajonera = (cajonera: any): number =>
    !cajonera ? 0 : (cajonera.cajones || []).reduce((s: number, c: any) => s + (c.altura || 0), 0);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {/* Cuerpo del armario */}
      <rect
        x={startX}
        y={startY}
        width={drawWidth}
        height={drawHeight}
        fill={colors.fill}
        stroke={colors.line}
        strokeWidth="1.5"
      />

      {/* SECCIONES */}
      {armario.secciones && armario.secciones.map((seccion: any, secIdx: number) => {
        const secX = startX + seccionWidth * secIdx;
        const suelo = startY + drawHeight;

        const cajonera = getCajonera(seccion);
        const baldas = getBaldas(seccion);
        const hCajonera = alturaCajonera(cajonera);

        return (
          <g key={seccion.id}>

            {/* ===== CAJONERA (apoyada en el suelo) ===== */}
            {cajonera && hCajonera > 0 && (() => {
              const hDibujo = hCajonera * scale;
              const yTop = suelo - hDibujo;
              if (yTop < startY) return null;

              return (
                <g>
                  {/* Cuerpo de la cajonera */}
                  <rect
                    x={secX}
                    y={yTop}
                    width={seccionWidth}
                    height={hDibujo}
                    fill={colors.fillCajonera}
                    stroke={colors.line}
                    strokeWidth="1.2"
                  />

                  {/* Separadores entre cajones (de abajo a arriba) */}
                  {(cajonera.cajones || []).map((cajon: any, i: number, arr: any[]) => {
                    if (i === arr.length - 1) return null;
                    const acum = arr.slice(0, i + 1).reduce((s: number, c: any) => s + (c.altura || 0), 0);
                    const yLinea = suelo - acum * scale;
                    return (
                      <line
                        key={cajon.id}
                        x1={secX}
                        y1={yLinea}
                        x2={secX + seccionWidth}
                        y2={yLinea}
                        stroke={colors.line}
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  {/* Tiradores de cajón */}
                  {(cajonera.cajones || []).map((cajon: any, i: number, arr: any[]) => {
                    const acumAnterior = arr.slice(0, i).reduce((s: number, c: any) => s + (c.altura || 0), 0);
                    const yCentro = suelo - (acumAnterior + (cajon.altura || 0) / 2) * scale;
                    return (
                      <line
                        key={`tirador-${cajon.id}`}
                        x1={secX + seccionWidth * 0.35}
                        y1={yCentro}
                        x2={secX + seccionWidth * 0.65}
                        y2={yCentro}
                        stroke={colors.accent}
                        strokeWidth="1.4"
                      />
                    );
                  })}
                </g>
              );
            })()}

            {/* ===== BALDAS (acumuladas sobre la cajonera) ===== */}
            {baldas.map((balda: any, idx: number) => {
              const cotaSuelo = hCajonera + baldas.slice(0, idx + 1).reduce((s: number, b: any) => s + (b.altura || 0), 0);
              const y = suelo - cotaSuelo * scale;
              if (y < startY || y > suelo) return null;

              return (
                <g key={balda.id}>
                  <rect
                    x={secX}
                    y={y}
                    width={seccionWidth}
                    height={(balda.grosor || 16) * scale}
                    fill={colors.fillBalda}
                    stroke="none"
                  />
                  <line
                    x1={secX}
                    y1={y}
                    x2={secX + seccionWidth}
                    y2={y}
                    stroke={colors.lineSoft}
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* ===== BARRA COLGANTE ===== */}
            {seccion.interior?.tieneBarraAqui && (
              <line
                x1={secX + 8}
                y1={startY + alto * 0.15 * scale}
                x2={secX + seccionWidth - 8}
                y2={startY + alto * 0.15 * scale}
                stroke={colors.accent}
                strokeWidth="2"
              />
            )}
          </g>
        );
      })}

      {/* Divisiones de secciones */}
      {Array.from({ length: numSecciones - 1 }).map((_, i) => (
        <line
          key={`divider-${i}`}
          x1={startX + seccionWidth * (i + 1)}
          y1={startY}
          x2={startX + seccionWidth * (i + 1)}
          y2={startY + drawHeight}
          stroke={colors.line}
          strokeWidth={isCorredera ? '0.8' : '1.2'}
          strokeDasharray={isCorredera ? '4 2' : 'none'}
        />
      ))}

      {/* COTAS - Ancho arriba */}
      <line x1={startX} y1={startY - 40} x2={startX + drawWidth} y2={startY - 40} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX} y1={startY - 45} x2={startX} y2={startY - 35} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth} y1={startY - 45} x2={startX + drawWidth} y2={startY - 35} stroke={colors.line} strokeWidth="0.5" />
      <text x={startX + drawWidth / 2} y={startY - 42} textAnchor="middle" fontSize="12" fontWeight="bold" fill={colors.line}>
        {ancho}
      </text>

      {/* COTAS - Alto derecha */}
      <line x1={startX + drawWidth + 35} y1={startY} x2={startX + drawWidth + 35} y2={startY + drawHeight} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth + 30} y1={startY} x2={startX + drawWidth + 40} y2={startY} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth + 30} y1={startY + drawHeight} x2={startX + drawWidth + 40} y2={startY + drawHeight} stroke={colors.line} strokeWidth="0.5" />
      <text x={startX + drawWidth + 50} y={startY + drawHeight / 2} textAnchor="start" fontSize="12" fontWeight="bold" fill={colors.line}>
        {alto}
      </text>

      {/* Etiqueta */}
      <text x={startX + drawWidth / 2} y={startY + drawHeight + 50} textAnchor="middle" fontSize="14" fontWeight="bold" fill={colors.line}>
        ALZADO ({numSecciones} secc.)
      </text>
    </svg>
  );
}