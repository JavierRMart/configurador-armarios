export default function CabinetSVG({ armario, forPrint = false }: any) {
  const ancho = armario.ancho;
  const alto = armario.alto;
  const profundidad = armario.profundidad;
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
    fillCajon: '#F1EADC',
  };

  // Ancho de cada sección
  const seccionWidth = drawWidth / numSecciones;

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

      {/* SECCIONES Y BALDAS */}
      {armario.secciones && armario.secciones.map((seccion: any, secIdx: number) => {
        const secStartX = startX + seccionWidth * secIdx;
        const secStartY = startY;
        const secDrawHeight = drawHeight;
        const suelo = secStartY + secDrawHeight;

        return (
          <g key={seccion.id}>
            {/* Dibujar baldas de esta sección - DE SUELO A TECHO */}
            {seccion.interior?.baldas?.map((balda: any, baldaIdx: number) => {
              const yActual = suelo - ((balda.altura || 0) * scale);
              
              if (yActual >= secStartY && yActual <= suelo) {
                return (
                  <g key={balda.id}>
                    {/* Línea de balda */}
                    <line
                      x1={secStartX}
                      y1={yActual}
                      x2={secStartX + seccionWidth}
                      y2={yActual}
                      stroke={colors.lineSoft}
                      strokeWidth="0.8"
                    />
                    {/* Grosor de balda (pequeño rectángulo) */}
                    <rect
                      x={secStartX}
                      y={yActual}
                      width={seccionWidth}
                      height={(balda.grosor || 16) * scale}
                      fill={colors.fillCajon}
                      stroke="none"
                    />
                  </g>
                );
              }
              return null;
            })}

            {/* Barra colgante si existe en esta sección */}
            {seccion.interior?.baldas?.[0] && (
              <line
                x1={secStartX + 8}
                y1={startY + alto * 0.15 * scale}
                x2={secStartX + seccionWidth - 8}
                y2={startY + alto * 0.15 * scale}
                stroke={colors.accent}
                strokeWidth="1.5"
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
          strokeWidth={isCorredera ? "0.8" : "1.2"}
          strokeDasharray={isCorredera ? "4 2" : "none"}
        />
      ))}

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
        ALZADO ({numSecciones} secc.)
      </text>
    </svg>
  );
}
