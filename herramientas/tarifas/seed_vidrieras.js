const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');

// Lee el .env.seed a mano (mismo patrón que seed_prices.js)
const lineas = fs.readFileSync(path.join(RAIZ, '.env.seed'), 'utf-8').split('\n');
const vars = {};
for (const linea of lineas) {
  const corte = linea.indexOf('=');
  if (corte > 0) {
    vars[linea.slice(0, corte).trim()] = linea.slice(corte + 1).trim();
  }
}

const supabaseUrl = vars['SUPABASE_URL'];
const serviceRoleKey = vars['SUPABASE_SERVICE_ROLE_KEY'] || vars['SUPABASE_SERVICE_ROLE'];

console.log('\n=== VERIFICACION ===');
console.log('URL:', supabaseUrl ? 'OK' : 'FALTA');
console.log('CLAVE:', serviceRoleKey ? 'OK (' + serviceRoleKey.length + ' caracteres)' : 'FALTA');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\nFalta una variable en .env.seed');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CARPETA = path.join(RAIZ, 'vidrieras_recortadas');
const archivos = fs.readdirSync(CARPETA).filter(f => f.endsWith('.png'));

// Quita tildes, eñes y cualquier caracter raro que Supabase no acepte
// en el nombre de un archivo (mismo problema que dio la codificación
// de Windows al descomprimir el zip con acentos).
function limpiarNombre(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // quita los acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // cualquier otro caracter raro -> guion bajo
}

console.log(`\nSubiendo ${archivos.length} imagenes al bucket "vidrieras"...\n`);

let subidos = 0;
let errores = 0;

(async () => {
  for (const nombreOriginal of archivos) {
    const nombreLimpio = limpiarNombre(nombreOriginal);
    const rutaLocal = path.join(CARPETA, nombreOriginal);
    const contenido = fs.readFileSync(rutaLocal);

    const { error } = await supabase.storage
      .from('vidrieras')
      .upload(nombreLimpio, contenido, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error(`ERROR con ${nombreOriginal}: ${error.message}`);
      errores++;
    } else {
      const aviso = nombreLimpio !== nombreOriginal ? ` (renombrado a ${nombreLimpio})` : '';
      console.log(`OK: ${nombreOriginal}${aviso}`);
      subidos++;
    }
  }

  console.log(`\n========================`);
  console.log(`Subidos: ${subidos}/${archivos.length}`);
  console.log(`Errores: ${errores}`);
  console.log(`========================\n`);

  process.exit(0);
})();
