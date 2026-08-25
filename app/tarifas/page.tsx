'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  createPriceList,
  getPriceLists,
  updatePriceListState,
  addPriceListItems,
  deleteAllItems,
} from '@/lib/price-lists';

const PAGINAS_POR_BLOQUE = 3;

export default function TarifasPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [progreso, setProgreso] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState<any>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) setTarifas(await getPriceLists());
      setLoading(false);
    };
    cargar();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!fabricante.trim() || !nombre.trim()) {
      setError('Completa el fabricante y el nombre antes de subir el PDF.');
      return;
    }

    setError('');
    setResumen(null);
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
      e.target.value = '';
    } catch (err: any) {
      setError('No se pudo subir el PDF: ' + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleEliminar = async (tarifaId: string) => {
    if (!confirm('¿Eliminar esta tarifa y su PDF? No se puede deshacer.')) return;

    try {
      const tarifa = tarifas.find((t) => t.id === tarifaId);
      if (!tarifa) return;

      await supabase.storage.from('tarifas').remove([tarifa.file_path]);
      await supabase.from('price_lists').delete().eq('id', tarifaId);

      setTarifas(tarifas.filter((t) => t.id !== tarifaId));
    } catch (err: any) {
      setError('No se pudo eliminar: ' + (err.message || err));
    }
  };

  const aBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = () => reject(new Error('No se pudo leer el PDF.'));
      reader.readAsDataURL(blob);
    });

  const llamarBloque = async (cuerpo: any) => {
    const respuesta = await fetch('/api/extract-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });

    const texto = await respuesta.text();
    let datos;
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new Error('Respuesta inesperada del servidor: ' + texto.substring(0, 120));
    }

    if (!respuesta.ok) throw new Error(datos.error || 'Error en el servidor');
    return datos;
  };

  const handleProcesar = async (tarifaId: string) => {
    setProcesando(tarifaId);
    setError('');
    setResumen(null);
    setProgreso('Descargando el PDF...');

    try {
      const tarifa = tarifas.find((t) => t.id === tarifaId);
      if (!tarifa) throw new Error('No se encuentra la tarifa.');

      // Borrar lo que hubiera de un intento anterior
      await deleteAllItems(tarifaId);

      const { data, error: downloadError } = await supabase.storage
        .from('tarifas')
        .download(tarifa.file_path);

      if (downloadError) throw downloadError;

      const base64 = await aBase64(data!);

      setProgreso('Contando páginas...');
      const info = await llamarBloque({ pdfBase64: base64, soloContar: true });
      const totalPaginas = info.totalPaginas;

      const bloques: { inicio: number; fin: number }[] = [];
      for (let i = 0; i < totalPaginas; i += PAGINAS_POR_BLOQUE) {
        bloques.push({
          inicio: i,
          fin: Math.min(i + PAGINAS_POR_BLOQUE - 1, totalPaginas - 1),
        });
      }

      let guardados = 0;
      let conAviso = 0;
      const bloquesFallidos: any[] = [];

      for (let i = 0; i < bloques.length; i++) {
        const bloque = bloques[i];
        setProgreso(
          `Páginas ${bloque.inicio + 1}-${bloque.fin + 1} de ${totalPaginas} · bloque ${i + 1} de ${bloques.length} · ${guardados} precios guardados`
        );

        try {
          const resultado = await llamarBloque({
            pdfBase64: base64,
            paginaInicio: bloque.inicio,
            paginaFin: bloque.fin,
          });

          const items = resultado.items || [];
          if (items.length === 0) continue;

          const paraGuardar = items.map((item: any) => ({
            price_list_id: tarifaId,
            categoria: item.categoria,
            referencia: item.referencia || null,
            descripcion: item.descripcion,
            atributos: item.atributos || {},
            precio: item.precio,
            tipo_precio: item.tipo_precio || 'fijo',
            unidad: item.unidad,
            aplica_a: item.aplica_a || null,
            pagina_origen: item.pagina_origen || bloque.inicio + 1,
            aviso: item.aviso || null,
            revisado: false,
          }));

          // Guardar este bloque enseguida: si algo falla después, no se pierde
          for (let j = 0; j < paraGuardar.length; j += 100) {
            await addPriceListItems(paraGuardar.slice(j, j + 100));
          }

          guardados += paraGuardar.length;
          conAviso += paraGuardar.filter((p: any) => p.aviso).length;
        } catch (errBloque: any) {
          bloquesFallidos.push({
            paginas: `${bloque.inicio + 1}-${bloque.fin + 1}`,
            error: errBloque.message,
          });
        }
      }

      if (guardados === 0) {
        setError(
          `No se guardó ningún precio de las ${totalPaginas} páginas.` +
          (bloquesFallidos.length ? ` Fallaron ${bloquesFallidos.length} bloques.` : '')
        );
        setResumen({ totalPaginas, bloquesFallidos });
        setProgreso('');
        setProcesando(null);
        return;
      }

      await updatePriceListState(tarifaId, 'pendiente_revision', {
        modelo: 'claude-sonnet-5',
        fecha: new Date().toISOString(),
        totalPaginas,
        bloquesTotales: bloques.length,
        bloquesFallidos,
        itemsExtraidos: guardados,
      });

      setTarifas(
        tarifas.map((t) => (t.id === tarifaId ? { ...t, estado: 'pendiente_revision' } : t))
      );

      setResumen({
        exito: true,
        totalPaginas,
        itemsExtraidos: guardados,
        conAviso,
        bloquesFallidos,
      });
      setProgreso('');
    } catch (err: any) {
      setError('Error al procesar: ' + (err.message || err));
      setProgreso('');
    } finally {
      setProcesando(null);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;
  if (!user) return <div style={{ padding: '20px' }}>Debes iniciar sesión</div>;

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: '#f5f1e8',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h1 style={{ color: '#1a1612', margin: 0 }}>Gestión de Tarifas</h1>
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
        </div>

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

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '15px',
          }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Fabricante
              </label>
              <input
                type="text"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                placeholder="Ej: Imalasa"
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

          {uploading && (
            <p style={{ color: '#b08d57', fontSize: '12px', marginTop: '10px' }}>Subiendo...</p>
          )}
        </div>

        {progreso && (
          <div style={{
            background: '#e8f4fd',
            padding: '15px 20px',
            borderRadius: '8px',
            border: '2px solid #3498db',
            marginBottom: '20px',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#1a1612', fontWeight: 'bold' }}>
              {progreso}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#6b5d4f' }}>
              No cierres esta pestaña hasta que termine.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fdecea',
            padding: '15px 20px',
            borderRadius: '8px',
            border: '2px solid #c0392b',
            marginBottom: '20px',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#c0392b' }}>{error}</p>
          </div>
        )}

        {resumen?.exito && (
          <div style={{
            background: '#eafaf1',
            padding: '15px 20px',
            borderRadius: '8px',
            border: '2px solid #27ae60',
            marginBottom: '20px',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#1a1612' }}>
              Extracción terminada
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#1a1612' }}>
              {resumen.itemsExtraidos} precios guardados de {resumen.totalPaginas} páginas.
              {resumen.conAviso > 0 && ` ${resumen.conAviso} necesitan revisión.`}
              {resumen.bloquesFallidos.length > 0 && ` ${resumen.bloquesFallidos.length} bloques fallaron.`}
            </p>
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
                  gridTemplateColumns: '200px 1fr 160px 130px 110px',
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
                        tarifa.estado === 'activa' ? '#27ae60'
                        : tarifa.estado === 'pendiente_revision' ? '#f39c12'
                        : tarifa.estado === 'error' ? '#c0392b'
                        : '#3498db',
                      color: 'white',
                    }}>
                      {tarifa.estado === 'pendiente_revision' ? 'pendiente revisión' : tarifa.estado}
                    </span>
                  </div>
                  <button
                    onClick={() => handleProcesar(tarifa.id)}
                    disabled={procesando !== null}
                    style={{
                      padding: '8px 12px',
                      background: '#b08d57',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: procesando !== null ? 'default' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      opacity: procesando !== null ? 0.5 : 1,
                    }}
                  >
                    {procesando === tarifa.id ? 'Procesando...' : 'Procesar'}
                  </button>
                  <button
                    onClick={() => handleEliminar(tarifa.id)}
                    disabled={procesando !== null}
                    style={{
                      padding: '8px 12px',
                      background: '#c0392b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: procesando !== null ? 'default' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      opacity: procesando !== null ? 0.5 : 1,
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