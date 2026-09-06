import { supabase } from './supabase';

// Traduce una puerta del configurador al vocabulario de la tarifa de Imalasa.
// Devuelve null si esa combinación todavía no está soportada.
//
// Por qué solo CIEGA+BATIENTE:
// - El configurador dice "V-1, V-2, V-3, V-4". Imalasa dice "V1L, V1C" juntas
//   y "V3, V4" juntas, y no tiene V-2. Falta decidir cómo se traduce eso.
// - CORREDERA no es un precio suelto: es una receta de varias piezas
//   (casonetto, herraje, tapetas, canal inferior) que aún no está definida.
function mapearATarifa(puerta: any): { tipo: string; formato: string } | null {
  if (puerta.tipo === 'CIEGA' && puerta.subtipo === 'BATIENTE') {
    return { tipo: 'CIEGA', formato: 'BLOCK' };
  }
  return null;
}

export type LineaPresupuesto = {
  puertaId: number;
  ubicacion: string;
  modelo: string;
  tipo: string;
  subtipo: string;
  unidades: number;
  soportado: boolean;
  motivo?: string;
  precioTarifa?: number;
  descuentoPorcentaje?: number;
  precioUnitario?: number;
  subtotal?: number;
};

// Calcula el precio de UNA puerta, ya con el descuento de su tarifa aplicado.
export async function calcularPrecioPuerta(puerta: any): Promise<LineaPresupuesto> {
  const base: LineaPresupuesto = {
    puertaId: puerta.id,
    ubicacion: puerta.ubicacion || '(sin ubicación)',
    modelo: puerta.modelo || '(sin modelo)',
    tipo: puerta.tipo,
    subtipo: puerta.subtipo,
    unidades: puerta.unidades || 1,
    soportado: false,
  };

  if (!puerta.modelo) {
    return { ...base, motivo: 'No se ha elegido modelo todavía.' };
  }

  const mapeo = mapearATarifa(puerta);
  if (!mapeo) {
    return {
      ...base,
      motivo: `Todavía no se puede calcular ${puerta.tipo === 'VIDRIERA' ? 'vidrieras' : 'correderas'}.`,
    };
  }

  const { data, error } = await supabase
    .from('price_list_items')
    .select('precio, price_list_id')
    .contains('atributos', { modelo: puerta.modelo, tipo: mapeo.tipo, formato: mapeo.formato })
    .limit(1);

  if (error) {
    return { ...base, motivo: 'Error al consultar la tarifa: ' + error.message };
  }

  if (!data || data.length === 0) {
    return { ...base, motivo: `No hay precio en tarifa para ${puerta.modelo} / ${mapeo.tipo} / ${mapeo.formato}.` };
  }

  const precioTarifa = data[0].precio;
  const priceListId = data[0].price_list_id;

  // Buscamos el descuento propio de esa tarifa. Si por lo que sea no se
  // encuentra, seguimos sin descuento antes que romper el cálculo.
  const { data: tarifaData } = await supabase
    .from('price_lists')
    .select('descuento_porcentaje')
    .eq('id', priceListId)
    .single();

  const descuentoPorcentaje = tarifaData?.descuento_porcentaje ?? 0;
  const precioUnitario = precioTarifa * (1 - descuentoPorcentaje / 100);
  const subtotal = precioUnitario * base.unidades;

  return {
    ...base,
    soportado: true,
    precioTarifa,
    descuentoPorcentaje,
    precioUnitario,
    subtotal,
  };
}

export type ResumenPresupuesto = {
  lineas: LineaPresupuesto[];
  total: number;
  cantidadSoportadas: number;
  cantidadNoSoportadas: number;
};

// Calcula el presupuesto de TODAS las puertas de un proyecto.
export async function calcularPresupuestoProyecto(puertas: any[]): Promise<ResumenPresupuesto> {
  const lineas = await Promise.all(puertas.map((p) => calcularPrecioPuerta(p)));

  const total = lineas.reduce((suma, l) => suma + (l.subtotal || 0), 0);
  const cantidadSoportadas = lineas.filter((l) => l.soportado).length;
  const cantidadNoSoportadas = lineas.length - cantidadSoportadas;

  return { lineas, total, cantidadSoportadas, cantidadNoSoportadas };
}