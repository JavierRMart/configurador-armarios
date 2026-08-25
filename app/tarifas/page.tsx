'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createPriceList, getPriceLists, updatePriceListState, addPriceListItems } from '@/lib/price-lists';

export default function TarifasPage() {
  const [user, setUser] = useState<any>(null);
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [fabricante, setFabricante] = useState('');
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [diagnostico, setDiagnostico] = useState<any>(null);

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

      const tarifa = await createPriceList(fabricante, nombre, fecha, filename);

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

  const handleEliminar = async (tarifaId: string) => {
    if (!confirm('¿Eliminar esta tarifa? No se puede deshacer.')) return;

    try {
      const tarifa = tarifas.find((t) => t.id === tarifaId);
      if (!tarifa) return;

      await supabase.storage.from('tarifas').remove([tarifa.file_path]);
      await supabase.from('price_lists').delete().eq('id', tarifaId);

      setTarifas(tarifas.filter((t) => t.id !== tarifaId));
    } catch (err: any) {
      setError('Error al eliminar: ' + (err.message || err));
    }
  };

  const handleProcesar = async (tarifaId: string) => {
    setProcesando(tarifaId);
    setError('');
    setDiagnostico(null);

    try {
      const tarifa = tarifas.find((t) => t.id === tarifaId);
      if (!tarifa) throw new Error('Tarifa no encontrada');

      const { data, error: downloadError } = await supabase.storage
        .from('tarifas')
        .download(tarifa.file_path);

      if (downloadError) throw downloadError;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(',')[1];

          const response = await fetch('/api/extract-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64 }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Error en la extracción');
          }

          const items = result.items || [];

          if (items.length === 0) {
            setDiagnostico(result);
            setError('No se extrajeron precios válidos. Mira el diagnóstico abajo.');
            setProcesando(null);
            return;
          }

          const paraGuardar = items.map((item: any) => ({
            price_list_id: tarifaId,
            categoria: item.categoria,
            referencia: item.referencia || null,
            descripcion: item.descripcion,
            atributos: {},
            precio: item.precio,
            unidad: item.unidad,
            pagina_origen: item.pagina_origen,
            aviso: item.aviso || null,
            revisado: false,
          }));

          await addPriceListItems(paraGuardar);

          await updatePriceListState(tarifaId, 'pendiente_revision', result.extraction || {});

          setTarifas(
            tarifas.map((t) =>
              t.id === tarifaId ? { ...t, estado: 'pendiente_revision' } : t
            )
          );

          alert(`Se extrajeron ${items.length} precios.\n\nEstado: Pendiente de revisión`);
        } catch (err: any) {
          setError('Error al procesar: ' + (err.message || err));
        } finally {
          setProcesando(null);
        }
      };
      reader.readAsDataURL(new File([data!], 'temp.pdf'));
    } catch (err: any) {
      setError('Error: ' + (err.message || err));
      setProcesando(null);
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
              style={{ fontSize: '12px' }}
            />
          </div>

          {error && (
            <p style={{ color: '#c0392b', fontSize: '12px', marginTop: '10px' }}>{error}</p>
          )}

          {uploading && (
            <p style={{ color: '#b08d57', fontSize: '12px', marginTop: '10px' }}>Subiendo...</p>
          )}
        </div>

        {diagnostico && (
          <div style={{
            background: '#fff8e1',
            padding: '20px',
            borderRadius: '8px',
            border: '2px solid #f39c12',
            marginBottom: '30px',
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#1a1612' }}>
              Diagnóstico de la extracción
            </h3>
            <pre style={{
              background: '#fff',
              padding: '15px',
              borderRadius: '4px',
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '400px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {JSON.stringify(diagnostico, null, 2)}
            </pre>
          </div>
        )}

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
                  gridTemplateColumns: '200px 1fr 150px 130px 110px',
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
                      background:
                        tarifa.estado === 'activa'
                          ? '#27ae60'
                          : tarifa.estado === 'procesando'
                          ? '#3498db'
                          : '#f39c12',
                      color: 'white',
                    }}>
                      {tarifa.estado}
                    </span>
                  </div>
                  <button
                    onClick={() => handleProcesar(tarifa.id)}
                    disabled={procesando === tarifa.id}
                    style={{
                      padding: '8px 12px',
                      background: '#b08d57',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      opacity: procesando === tarifa.id ? 0.6 : 1,
                    }}
                  >
                    {procesando === tarifa.id ? 'Procesando...' : 'Procesar'}
                  </button>
                  <button
                    onClick={() => handleEliminar(tarifa.id)}
                    style={{
                      padding: '8px 12px',
                      background: '#c0392b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    Eliminar
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