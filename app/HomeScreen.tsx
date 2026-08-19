'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Configurador ARVE</h1>
            <p className="text-lg text-slate-600 mt-2">Hola, {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Main actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nuevo proyecto */}
          <button
            onClick={() => router.push('/configurador?nuevo=armario')}
            className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-slate-200 hover:border-blue-400 text-left"
          >
            <div className="text-4xl mb-4">➕</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Nuevo proyecto</h2>
            <p className="text-slate-600">Empieza a configurar un armario o puerta nueva</p>
          </button>

          {/* Mis proyectos */}
          <button
            onClick={() => router.push('/proyectos')}
            className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-slate-200 hover:border-green-400 text-left"
          >
            <div className="text-4xl mb-4">📂</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Mis proyectos</h2>
            <p className="text-slate-600">Abre un proyecto guardado o consulta tu historial</p>
          </button>
        </div>
      </div>
    </div>
  );
}