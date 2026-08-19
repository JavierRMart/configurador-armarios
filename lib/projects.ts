import { supabase } from './supabase';

export type Project = {
  id: string;
  user_id: string;
  nombre: string;
  tipo: 'armario' | 'puerta';
  config: any;
  estado: 'draft' | 'final';
  created_at: string;
  updated_at: string;
};

// Listar proyectos del usuario
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('user_projects')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Guardar proyecto nuevo
export async function createProject(
  nombre: string,
  tipo: 'armario' | 'puerta',
  config: any
): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user logged in');

  const { data, error } = await supabase
    .from('user_projects')
    .insert([{
      user_id: user.id,
      nombre,
      tipo,
      config: { ...config, schemaVersion: 1 },
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar proyecto
export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'nombre' | 'config' | 'estado'>>
): Promise<Project> {
  const { data, error } = await supabase
    .from('user_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Cargar proyecto
export async function getProject(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from('user_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Renombrar
export async function renameProject(id: string, nombre: string): Promise<void> {
  const { error } = await supabase
    .from('user_projects')
    .update({ nombre })
    .eq('id', id);

  if (error) throw error;
}

// Eliminar
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}