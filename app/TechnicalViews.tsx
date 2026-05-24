'use client';

import React from 'react';

export default function TechnicalViews({ 
  ancho = 100, 
  alto = 240, 
  profundidad = 35 
}: any) {
  const wCm = ancho;
  const hCm = alto;
  const dCm = profundidad;

  const padL = 20, padR = 20, padT = 20, padB = 20;
  const scaleX = (280 - padL - padR) / wCm;
  const scaleY = (150 - padT - padB) / hCm;
  const scale = Math.min(scaleX, scaleY);

  const dW = wCm * scale, dH = hCm * scale;
  const svgW = dW + padL + padR, svgH = dH + padT + padB;
  const x0 = padL, y0 = padT;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
      {/* ALZADO */}
      <div style={{ border: '1px solid #d9cdb8', borderRadius: '4px', padding: '8px', background: '#fffefb' }}>
        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxHeight: '150px' }}>
          <rect x={x0} y={y0} width={dW} height={dH} fill="#faf7f2" stroke="#1a1612" strokeWidth="0.8" />
          <text x={x0 + dW / 2} y={y0 + dH + 20} textAnchor="middle" fontSize="10" fill="#1a1612" fontWeight="bold">
            ALZADO
          </text>
        </svg>
      </div>

      {/* PLANTA */}
      <div style={{ border: '1px solid #d9cdb8', borderRadius: '4px', padding: '8px', background: '#fffefb' }}>
        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxHeight: '150px' }}>
          <rect x={x0} y={y0} width={dW} height={dH} fill="#faf7f2" stroke="#1a1612" strokeWidth="0.8" />
          <rect x={x0 + 2} y={y0 + 2} width={4} height={dH - 4} fill="#d9cdb8" />
          <rect x={x0 + dW - 6} y={y0 + 2} width={4} height={dH - 4} fill="#d9cdb8" />
          <text x={x0 + dW / 2} y={y0 + dH + 20} textAnchor="middle" fontSize="10" fill="#1a1612" fontWeight="bold">
            PLANTA
          </text>
        </svg>
      </div>

      {/* SECCIÓN */}
      <div style={{ border: '1px solid #d9cdb8', borderRadius: '4px', padding: '8px', background: '#fffefb' }}>
        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxHeight: '150px' }}>
          <line x1={x0 - 5} y1={y0} x2={x0 + dW + 5} y2={y0} stroke="#1a1612" strokeWidth="1.2" />
          <rect x={x0} y={y0} width={dW} height={dH} fill="#faf7f2" stroke="#1a1612" strokeWidth="0.8" />
          <line x1={x0 - 5} y1={y0 + dH} x2={x0 + dW + 5} y2={y0 + dH} stroke="#1a1612" strokeWidth="1.2" />
          <text x={x0 + dW / 2} y={y0 + dH + 20} textAnchor="middle" fontSize="10" fill="#1a1612" fontWeight="bold">
            SECCIÓN
          </text>
        </svg>
      </div>
    </div>
  );
}