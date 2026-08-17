// ============ HELPERS (idéntico a CabinetEditor.tsx) ============
function getElementos(seccion: any): any[] {
  if (seccion?.interior?.elementos && Array.isArray(seccion.interior.elementos)) {
    return seccion.interior.elementos;
  }
  if (seccion?.interior?.baldas && Array.isArray(seccion.interior.baldas)) {
    return seccion.interior.baldas.map((b: any) => ({
      id: b.id,
      tipo: 'balda',
      altura: b.altura || 0,
      grosor: b.grosor || 16,
    }));
  }
  return [];
}

export default function CabinetSVG({ armario, forPrint = false }: any) {
  const ancho = Math.round(armario.ancho * 10);
  const alto = Math.round(armario.alto * 10);
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
  const suelo = startY + drawHeight;

  const colors = {
    line: '#2D2823',
    lineSoft: '#6B5D4F',
    accent: '#B08D57',
    fill: '#FAF7F2',
    fillCajon: '#F1EADC',
  };

  const nSecciones = armario.secciones?.length || 1;
  const seccionWidth = drawWidth / nSecciones;
  const isCorredera = armario.type === 'corredera';

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
      {armario.secciones?.map((sec: any, secIdx: number) => {
        const sx = startX + seccionWidth * secIdx;
        const elementos = getElementos(sec);
        let acumulado = 0;

        return (
          <g key={sec.id}>
            {/* DIBUJAR ELEMENTOS (de suelo a techo) */}
            {elementos.map((e: any) => {
              if (e.tipo === 'cajonera') {
                const cajones = e.cajones || [];
                const hCaj = cajones.reduce((s: number, c: any) => s + (c.altura || 0), 0);
                if (hCaj <= 0) return null;

                const yBottom = suelo - acumulado * scale;
                const yTop = suelo - (acumulado + hCaj) * scale;

                acumulado += hCaj;

                return (
                  <g key={e.id}>
                    {/* Rectángulo cajonera */}
                    <rect
                      x={sx}
                      y={yTop}
                      width={seccionWidth}
                      height={yBottom - yTop}
                      fill={colors.fillCajon}
                      stroke="none"
                    />
                    {/* Separadores entre cajones */}
                    {cajones.map((c: any, j: number) => {
                      if (j === 0) return null;
                      const acumCajones = cajones.slice(0, j).reduce((s: number, x: any) => s + (x.altura || 0), 0);
                      const ySep = suelo - (acumulado - hCaj + acumCajones) * scale;
                      return (
                        <line
                          key={`sep-${j}`}
                          x1={sx}
                          y1={ySep}
                          x2={sx + seccionWidth}
                          y2={ySep}
                          stroke={colors.line}
                          strokeWidth="0.8"
                        />
                      );
                    })}
                  </g>
                );
              } else if (e.tipo === 'balda') {
                const huecoAltura = e.altura || 0;
                const grosor = e.grosor ?? 16;

                const yHuecoTop = suelo - (acumulado + huecoAltura) * scale;
                const yBalda = suelo - (acumulado + huecoAltura + grosor) * scale;

                acumulado += huecoAltura + grosor;

                return (
                  <rect
                    key={e.id}
                    x={sx}
                    y={yBalda}
                    width={seccionWidth}
                    height={grosor * scale}
                    fill={colors.lineSoft}
                    stroke="none"
                  />
                );
              }
              return null;
            })}

            {/* Barra colgante */}
            {sec.interior?.tieneBarraAqui && (
              <>
                <line
                  x1={sx + 8}
                  y1={startY + drawHeight * 0.13}
                  x2={sx + seccionWidth - 8}
                  y2={startY + drawHeight * 0.13}
                  stroke={colors.accent}
                  strokeWidth="2"
                />
                <circle cx={sx + 8} cy={startY + drawHeight * 0.13} r="2" fill={colors.accent} />
                <circle cx={sx + seccionWidth - 8} cy={startY + drawHeight * 0.13} r="2" fill={colors.accent} />
              </>
            )}
          </g>
        );
      })}

      {/* Divisiones entre secciones */}
      {Array.from({ length: nSecciones - 1 }).map((_, i) => (
        <line
          key={`div-${i}`}
          x1={startX + seccionWidth * (i + 1)}
          y1={startY}
          x2={startX + seccionWidth * (i + 1)}
          y2={suelo}
          stroke={colors.line}
          strokeWidth={isCorredera ? '0.8' : '1.2'}
          strokeDasharray={isCorredera ? '4 2' : 'none'}
        />
      ))}

      {/* COTAS */}
      <line x1={startX} y1={startY - 40} x2={startX + drawWidth} y2={startY - 40} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX} y1={startY - 45} x2={startX} y2={startY - 35} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth} y1={startY - 45} x2={startX + drawWidth} y2={startY - 35} stroke={colors.line} strokeWidth="0.5" />
      <text x={startX + drawWidth / 2} y={startY - 42} textAnchor="middle" fontSize="12" fontWeight="bold" fill={colors.line}>
        {Math.round(armario.ancho)}
      </text>

      <line x1={startX + drawWidth + 35} y1={startY} x2={startX + drawWidth + 35} y2={suelo} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth + 30} y1={startY} x2={startX + drawWidth + 40} y2={startY} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth + 30} y1={suelo} x2={startX + drawWidth + 40} y2={suelo} stroke={colors.line} strokeWidth="0.5" />
      <text x={startX + drawWidth + 50} y={startY + drawHeight / 2} textAnchor="start" fontSize="12" fontWeight="bold" fill={colors.line}>
        {Math.round(armario.alto)}
      </text>

      <text x={startX + drawWidth / 2} y={suelo + 50} textAnchor="middle" fontSize="14" fontWeight="bold" fill={colors.line}>
        ALZADO
      </text>
    </svg>
  );
}