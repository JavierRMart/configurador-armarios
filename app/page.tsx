'use client';

import React, { useState } from 'react';
import ExportPDF from './ExportPDF';
import CabinetSVG from './CabinetSVG';
import CabinetEditor from './CabinetEditor';

export default function Home() {
  const [projectData, setProjectData] = useState({
    clientName: 'Mi Cliente',
    address: 'Dirección',
    budget: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const [armarios, setArmarios] = useState([
    {
      id: 1,
      ubicacion: 'Habitación 1',
      name: '',
      type: 'abatible',
      doors: [{ width: 50 }, { width: 50 }],
      ancho: 100,
      alto: 240,
      profundidad: 35,
      interior: {
        barraColgar: true,
        baldas: false,
        cremallera: false,
        cajones: 0,
        cajonHeight: 16,
      },
      finishes: {
        interiorTextil: 'Cactus',
        doorStyle: 'lisa',
        handle: 'Latón mate',
        costadosVistos: false,
      },
      notes: ''
    }
  ]);

  const agregarArmario = () => {
    const nuevoArmario = {
      id: Date.now(),
      ubicacion: 'Habitación',
      name: '',
      type: 'abatible',
      doors: [{ width: 50 }, { width: 50 }],
      ancho: 100,
      alto: 240,
      profundidad: 35,
      interior: {
        barraColgar: true,
        baldas: false,
        cremallera: false,
        cajones: 0,
        cajonHeight: 16,
      },
      finishes: {
        interiorTextil: 'Cactus',
        doorStyle: 'lisa',
        handle: 'Latón mate',
        costadosVistos: false,
      },
      notes: ''
    };
    setArmarios([...armarios, nuevoArmario]);
  };

  const eliminarArmario = (id: number) => {
    setArmarios(armarios.filter(a => a.id !== id));
  };

  const actualizarArmario = (id: number, campo: string, valor: any) => {
    setArmarios(
      armarios.map(a => {
        if (a.id === id) {
          if (campo === 'ancho' || campo === 'alto' || campo === 'profundidad') {
            return { ...a, [campo]: Number(valor) };
          }
          return { ...a, [campo]: valor };
        }
        return a;
      })
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
          <h2 style={{ color: '#1a1612', margin: '0 0 15px 0', fontSize: '16px' }}>Datos del Proyecto</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                CLIENTE
              </label>
              <input
                type="text"
                value={projectData.clientName}
                onChange={(e) => setProjectData({...projectData, clientName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                DIRECCIÓN
              </label>
              <input
                type="text"
                value={projectData.address}
                onChange={(e) => setProjectData({...projectData, address: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                PRESUPUESTO (€)
              </label>
              <input
                type="number"
                value={projectData.budget}
                onChange={(e) => setProjectData({...projectData, budget: Number(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                FECHA
              </label>
              <input
                type="date"
                value={projectData.date}
                onChange={(e) => setProjectData({...projectData, date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
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

                <div style={{ marginBottom: '15px', padding: '10px', background: '#faf7f2', borderRadius: '4px' }}>
                  <CabinetSVG armario={armario} />
                </div>

                <div style={{ marginBottom: '15px', borderTop: '1px solid #d9cdb8', paddingTop: '10px' }}>
                  <CabinetEditor 
                    armario={armario}
                    onChange={(updated: any) => {
                      setArmarios(armarios.map(a => a.id === updated.id ? updated : a));
                    }}
                  />
                </div>

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

        <ExportPDF projectData={projectData} armarios={armarios} />
      </div>
    </div>
  );
}
