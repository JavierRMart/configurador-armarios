'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #f5f1e8 0%, #e8dcc8 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%',
      }}>
        <h1 style={{
          color: '#1a1612',
          margin: '0 0 10px 0',
          fontSize: '32px',
          textAlign: 'center',
        }}>
          ARVE
        </h1>
        <p style={{
          color: '#b08d57',
          margin: '0 0 30px 0',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          Armarios y Vestidores Exclusivos
        </p>

        {user && (
          <p style={{
            color: '#6b5d4f',
            margin: '0 0 30px 0',
            textAlign: 'center',
            fontSize: '13px',
          }}>
            Bienvenido, {user.email}
          </p>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}>
          <button
            onClick={() => router.push('/configurador')}
            style={{
              background: '#b08d57',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ➕ Nuevo Proyecto
          </button>

          <button
            onClick={() => router.push('/proyectos')}
            style={{
              background: '#b08d57',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            📂 Mis Proyectos
          </button>

          <button
            onClick={() => router.push('/tarifas')}
            style={{
              background: '#b08d57',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            📋 Gestionar Tarifas
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: '#c0392b',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '15px',
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}