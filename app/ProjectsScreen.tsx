'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, deleteProject, renameProject, Project } from '@/lib/projects';

export default function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      alert('Error al cargar proyectos: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar «${nombre}»? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      alert('Error al eliminar: ' + error);
    }
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }
    try {
      await renameProject(id, newName);
      setProjects(projects.map(p => p.id === id ? { ...p, nombre: newName } : p));
      setRenaming(null);
      setNewName('');
    } catch (error) {
      alert('Error al renombrar: ' + error);
    }
  };

  const filtered = projects.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mis proyectos</h1>
            <p className="text-slate-600 mt-1">{filtered.length} proyecto{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition"
          >
            ← Atrás
          </button>
        </div>

        {/* Búsqueda */}
        <input
          type="text"
          placeholder="Buscar proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12">Cargando proyectos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600 mb-4">Todavía no tienes ningún proyecto guardado</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Crear proyecto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((project) => (
              <div key={project.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center hover:shadow-md transition">
                <div className="flex-1">
                  {renaming === project.id ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                      className="px-2 py-1 border border-blue-400 rounded"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(project.id);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                    />
                  ) : (
                    <div>
                      <h3 className="font-semibold text-slate-900">{project.nombre}</h3>
                      <div className="flex gap-4 text-sm text-slate-500 mt-1">
                        <span>{project.tipo === 'armario' ? '🚪 Armario' : '🪟 Puerta'}</span>
                        <span>{new Date(project.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/configurador?proyecto=${project.id}`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={() => {
                      setRenaming(project.id);
                      setNewName(project.nombre);
                    }}
                    className="px-3 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(project.id, project.nombre)}
                    className="px-3 py-2 bg-red-200 text-red-900 rounded hover:bg-red-300 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}