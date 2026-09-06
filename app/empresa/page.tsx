'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getDatosEmpresa, guardarDatosEmpresa, DatosEmpresa } from '@/lib/empresa';

const VACIO: DatosEmpresa = {
  nombre_sociedad: '',
  direccion: '',
  cif: '',
  email: '',
  telefono: '',
};

export default function EmpresaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [datos, setDatos] = useState<DatosEmpresa>(VACIO);
  const [error, setError] = useState('');
  const [guardadoOk, setGuardadoOk] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const actuales = await getDatosEmpresa();
        setDatos(actuales);
      } catch (err: any) {
        setError('No se pudieron cargar los datos: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const update = (campo: keyof DatosEmpresa, valor: string) => {
    setDatos({ ...datos, [campo]: valor });
    setGuardadoOk(false);
  };

  const handleGuardar = async () => {
    if (!datos.nombre_sociedad.trim()) {
      setError('El nombre de la sociedad no puede estar vacío.');
      return;
    }

    setError('');
    setGuardando(true);
    try {
      const guardados = await guardarDatosEmpresa(datos);
      setDatos(guardados);
      setGuardadoOk(true);
    } catch (err: any) {
      setError('No se pudo guardar: ' + (err.message || err));
    } finally {
      setGuardando(false);
    }
  };

  const labelStyle: any = {
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '5px',
    color: '#6b5d4f',
  };

  const inputStyle: any = {
    width: '100%',
    padding: '10px',
    fontSize: '13px',
    border: '1px solid #d9cdb8',
    borderRadius: '4px',
    boxSizing: 'border-box',
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
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h1 style={{ color: '#1a1612', margin: 0 }}>Datos de la empresa</h1>
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

        <p style={{ color: '#6b5d4f', fontSize: '13px', marginBottom: '20px' }}>
          Estos datos aparecerán en los presupuestos y documentos que se generen para los clientes.
        </p>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '8px',
          border: '1px solid #d9cdb8',
        }}>
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Nombre de la sociedad</label>
            <input
              type="text"
              value={datos.nombre_sociedad}
              onChange={(e) => update('nombre_sociedad', e.target.value)}
              placeholder="Ej: LVMeritus S.L."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>CIF</label>
            <input
              type="text"
              value={datos.cif}
              onChange={(e) => update('cif', e.target.value)}
              placeholder="Ej: B12345678"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Dirección</label>
            <input
              type="text"
              value={datos.direccion}
              onChange={(e) => update('direccion', e.target.value)}
              placeholder="Calle, número, ciudad, código postal"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '18px' }}>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                type="text"
                value={datos.telefono}
                onChange={(e) => update('telefono', e.target.value)}
                placeholder="Ej: 600 000 000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={datos.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="Ej: info@empresa.com"
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: '#c0392b', fontSize: '13px', marginBottom: '15px' }}>{error}</p>
          )}

          {guardadoOk && !error && (
            <p style={{ color: '#27ae60', fontSize: '13px', marginBottom: '15px', fontWeight: 'bold' }}>
              Guardado correctamente.
            </p>
          )}

          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              width: '100%',
              background: '#b08d57',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: guardando ? 'default' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              opacity: guardando ? 0.6 : 1,
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar datos'}
          </button>
        </div>
      </div>
    </div>
  );
}