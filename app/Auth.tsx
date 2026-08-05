'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('✅ Cuenta creada. Verifica tu email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: '#f5f1e8',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #d9cdb8',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{ color: '#1a1612', marginBottom: '30px', textAlign: 'center' }}>
          LVMeritus
        </h1>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              fontSize: '12px',
              color: '#6b5d4f',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '5px',
              textTransform: 'uppercase',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d9cdb8',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '12px',
              color: '#6b5d4f',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '5px',
              textTransform: 'uppercase',
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d9cdb8',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fde8e8',
              color: '#c0392b',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#1a1612',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '10px',
            }}
          >
            {loading ? '⏳ Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Ingresar')}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#B08D57',
            border: '1px solid #B08D57',
            padding: '12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {isSignUp ? '¿Ya tienes cuenta? Ingresar' : '¿No tienes cuenta? Crear una'}
        </button>
      </div>
    </div>
  );
}