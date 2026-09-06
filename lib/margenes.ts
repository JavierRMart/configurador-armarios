import { supabase } from './supabase';

export type MargenFamilia = {
  id: string;
  categoria: string;
  margen_porcentaje: number;
};

// Devuelve todos los márgenes del usuario actual
export async function getMargenes(): Promise<MargenFamilia[]> {
  const { data, error } = await supabase
    .from('margenes_familia')
    .select('*')
    .order('categoria', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Devuelve el margen de una categoría concreta. Si no hay fila para
// esa categoría, devuelve 0 (sin margen) en vez de romper el cálculo.
export async function getMargenPorCategoria(categoria: string): Promise<number> {
  const { data, error } = await supabase
    .from('margenes_familia')
    .select('margen_porcentaje')
    .eq('categoria', categoria)
    .maybeSingle();

  if (error) throw error;
  return data?.margen_porcentaje ?? 0;
}

// Actualiza el margen de una categoría existente
export async function updateMargen(id: string, margen: number) {
  const { error } = await supabase
    .from('margenes_familia')
    .update({ margen_porcentaje: margen, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}