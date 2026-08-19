'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Auth from '../Auth';
import ExportPDF from '../ExportPDF';
import CabinetSVG from '../CabinetSVG';
import CabinetEditor from '../CabinetEditor';
import DoorSVG from '../DoorSVG';
import DoorEditor from '../DoorEditor';
import SaveProjectModal from '../SaveProjectModal';

function cleanNumber(value: any): number {
  if (!value) return 0;
  const num = Number(String(value).replace(/^0+/, ''));
  return isNaN(num) ? 0 : num;
}

export default function Configurador() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState<'armarios' | 'puertas'>('armarios');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);

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
      numSecciones: 2,
      ancho: 2000,
      alto: 2400,
      profundidad: 600,
      secciones: [
        {
          id: 1,
          numero: 1,
          ancho: 1000,
          interior: {
            baldas: [
              { id: 1, altura: 400, grosor: 16 },
              { id: 2, altura: 400, grosor: 16 },
              { id: 3, altura: 600, grosor: 16 },
            ],
            tieneBarraAqui: true,
          },
        },
        {
          id: 2,
          numero: 2,
          ancho: 1000,
          interior: {
            baldas: [
              { id: 1, altura: 200, grosor: 16 },
              { id: 2, altura: 200, grosor: 16 },
              { id: 3, altura: 200, grosor: 16 },
              { id: 4, altura: 600, grosor: 16 },
            ],
            tieneBarraAqui: false,
          },
        },
      ],
      finishes: {
        interiorTextil: 'Cactus',
        doorStyle: 'lisa',
        handle: 'Latón mate',
        costadosVistos: false,
      },
      notes: ''
    }
  ]);

  const [puertas, setPuertas] = useState([
    {
      id: 1,
      modelo: '',
      color: '',
      cerco: 'con',
      tapetas: '70x12',
      pernios: 'INOX',
      herraje: 'INOX',
      fechaMedicion: new Date().toISOString().split('T')[0],
      fechaInstalacion: '',
      equipoInstalacion: '',
      ubicacion: 'Dormitorio 1',
      tipo: 'CIEGA',
      subtipo: 'BATIENTE',
      alto: 2030,
      ancho: 625,
      anchoCerco: 80,
      apertura: 'derecha',
      unidades: 1,
    }
  ]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const agregarArmario = () => {
    const nuevoArmario = {
      id: Date.now(),
      ubicacion: 'Habitación',
      name: '',
      type: 'abatible',
      numSecciones: 1,
      ancho: 2000,
      alto: 2400,
      profundidad: 600,
      secciones: [
        {
          id: Date.now(),
          numero: 1,
          ancho: 2000,
          interior: {
            baldas: [{ id: Date.now(), altura: 400, grosor: 16 }],
            tieneBarraAqui: false,
          },
        },
      ],
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

  const agregarPuerta = () => {
    const nuevaPuerta = {
      id: Date.now(),
      modelo: '',
      color: '',
      cerco: 'con',
      tapetas: '70x12',
      pernios: 'INOX',
      herraje: 'INOX',
      fechaMedicion: new Date().toISOString().split('T')[0],
      fechaInstalacion: '',
      equipoInstalacion: '',
      ubicacion: 'Dormitorio',
      tipo: 'CIEGA',
      subtipo: 'BATIENTE',
      alto: 2030,
      ancho: 625,
      anchoCerco: 80,
      apertura: 'derecha',
      unidades: 1,
    };
    setPuertas([...puertas, nuevaPuerta]);
  };

  const eliminarArmario = (id: number) => {
    setArmarios(armarios.filter(a => a.id !== id));
  };

  const eliminarPuerta = (id: number) => {
    setPuertas(puertas.filter(p => p.id !== id));
  };

  const actualizarArmario = (id: number, campo: string, valor: any) => {
    setArmarios(
      armarios.map(a => {
        if (a.id === id) {
          if (['ancho', 'alto', 'profundidad', 'numSecciones'].includes(campo)) {
            const nuevoValor = cleanNumber(valor);
            if (campo === 'numSecciones' && nuevoValor !== a.numSecciones) {
              const anchoPerSeccion = Math.round(a.ancho / nuevoValor);
              let nuevoNumero = 1;
              const nuevosSecciones = Array.from({ length: nuevoValor }, (_, i) => {
                const existente = a.secciones[i];
                if (existente) {
                  return { ...existente, ancho: anchoPerSeccion };
                }
                return {
                  id: Date.now() + i,
                  numero: nuevoNumero++,
                  ancho: anchoPerSeccion,
                  interior: {
                    baldas: [{ id: Date.now() + i * 1000, altura: 400, grosor: 16 }],
                    tieneBarraAqui: false,
                  },
                };
              });
              return { ...a, [campo]: nuevoValor, secciones: nuevosSecciones };
            }
            return { ...a, [campo]: nuevoValor };
          }
          return { ...a, [campo]: valor };
        }
        return a;
      })
    );
  };

  const actualizarPuerta = (id: number, campo: string, valor: any) => {
    setPuertas(
      puertas.map(p => {
        if (p.id === id) {
          if (['alto', 'ancho', 'anchoCerco', 'unidades'].includes(campo)) {
            return { ...p, [campo]: cleanNumber(valor) };
          }
          return { ...p, [campo]: valor };
        }
        return p;
      })
    );
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: '#f5f1e8',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #d9cdb8',
        }}>
          <div>
            <h1 style={{ color: '#1a1612', margin: 0, fontSize: '28px' }}>Configurador ARVE</h1>
            {activeProjectName && (
              <p style={{ color: '#b08d57', margin: '5px 0 0 0', fontSize: '14px' }}>
                Proyecto: <strong>{activeProjectName}</strong>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: '#6b5d4f',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ← Inicio
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
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
              💾 Guardar
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: '#c0392b',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #d9cdb8' }}>
          <button
            onClick={() => setSeccion('armarios')}
            style={{
              background: seccion === 'armarios' ? '#b08d57' : 'transparent',
              color: seccion === 'armarios' ? 'white' : '#1a1612',
              border: 'none',
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              borderBottom: seccion === 'armarios' ? '3px solid #b08d57' : 'none',
            }}
          >
            Armarios
          </button>
          <button
            onClick={() => setSeccion('puertas')}
            style={{
              background: seccion === 'puertas' ? '#b08d57' : 'transparent',
              color: seccion === 'puertas' ? 'white' : '#1a1612',
              border: 'none',
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              borderBottom: seccion === 'puertas' ? '3px solid #b08d57' : 'none',
            }}
          >
            Puertas
          </button>
        </div>

        {/* PROJECT DATA */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #d9cdb8',
          marginBottom: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}>
          <div>
            <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              CLIENTE
            </label>
            <input
              type="text"
              value={projectData.clientName}
              onChange={(e) => setProjectData({ ...projectData, clientName: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              DIRECCIÓN
            </label>
            <input
              type="text"
              value={projectData.address}
              onChange={(e) => setProjectData({ ...projectData, address: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              FECHA
            </label>
            <input
              type="date"
              value={projectData.date}
              onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* SECCIÓN ARMARIOS */}
        {seccion === 'armarios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ color: '#1a1612', margin: 0 }}>Armarios</h2>
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

            {armarios.map((armario) => (
              <div key={armario.id} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #d9cdb8',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: '400px 1fr',
                gap: '30px',
              }}>
                {/* COLUMNA IZQUIERDA: SVG FIJO */}
                <div style={{
                  background: '#faf7f2',
                  padding: '15px',
                  borderRadius: '4px',
                  border: '1px solid #d9cdb8',
                  position: 'sticky',
                  top: '20px',
                  height: 'fit-content',
                }}>
                  <CabinetSVG armario={armario} />
                </div>

                {/* COLUMNA DERECHA: FORMULARIOS SCROLLEABLES */}
                <div style={{
                  maxHeight: '700px',
                  overflowY: 'auto',
                  paddingRight: '10px',
                }}>
                  {/* MEDIDAS PRINCIPALES */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#1a1612', margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold' }}>
                      MEDIDAS PRINCIPALES
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '10px',
                    }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                          Ancho (mm)
                        </label>
                        <input
                          type="number"
                          value={armario.ancho}
                          onChange={(e) => actualizarArmario(armario.id, 'ancho', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                          Alto (mm)
                        </label>
                        <input
                          type="number"
                          value={armario.alto}
                          onChange={(e) => actualizarArmario(armario.id, 'alto', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                          Profundidad (mm)
                        </label>
                        <input
                          type="number"
                          value={armario.profundidad}
                          onChange={(e) => actualizarArmario(armario.id, 'profundidad', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* NÚMERO DE SECCIONES */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      NÚMERO DE SECCIONES
                    </label>
                    <select
                      value={armario.numSecciones}
                      onChange={(e) => actualizarArmario(armario.id, 'numSecciones', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="1">1 sección</option>
                      <option value="2">2 secciones</option>
                      <option value="3">3 secciones</option>
                      <option value="4">4 secciones</option>
                      <option value="5">5 secciones</option>
                    </select>
                  </div>

                  {/* EDITOR COMPLETO */}
                  <CabinetEditor 
                    armario={armario}
                    onChange={(updated: any) => {
                      setArmarios(armarios.map(a => a.id === updated.id ? updated : a));
                    }}
                  />

                  {/* BOTÓN ELIMINAR */}
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
                      marginTop: '20px',
                    }}
                  >
                    Eliminar Armario
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN PUERTAS */}
        {seccion === 'puertas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ color: '#1a1612', margin: 0 }}>Puertas</h2>
              <button
                onClick={agregarPuerta}
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
                + Agregar puerta
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '20px',
            }}>
              {puertas.map((puerta) => (
                <div
                  key={puerta.id}
                  style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #d9cdb8',
                  }}
                >
                  <div style={{ marginBottom: '15px', padding: '10px', background: '#faf7f2', borderRadius: '4px' }}>
                    <DoorSVG puerta={puerta} />
                  </div>

                  <div style={{ marginBottom: '15px', borderTop: '1px solid #d9cdb8', paddingTop: '10px' }}>
                    <DoorEditor 
                      puerta={puerta}
                      onChange={(updated: any) => {
                        setPuertas(puertas.map(p => p.id === updated.id ? updated : p));
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
                    {puerta.alto} × {puerta.ancho} × {puerta.anchoCerco} mm
                  </p>

                  <button
                    onClick={() => eliminarPuerta(puerta.id)}
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
        )}

        <ExportPDF projectData={projectData} armarios={armarios} puertas={puertas} />

        {/* MODAL GUARDAR */}
        <SaveProjectModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          projectId={activeProjectId || undefined}
          tipo={seccion === 'armarios' ? 'armario' : 'puerta'}
          config={{
            armarios: seccion === 'armarios' ? armarios : [],
            puertas: seccion === 'puertas' ? puertas : [],
            projectData,
          }}
          onSaveSuccess={(id, nombre) => {
            setActiveProjectId(id);
            setActiveProjectName(nombre);
            alert('Proyecto guardado exitosamente');
          }}
        />
      </div>
    </div>
  );
}