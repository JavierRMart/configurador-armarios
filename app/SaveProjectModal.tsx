'use client';

import { useState } from 'react';
import { createProject, updateProject } from '@/lib/projects';

export default function SaveProjectModal({
  isOpen,
  onClose,
  projectId,
  tipo,
  config,
  onSaveSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  tipo: 'armario' | 'puerta';
  config: any;
  onSaveSuccess: (id: string, nombre: string) => void;
}) {
  const [nombre, setNombre] = useState(
    projectId ? '' : `${tipo === 'armario' ? 'Armario' : 'Puerta'} — ${new Date().toLocaleDateString('es-ES')}`
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'save' | 'update'>('save');

  const handleSave = async () => {
    if (!nombre.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (projectId && mode === 'update') {
        await updateProject(projectId, { config });
        onSaveSuccess(projectId, nombre);
      } else {
        const result = await createProject(nombre, tipo, config);
        onSaveSuccess(result.id, result.nombre);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1a1612' }}>
          {projectId ? 'Guardar cambios' : 'Guardar proyecto'}
        </h2>

        {projectId && !nombre && (
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setMode('update')}
              style={{
                flex: 1,
                padding: '10px',
                background: mode === 'update' ? '#b08d57' : '#e0e0e0',
                color: mode === 'update' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Actualizar
            </button>
            <button
              onClick={() => setMode('save')}
              style={{
                flex: 1,
                padding: '10px',
                background: mode === 'save' ? '#b08d57' : '#e0e0e0',
                color: mode === 'save' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Guardar como nuevo
            </button>
          </div>
        )}

        {mode === 'save' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1a1612' }}>
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError('');
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '10px',
                border: error ? '2px solid #c0392b' : '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ color: '#c0392b', fontSize: '12px', margin: '5px 0 0 0' }}>{error}</p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px',
              background: '#e0e0e0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px',
              background: '#b08d57',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}