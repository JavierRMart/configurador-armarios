export default function CabinetSVG({ armario, forPrint = false }: any) {
  const ancho = Math.round(armario.ancho * 10);
  const alto = Math.round(armario.alto * 10);
  const profundidad = Math.round(armario.profundidad * 10);

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
    fillCajon: '#F1EADC',
  };

  // Cajones al fondo
  const cajoneraHeight = armario.interior.cajones * armario.interior.cajonHeight * scale;
  const cajoneraTopY = startY + drawHeight - cajoneraHeight;

  // Barra colgante (1/6 desde arriba)
  const barraY = startY + drawHeight * 0.16;

  // Posiciones de puertas
  let cursor = startX;
  const doorBoundaries = [startX];
  armario.doors.forEach((door: any) => {
    cursor += (door.width || 0) * scale;
    doorBoundaries.push(cursor);
  });

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

      {/* Cajonera (relleno distinto) */}
      {armario.interior.cajones > 0 && (
        <rect
          x={startX}
          y={cajoneraTopY}
          width={drawWidth}
          height={cajoneraHeight}
          fill={colors.fillCajon}
          stroke="none"
        />
      )}

      {/* Barra colgante */}
      {armario.interior.barraColgar && (
        <>
          <line
            x1={startX + 8}
            y1={barraY}
            x2={startX + drawWidth - 8}
            y2={barraY}
            stroke={colors.accent}
            strokeWidth="1.5"
          />
          <circle cx={startX + 8} cy={barraY} r="2" fill={colors.accent} />
          <circle cx={startX + drawWidth - 8} cy={barraY} r="2" fill={colors.accent} />
        </>
      )}

      {/* Baldas */}
      {armario.interior.baldas && (
        <>
          {[0.35, 0.55, 0.75].map((pos, i) => {
            const y = startY + drawHeight * pos;
            if (armario.interior.cajones > 0 && y > cajoneraTopY - 6) return null;
            return (
              <line
                key={i}
                x1={startX + 4}
                y1={y}
                x2={startX + drawWidth - 4}
                y2={y}
                stroke={colors.lineSoft}
                strokeWidth="0.6"
                strokeDasharray="3 2"
              />
            );
          })}
        </>
      )}

      {/* Cajones */}
      {Array.from({ length: armario.interior.cajones - 1 }).map((_, i) => {
        const y = cajoneraTopY + (armario.interior.cajonHeight * scale) * (i + 1);
        return (
          <line
            key={i}
            x1={startX}
            y1={y}
            x2={startX + drawWidth}
            y2={y}
            stroke={colors.line}
            strokeWidth="0.8"
          />
        );
      })}

      {/* Divisiones de puertas */}
      {doorBoundaries.slice(1, -1).map((x, i) => (
        <line
          key={i}
          x1={x}
          y1={startY}
          x2={x}
          y2={startY + drawHeight}
          stroke={colors.line}
          strokeWidth={isCorredera ? "0.8" : "1.2"}
          strokeDasharray={isCorredera ? "4 2" : "none"}
        />
      ))}

      {/* Tiradores (abatibles) */}
      {!isCorredera &&
        armario.doors.map((door: any, i: number) => {
          const xLeft = doorBoundaries[i];
          const xRight = doorBoundaries[i + 1];
          if (i < armario.doors.length - 1) {
            return (
              <g key={i}>
                <rect x={xRight - 3} y={startY + drawHeight * 0.45} width="2" height="14" fill={colors.accent} />
                <rect x={xRight + 1} y={startY + drawHeight * 0.45} width="2" height="14" fill={colors.accent} />
              </g>
            );
          }
          return null;
        })}

      {/* COTAS - Ancho arriba */}
      <line x1={startX} y1={startY - 40} x2={startX + drawWidth} y2={startY - 40} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX} y1={startY - 45} x2={startX} y2={startY - 35} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth} y1={startY - 45} x2={startX + drawWidth} y2={startY - 35} stroke={colors.line} strokeWidth="0.5" />
      <text
        x={startX + drawWidth / 2}
        y={startY - 42}
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill={colors.line}
      >
        {ancho}
      </text>

      {/* COTAS - Alto derecha */}
      <line x1={startX + drawWidth + 35} y1={startY} x2={startX + drawWidth + 35} y2={startY + drawHeight} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth + 30} y1={startY} x2={startX + drawWidth + 40} y2={startY} stroke={colors.line} strokeWidth="0.5" />
      <line x1={startX + drawWidth + 30} y1={startY + drawHeight} x2={startX + drawWidth + 40} y2={startY + drawHeight} stroke={colors.line} strokeWidth="0.5" />
      <text
        x={startX + drawWidth + 50}
        y={startY + drawHeight / 2}
        textAnchor="start"
        fontSize="12"
        fontWeight="bold"
        fill={colors.line}
      >
        {alto}
      </text>

      {/* Etiqueta */}
      <text
        x={startX + drawWidth / 2}
        y={startY + drawHeight + 50}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill={colors.line}
      >
        ALZADO
      </text>
    </svg>
  );
}