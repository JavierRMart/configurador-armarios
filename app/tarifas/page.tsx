'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createPriceList, getPriceLists } from '@/lib/price-lists';

export default function TarifasPage() {
  const [user, setUser] = useState<any>(null);
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fabricante, setFabricante] = useState('');
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const lista = await getPriceLists();
        setTarifas(lista);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!fabricante.trim() || !nombre.trim()) {
      setError('Completa el fabricante y nombre antes de subir');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const filename = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('tarifas')
        .upload(filename, file);

      if (uploadError) throw uploadError;

      const tarifa = await createPriceList(
        fabricante,
        nombre,
        fecha,
        filename
      );

      setTarifas([tarifa, ...tarifas]);
      setFabricante('');
      setNombre('');
      setFecha(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setError('Error al subir: ' + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Cargando...</div>;
  }

  if (!user) {
    return <div style={{ padding: '20px' }}>Debes iniciar sesión</div>;
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: '#f5f1e8',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ color: '#1a1612' }}>Gestión de Tarifas</h1>

        {/* FORMULARIO SUBIDA */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #d9cdb8',
          marginBottom: '30px',
        }}>
          <h2 style={{ color: '#1a1612', fontSize: '16px', margin: '0 0 15px 0' }}>
            Subir nueva tarifa
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Fabricante
              </label>
              <input
                type="text"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                placeholder="Ej: Puertas Castalla"
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
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Nombre de la tarifa
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Tarifa general 2026"
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

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              Vigente desde
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
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
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
              Archivo PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{
                fontSize: '12px',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#c0392b', fontSize: '12px', marginTop: '10px' }}>
              {error}
            </p>
          )}

          {uploading && (
            <p style={{ color: '#b08d57', fontSize: '12px', marginTop: '10px' }}>
              Subiendo...
            </p>
          )}
        </div>

        {/* LISTA DE TARIFAS */}
        <div>
          <h2 style={{ color: '#1a1612', fontSize: '16px', margin: '0 0 15px 0' }}>
            Mis tarifas ({tarifas.length})
          </h2>

          {tarifas.length === 0 ? (
            <p style={{ color: '#6b5d4f' }}>Aún no has subido ninguna tarifa</p>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #d9cdb8',
              overflow: 'hidden',
            }}>
              {tarifas.map((tarifa) => (
                <div key={tarifa.id} style={{
                  padding: '15px',
                  borderBottom: '1px solid #d9cdb8',
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr 150px 120px',
                  gap: '15px',
                  alignItems: 'center',
                }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '13px', color: '#1a1612' }}>
                      {tarifa.fabricante}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b5d4f' }}>
                      {tarifa.nombre}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b5d4f' }}>
                      Vigente desde: {new Date(tarifa.vigente_desde).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: tarifa.estado === 'activa' ? '#27ae60' : '#f39c12',
                      color: 'white',
                    }}>
                      {tarifa.estado}
                    </span>
                  </div>
                  <button style={{
                    padding: '8px 12px',
                    background: '#b08d57',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    Revisar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}