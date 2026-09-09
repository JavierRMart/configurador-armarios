const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');

// Lee el .env.seed a mano, sin librerías
const lineas = fs.readFileSync(path.join(RAIZ, '.env.seed'), 'utf-8').split('\n');
for (const linea of lineas) {
  const corte = linea.indexOf('=');
  if (corte > 0) {
    const nombre = linea.slice(0, corte).trim();
    const valor = linea.slice(corte + 1).trim();
    process.env[nombre] = valor;
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n=== VERIFICACION ===');
console.log('URL:', supabaseUrl ? 'OK' : 'FALTA');
console.log('CLAVE:', serviceRoleKey ? 'OK (' + serviceRoleKey.length + ' caracteres)' : 'FALTA');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\nFalta una variable en .env.seed');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const items = JSON.parse(fs.readFileSync(path.join(RAIZ, 'items_bd.json'), 'utf-8'));

console.log(`\nCargando ${items.length} items...\n`);

let insertados = 0;
let errores = 0;

(async () => {
  for (let i = 0; i < items.length; i += 100) {
    const lote = items.slice(i, i + 100);
    const numeroLote = Math.floor(i / 100) + 1;

    const conTarifa = lote.map(item => ({
      ...item,
      price_list_id: '2f5a9dce-daae-43f0-a8ef-afebb6202026'
    }));

    const { error } = await supabase.from('price_list_items').insert(conTarifa);

    if (error) {
      console.error(`Lote ${numeroLote}: ERROR - ${error.message}`);
      errores += lote.length;
    } else {
      insertados += lote.length;
      console.log(`Lote ${numeroLote}: ${lote.length} items insertados`);
    }
  }

  console.log(`\n========================`);
  console.log(`Insertados: ${insertados}/${items.length}`);
  console.log(`Errores: ${errores}`);
  console.log(`========================\n`);

  process.exit(0);
})();
