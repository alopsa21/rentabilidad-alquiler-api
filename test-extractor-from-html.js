/**
 * Script de prueba para el endpoint POST /autofill/from-html
 * 
 * Uso:
 *   node test-extractor-from-html.js <archivo.html> <url>
 * 
 * Ejemplo:
 *   node test-extractor-from-html.js idealista_page.html "https://www.idealista.com/inmueble/110277789/"
 */

import fs from 'fs';

const [,, htmlFile, url] = process.argv;

if (!htmlFile || !url) {
  console.error('❌ Faltan argumentos');
  console.log('Uso: node test-extractor-from-html.js <archivo.html> <url>');
  console.log('Ejemplo: node test-extractor-from-html.js idealista_page.html "https://www.idealista.com/inmueble/110277789/"');
  process.exit(1);
}

console.log(`📄 Leyendo HTML de: ${htmlFile}`);
const html = fs.readFileSync(htmlFile, 'utf-8');
console.log(`📏 Tamaño del HTML: ${html.length} caracteres`);
console.log(`🔗 URL: ${url}\n`);

console.log('🔍 Enviando a la API para extraer datos...\n');

const API_URL = 'http://localhost:3000/autofill/from-html';

fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url, html }),
})
  .then(async (response) => {
    const data = await response.json();
    
    console.log('✅ Respuesta de la API:');
    console.log('================================\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n================================\n');
    
    console.log('📊 DATOS EXTRAÍDOS:');
    console.log('-------------------');
    console.log(`${data.buyPrice !== null ? '✅' : '❌'} Precio: ${data.buyPrice !== null ? data.buyPrice.toLocaleString('es-ES') + ' €' : 'NO EXTRAÍDO'}`);
    console.log(`${data.sqm !== null ? '✅' : '❌'} Metros cuadrados: ${data.sqm !== null ? data.sqm + ' m²' : 'NO EXTRAÍDO'}`);
    console.log(`${data.rooms !== null ? '✅' : '❌'} Habitaciones: ${data.rooms !== null ? data.rooms : 'NO EXTRAÍDO'}`);
    console.log(`${data.banos !== null ? '✅' : '❌'} Baños: ${data.banos !== null ? data.banos : 'NO EXTRAÍDO'}`);
    console.log(`${data.ciudad !== null ? '✅' : '❌'} Ciudad: ${data.ciudad !== null ? data.ciudad : 'NO EXTRAÍDA'}`);
    console.log(`${data.codigoComunidadAutonoma !== null ? '✅' : '❌'} Código comunidad autónoma: ${data.codigoComunidadAutonoma !== null ? data.codigoComunidadAutonoma : 'NO EXTRAÍDO'}`);
    console.log(`\n🏷️  Source: ${data.source}`);
    
    // Verificar si el HTML contiene __NEXT_DATA__
    const hasNextData = html.includes('id="__NEXT_DATA__"');
    console.log(`\n🔍 ¿Tiene __NEXT_DATA__? ${hasNextData ? '✅ SÍ' : '❌ NO'}`);
    
    if (!hasNextData) {
      console.log('\n⚠️  ADVERTENCIA: El HTML no contiene __NEXT_DATA__');
      console.log('   Idealista usa Next.js y embebe los datos en ese script.');
      console.log('   Posibles causas:');
      console.log('   - Idealista devolvió una página de error/captcha');
      console.log('   - Faltan cookies necesarias en el curl');
      console.log('   - La URL no es válida o el anuncio ya no existe');
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Asegúrate de que la API esté corriendo en http://localhost:3000');
    console.log('   Ejecuta: cd rentabilidad-alquiler-api && npm run dev');
    process.exit(1);
  });
