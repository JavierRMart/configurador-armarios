'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getProject } from '@/lib/projects';
import { calcularPresupuestoProyecto, ResumenPresupuesto } from '@/lib/presupuestos';

export default function PresupuestoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [resumen, setResumen] = useState<ResumenPresupuesto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const proyectoId = params.get('proyecto');

      if (!proyectoId) {
        setError('Falta el proyecto. Abre esta pantalla desde "Mis proyectos".');
        setLoading(false);
        return;
      }

      try {
        const proyecto = await getProject(proyectoId);
        setNombreProyecto(proyecto.nombre);

        const puertas = proyecto.config?.puertas || [];
        if (puertas.length === 0) {
          setError('Este proyecto no tiene puertas configuradas.');
          setLoading(false);
          return;
        }

        const resultado = await calcularPresupuestoProyecto(puertas);
        setResumen(resultado);
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
                  </div>

                  {linea.soportado ? (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#1a1612' }}>
                        {formatoEuro(linea.subtotal || 0)}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b5d4f' }}>
                        {formatoEuro(linea.precioUnitario || 0)} / ud.
                        {linea.descuentoPorcentaje ? ` (tarifa ${formatoEuro(linea.precioTarifa || 0)}, −${linea.descuentoPorcentaje}%)` : ''}
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
              border: '2px solid #b08d57',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b5d4f' }}>
                  {resumen.cantidadSoportadas} de {resumen.lineas.length} puertas calculadas
                  {resumen.cantidadNoSoportadas > 0 &&
                    ` · ${resumen.cantidadNoSoportadas} pendientes de definir`}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b5d4f' }}>
                  Ya incluye el descuento de tarifa
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#1a1612' }}>
                {formatoEuro(resumen.total)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}