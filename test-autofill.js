/**
 * Script de prueba rápida para el extractor de Idealista
 * 
 * Uso: node test-autofill.js <URL_DE_IDEALISTA>
 * 
 * Ejemplo: node test-autofill.js "https://www.idealista.com/inmueble/12345678/"
 */

const url = process.argv[2];

if (!url) {
  console.error('Por favor, proporciona una URL de Idealista');
  console.error('Uso: node test-autofill.js <URL>');
  process.exit(1);
}

async function testAutofill() {
  try {
    const response = await fetch('http://localhost:3000/autofill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    
    console.log('\n📊 Resultados de la extracción:');
    console.log('================================');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');
    
    if (data.buyPrice) {
      console.log('✅ Precio extraído:', data.buyPrice, '€');
    } else {
      console.log('❌ No se pudo extraer el precio');
    }
    
    if (data.sqm) {
      console.log('✅ Metros cuadrados extraídos:', data.sqm, 'm²');
    } else {
      console.log('❌ No se pudo extraer los metros cuadrados');
    }
    
    if (data.rooms) {
      console.log('✅ Habitaciones extraídas:', data.rooms);
    } else {
      console.log('❌ No se pudo extraer el número de habitaciones');
    }
    
    if (data.banos) {
      console.log('✅ Baños extraídos:', data.banos);
    } else {
      console.log('❌ No se pudo extraer el número de baños');
    }
    
    if (data.ciudad) {
      console.log('✅ Ciudad extraída:', data.ciudad);
    } else {
      console.log('❌ No se pudo extraer la ciudad');
    }
    
    if (data.comunidadAutonoma) {
      console.log('✅ Comunidad autónoma extraída:', data.comunidadAutonoma);
    } else {
      console.log('❌ No se pudo extraer la comunidad autónoma');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('fetch')) {
      console.error('\n💡 Asegúrate de que la API esté corriendo en http://localhost:3000');
      console.error('   Ejecuta: cd rentabilidad-alquiler-api && npm run dev');
    }
  }
}

testAutofill();
