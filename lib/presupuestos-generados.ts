import { supabase } from './supabase';

// Reserva el siguiente número de presupuesto y deja constancia de que se
// ha generado. Devuelve el número reservado, ya formateado con ceros
// delante (00001, 00002...).
//
// Reintenta si dos generaciones chocan por el mismo número al mismo
// tiempo, gracias a la restricción UNIQUE de la tabla.
export async function reservarSiguienteNumero(
  proyectoId: string,
  totalConIva: number
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay ninguna sesión iniciada.');

  const { data: ultimo } = await supabase
    .from('presupuestos_generados')
    .select('numero')
    .eq('user_id', user.id)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle();

  let siguiente = (ultimo?.numero || 0) + 1;
  const MAX_INTENTOS = 5;

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const { error } = await supabase
      .from('presupuestos_generados')
      .insert([{
        user_id: user.id,
        proyecto_id: proyectoId,
        numero: siguiente,
        total_con_iva: totalConIva,
      }]);

    if (!error) {
      return String(siguiente).padStart(5, '0');
    }

    // Si el error es porque el número ya existía (choque), probamos con el siguiente.
    // Si es otro tipo de error, no tiene sentido seguir intentando.
    if (error.code === '23505') {
      siguiente++;
      continue;
    }

    throw error;
  }

  throw new Error('No se pudo reservar un número de presupuesto tras varios intentos.');
}