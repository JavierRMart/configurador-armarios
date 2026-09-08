'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getProject } from '@/lib/projects';
import { getDatosEmpresa, DatosEmpresa } from '@/lib/empresa';
import { calcularPresupuestoProyecto, ResumenPresupuesto } from '@/lib/presupuestos';
import ExportPresupuestoPDF from '../ExportPresupuestoPDF';

export default function PresupuestoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proyectoId, setProyectoId] = useState('');
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [projectData, setProjectData] = useState<any>(null);
  const [empresa, setEmpresa] = useState<DatosEmpresa | null>(null);
  const [puertas, setPuertas] = useState<any[]>([]);
  const [resumen, setResumen] = useState<ResumenPresupuesto | null>(null);
  const [error, setError] = useState('');

  // Margen y descuento al cliente: editables al momento, no se guardan en ninguna tabla.
  const [margen, setMargen] = useState('');
  const [descuentoCliente, setDescuentoCliente] = useState('0');
  const [errorAjustes, setErrorAjustes] = useState('');
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const idDeLaUrl = params.get('proyecto');

      if (!idDeLaUrl) {
        setError('Falta el proyecto. Abre esta pantalla desde "Mis proyectos".');
        setLoading(false);
        return;
      }

      try {
        const proyecto = await getProject(idDeLaUrl);
        setProyectoId(proyecto.id);
        setNombreProyecto(proyecto.nombre);
        setProjectData(proyecto.config?.projectData || {});

        const puertasProyecto = proyecto.config?.puertas || [];
        if (puertasProyecto.length === 0) {
          setError('Este proyecto no tiene puertas configuradas.');
          setLoading(false);
          return;
        }
        setPuertas(puertasProyecto);

        const [resultado, datosEmpresa] = await Promise.all([
          calcularPresupuestoProyecto(puertasProyecto),
          getDatosEmpresa(),
        ]);

        setResumen(resultado);
        setEmpresa(datosEmpresa);

        // Precarga el margen con el que salió del primer cálculo (el habitual
        // de margenes_familia), para que el presupuestador vea de dónde parte.
        const margenDeLinea = resultado.lineas.find(
          (l) => l.soportado && l.margenPorcentaje !== undefined
        )?.margenPorcentaje;
        if (margenDeLinea !== undefined) setMargen(String(margenDeLinea));
      } catch (err: any) {
        setError('No se pudo calcular el presupuesto: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const formatoEuro = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  const handleRecalcular = async () => {
    setErrorAjustes('');

    const margenNum = Number(margen.replace(',', '.'));
    const descuentoNum = Number(descuentoCliente.replace(',', '.'));

    if (isNaN(margenNum) || margenNum < 0) {
      setErrorAjustes('El margen debe ser un número mayor o igual a 0.');
      return;
    }
    if (isNaN(descuentoNum) || descuentoNum < 0 || descuentoNum > 100) {
      setErrorAjustes('El descuento al cliente debe ser un número entre 0 y 100.');
      return;
    }

    setRecalculando(true);
    try {
      const resultado = await calcularPresupuestoProyecto(puertas, {
        margenOverride: margenNum,
        descuentoClientePorcentaje: descuentoNum,
      });
      setResumen(resultado);
    } catch (err: any) {
      setErrorAjustes('No se pudo recalcular: ' + (err.message || err));
    } finally {
      setRecalculando(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Calculando presupuesto...</div>;
  if (!user) return <div style={{ padding: '20px' }}>Debes iniciar sesión</div>;

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: '#f5f1e8',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h1 style={{ color: '#1a1612', margin: 0 }}>
            Presupuesto {nombreProyecto && `— ${nombreProyecto}`}
          </h1>
          <button
            onClick={() => router.push('/proyectos')}
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
            ← Mis proyectos
          </button>
        </div>

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

        {resumen && (
          <>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #d9cdb8',
              overflow: 'hidden',
              marginBottom: '20px',
            }}>
              {resumen.lineas.map((linea) => (
                <div
                  key={linea.puertaId}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #d9cdb8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '13px', color: '#1a1612' }}>
                      {linea.ubicacion} — {linea.modelo}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b5d4f' }}>
                      {linea.tipo} / {linea.subtipo} · {linea.unidades} ud.
                    </p>
                    {linea.soportado && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b5d4f' }}>
                        {linea.color && `Color: ${linea.color} · `}
                        {linea.cerco} · Tapetas {linea.tapetas} · Pernios {linea.pernios} · Herraje {linea.herraje}
                      </p>
                    )}
                  </div>

                  {linea.soportado ? (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#1a1612' }}>
                        {formatoEuro(linea.subtotal || 0)}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b5d4f' }}>
                        {formatoEuro(linea.precioUnitario || 0)} / ud.
                      </p>
                    </div>
                  ) : (
                    <p style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#c0392b',
                      maxWidth: '220px',
                      textAlign: 'right',
                    }}>
                      {linea.motivo}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #d9cdb8',
              padding: '20px',
              marginBottom: '20px',
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '13px', fontWeight: 'bold', color: '#1a1612' }}>
                AJUSTES DEL PRESUPUESTO
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                    Margen (%)
                  </label>
                  <input
                    type="text"
                    value={margen}
                    onChange={(e) => setMargen(e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b5d4f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                    Descuento al cliente (%)
                  </label>
                  <input
                    type="text"
                    value={descuentoCliente}
                    onChange={(e) => setDescuentoCliente(e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  onClick={handleRecalcular}
                  disabled={recalculando}
                  style={{
                    background: '#b08d57',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: recalculando ? 'default' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    opacity: recalculando ? 0.6 : 1,
                  }}
                >
                  {recalculando ? 'Recalculando...' : 'Recalcular'}
                </button>
              </div>
              {errorAjustes && (
                <p style={{ color: '#c0392b', fontSize: '12px', margin: '10px 0 0 0' }}>{errorAjustes}</p>
              )}
            </div>

            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '2px solid #b08d57',
              padding: '20px',
              marginBottom: '20px',
            }}>
              {resumen.cantidadNoSoportadas > 0 && (
                <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#6b5d4f' }}>
                  {resumen.cantidadSoportadas} de {resumen.lineas.length} puertas calculadas ·
                  {' '}{resumen.cantidadNoSoportadas} pendientes de definir
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b5d4f', marginBottom: '6px' }}>
                <span>Subtotal</span>
                <span>{formatoEuro(resumen.subtotalSinDescuentoCliente)}</span>
              </div>
              {resumen.descuentoClientePorcentaje > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#c0392b', marginBottom: '6px' }}>
                  <span>Descuento cliente ({resumen.descuentoClientePorcentaje}%)</span>
                  <span>-{formatoEuro(resumen.descuentoClienteImporte)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b5d4f', marginBottom: '6px' }}>
                <span>Base imponible</span>
                <span>{formatoEuro(resumen.baseImponible)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b5d4f', marginBottom: '12px' }}>
                <span>IVA ({resumen.ivaPorcentaje}%)</span>
                <span>{formatoEuro(resumen.cantidadIva)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #d9cdb8',
              }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1a1612' }}>
                  Total
                </p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#1a1612' }}>
                  {formatoEuro(resumen.totalConIva)}
                </p>
              </div>
            </div>

            {resumen.cantidadSoportadas > 0 && empresa && (
              <ExportPresupuestoPDF
                proyectoId={proyectoId}
                nombreProyecto={nombreProyecto}
                empresa={empresa}
                projectData={projectData}
                resumen={resumen}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}