import { supabase } from './supabase';
import { getMargenPorCategoria } from './margenes';

// Traduce una puerta del configurador al vocabulario de la tarifa de Imalasa.
// Devuelve null si esa combinación todavía no está soportada.
//
// CIEGA + BATIENTE -> CIEGA / BLOCK
// VIDRIERA + BATIENTE -> el tipo real de Imalasa guardado en "subtipo"
//   (ej. "V1L, V1C" o "Parrilla Enrasada V3, V4") / BLOCK
//
// CORREDERA (ciega o vidriera) sigue sin soportarse: no es un precio suelto,
// es una receta de varias piezas (casonetto, herraje, tapetas, canal
// inferior) que aún no está definida con el proveedor.
function mapearATarifa(puerta: any): { tipo: string; formato: string } | null {
  if (puerta.tipo === 'CIEGA' && puerta.subtipo === 'BATIENTE') {
    return { tipo: 'CIEGA', formato: 'BLOCK' };
  }

  if (puerta.tipo === 'VIDRIERA' && puerta.instalacionVidriera === 'BATIENTE' && puerta.subtipo) {
    return { tipo: puerta.subtipo, formato: 'BLOCK' };
  }

  return null;
}

export type LineaPresupuesto = {
  puertaId: number;
  ubicacion: string;
  modelo: string;
  tipo: string;
  subtipo: string;
  color: string;
  cerco: string;
  tapetas: string;
  pernios: string;
  herraje: string;
  unidades: number;
  soportado: boolean;
  motivo?: string;
  precioTarifa?: number;
  descuentoPorcentaje?: number;
  margenPorcentaje?: number;
  precioUnitario?: number;
  subtotal?: number;
};

// Calcula el precio de UNA puerta:
// precio de tarifa -> menos el descuento del proveedor -> más el margen
// de la familia (puerta/armario) -> precio unitario al cliente.
export async function calcularPrecioPuerta(puerta: any): Promise<LineaPresupuesto> {
  const base: LineaPresupuesto = {
    puertaId: puerta.id,
    ubicacion: puerta.ubicacion || '(sin ubicación)',
    modelo: puerta.modelo || '(sin modelo)',
    tipo: puerta.tipo,
    subtipo: puerta.subtipo,
    color: puerta.color || '',
    cerco: puerta.cerco === 'con' ? 'Con burlete' : 'Sin burlete',
    tapetas: puerta.tapetas || '',
    pernios: puerta.pernios || '',
    herraje: puerta.herraje || '',
    unidades: puerta.unidades || 1,
    soportado: false,
  };

  if (!puerta.modelo) {
    return { ...base, motivo: 'No se ha elegido modelo todavía.' };
  }

  const mapeo = mapearATarifa(puerta);
  if (!mapeo) {
    const instalacion = puerta.tipo === 'CIEGA' ? puerta.subtipo : puerta.instalacionVidriera;
    const motivo =
      instalacion === 'CORREDERA'
        ? 'Todavía no se puede calcular correderas.'
        : puerta.tipo === 'VIDRIERA'
        ? 'Falta elegir el tipo de vidriera o la instalación.'
        : 'Todavía no se puede calcular este caso.';
    return { ...base, motivo };
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

  // Descuento propio de la tarifa (el que negocia tu padre con el proveedor)
  const { data: tarifaData } = await supabase
    .from('price_lists')
    .select('descuento_porcentaje')
    .eq('id', priceListId)
    .single();

  const descuentoPorcentaje = tarifaData?.descuento_porcentaje ?? 0;
  const costeTrasDescuento = precioTarifa * (1 - descuentoPorcentaje / 100);

  // Margen de la familia de producto (lo que tu padre añade para vender)
  const margenPorcentaje = await getMargenPorCategoria('puerta');
  const precioUnitario = costeTrasDescuento * (1 + margenPorcentaje / 100);

  const subtotal = precioUnitario * base.unidades;

  return {
    ...base,
    soportado: true,
    precioTarifa,
    descuentoPorcentaje,
    margenPorcentaje,
    precioUnitario,
    subtotal,
  };
}

export type ResumenPresupuesto = {
  lineas: LineaPresupuesto[];
  subtotalSinIva: number;
  ivaPorcentaje: number;
  cantidadIva: number;
  totalConIva: number;
  cantidadSoportadas: number;
  cantidadNoSoportadas: number;
};

const IVA_PORCENTAJE = 21;

// Calcula el presupuesto de TODAS las puertas de un proyecto, con el
// desglose de IVA que va en el documento final.
export async function calcularPresupuestoProyecto(puertas: any[]): Promise<ResumenPresupuesto> {
  const lineas = await Promise.all(puertas.map((p) => calcularPrecioPuerta(p)));

  const subtotalSinIva = lineas.reduce((suma, l) => suma + (l.subtotal || 0), 0);
  const cantidadIva = subtotalSinIva * (IVA_PORCENTAJE / 100);
  const totalConIva = subtotalSinIva + cantidadIva;

  const cantidadSoportadas = lineas.filter((l) => l.soportado).length;
  const cantidadNoSoportadas = lineas.length - cantidadSoportadas;

  return {
    lineas,
    subtotalSinIva,
    ivaPorcentaje: IVA_PORCENTAJE,
    cantidadIva,
    totalConIva,
    cantidadSoportadas,
    cantidadNoSoportadas,
  };
}