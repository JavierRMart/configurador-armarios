import { supabase } from './supabase';

export type DatosEmpresa = {
  id?: string;
  nombre_sociedad: string;
  direccion: string;
  cif: string;
  email: string;
  telefono: string;
};

const VACIO: DatosEmpresa = {
  nombre_sociedad: '',
  direccion: '',
  cif: '',
  email: '',
  telefono: '',
};

// Devuelve los datos de empresa del usuario actual.
// Si todavía no ha creado ninguno, devuelve una plantilla vacía (sin id).
export async function getDatosEmpresa(): Promise<DatosEmpresa> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay ninguna sesión iniciada.');

  const { data, error } = await supabase
    .from('datos_empresa')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data || VACIO;
}

// Guarda los datos de empresa. Si ya existía una fila, la actualiza.
// Si es la primera vez, la crea.
export async function guardarDatosEmpresa(datos: DatosEmpresa): Promise<DatosEmpresa> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay ninguna sesión iniciada.');

  if (datos.id) {
    const { data, error } = await supabase
      .from('datos_empresa')
      .update({
        nombre_sociedad: datos.nombre_sociedad,
        direccion: datos.direccion,
        cif: datos.cif,
        email: datos.email,
        telefono: datos.telefono,
        updated_at: new Date().toISOString(),
      })
      .eq('id', datos.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('datos_empresa')
    .insert([{ ...datos, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}