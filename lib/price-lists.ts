import { supabase } from './supabase';

export async function createPriceList(
  fabricante: string,
  nombre: string,
  vigente_desde: string,
  file_path: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay ninguna sesión iniciada.');

  const { data, error } = await supabase
    .from('price_lists')
    .insert([{
      user_id: user.id,
      fabricante,
      nombre,
      vigente_desde,
      file_path,
      tipo: 'puerta',
      estado: 'procesando',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPriceLists() {
  const { data, error } = await supabase
    .from('price_lists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPriceList(id: string) {
  const { data, error } = await supabase
    .from('price_lists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePriceListState(
  id: string,
  estado: string,
  extraccion?: any
) {
  const updates: any = { estado };
  if (extraccion) updates.extraccion = extraccion;

  const { data, error } = await supabase
    .from('price_lists')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addPriceListItems(items: any[]) {
  if (items.length === 0) return [];

  const { data, error } = await supabase
    .from('price_list_items')
    .insert(items);

  if (error) throw error;
  return data || [];
}

export async function getPriceListItems(priceListId: string) {
  const { data, error } = await supabase
    .from('price_list_items')
    .select('*')
    .eq('price_list_id', priceListId)
    .order('pagina_origen', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Borra los items de un rango de páginas, para poder reprocesar sin duplicar
export async function deleteItemsByPageRange(
  priceListId: string,
  paginaInicio: number,
  paginaFin: number
) {
  const { error } = await supabase
    .from('price_list_items')
    .delete()
    .eq('price_list_id', priceListId)
    .gte('pagina_origen', paginaInicio)
    .lte('pagina_origen', paginaFin);

  if (error) throw error;
}

// Borra todos los items de una tarifa
export async function deleteAllItems(priceListId: string) {
  const { error } = await supabase
    .from('price_list_items')
    .delete()
    .eq('price_list_id', priceListId);

  if (error) throw error;
}