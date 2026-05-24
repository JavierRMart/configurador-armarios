'use client';

import React, { useState } from 'react';
import TechnicalViews from './TechnicalViews';
import ExportPDF from './ExportPDF';

export default function Home() {
  const [cliente, setCliente] = useState('Mi Cliente');
  const [armarios, setArmarios] = useState([
    {
      id: 1,
      ubicacion: 'Habitación 1',
      ancho: 100,
      alto: 240,
      profundidad: 35,
    }
  ]);

  const agregarArmario = () => {
    const nuevoArmario = {
      id: Date.now(),
      ubicacion: 'Habitación',
      ancho: 100,
      alto: 240,
      profundidad: 35,
    };
    setArmarios([...armarios, nuevoArmario]);
  };

  const eliminarArmario = (id: number) => {
    setArmarios(armarios.filter(a => a.id !== id));
  };

  const actualizarArmario = (id: number, campo: string, valor: any) => {
    setArmarios(
      armarios.map(a =>
        a.id === id ? { ...a, [campo]: Number(valor) } : a
      )
    );
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: '#f5f1e8',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#1a1612', marginBottom: '10px' }}>
          Configurador de Armarios
        </h1>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #d9cdb8',
        }}>
          <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
            CLIENTE
          </label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ color: '#1a1612', margin: 0 }}>
              Armarios ({armarios.length})
            </h2>
            <button
              onClick={agregarArmario}
              style={{
                background: '#b08d57',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              + Agregar armario
            </button>
          </div>

          <div 
            id="contenido-pdf"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '20px',
            }}>
            {armarios.map((armario) => (
              <div
                key={armario.id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #d9cdb8',
                }}
              >
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                    UBICACIÓN
                  </label>
                  <input
                    type="text"
                    value={armario.ubicacion}
                    onChange={(e) => actualizarArmario(armario.id, 'ubicacion', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  marginBottom: '15px',
                }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Ancho (cm)
                    </label>
                    <input
                      type="number"
                      value={armario.ancho}
                      onChange={(e) => actualizarArmario(armario.id, 'ancho', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Alto (cm)
                    </label>
                    <input
                      type="number"
                      value={armario.alto}
                      onChange={(e) => actualizarArmario(armario.id, 'alto', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Profundidad (cm)
                    </label>
                    <input
                      type="number"
                      value={armario.profundidad}
                      onChange={(e) => actualizarArmario(armario.id, 'profundidad', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <TechnicalViews 
                  ancho={armario.ancho} 
                  alto={armario.alto} 
                  profundidad={armario.profundidad} 
                />

                <p style={{
                  margin: '10px 0 15px 0',
                  fontSize: '12px',
                  color: '#6b5d4f',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}>
                  {Math.round(armario.ancho * 10)} × {Math.round(armario.alto * 10)} × {Math.round(armario.profundidad * 10)} mm
                </p>

                <button
                  onClick={() => eliminarArmario(armario.id)}
                  style={{
                    width: '100%',
                    background: '#c0392b',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <ExportPDF cliente={cliente} armarios={armarios} />
      </div>
    </div>
  );
}