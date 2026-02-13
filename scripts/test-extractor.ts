#!/usr/bin/env tsx
/**
 * Script de testing manual para el extractor de Idealista.
 *
 * Uso:
 *   npm run script:test-extractor -- <id> <sqm> <rooms> <banos> <precio> <ciudad> <codauto>
 *   npm run script:test-extractor -- --verbose <id> <sqm> <rooms> <banos> <precio> <ciudad> <codauto>
 *
 * Con --verbose (o DEBUG=1) se muestran los detalles de cada request a Idealista (URL, headers).
 */

// Habilitar verbose de requests si se pasa --verbose
if (process.argv.includes('--verbose')) {
  process.env.DEBUG = '1';
  process.argv.splice(process.argv.indexOf('--verbose'), 1);
}

import { autofillFromUrl } from '../src/autofill/autofillFromUrl';

interface ExpectedValues {
  id: string;
  sqm: number;
  rooms: number;
  banos: number;
  precioCompra: number;
  ciudad: string;
  codigoComunidadAutonoma: number;
}

function parseArgs(): ExpectedValues | null {
  const args = process.argv.slice(2).filter((a) => a !== '--verbose');

  if (args.length < 7) {
    console.error('❌ Error: Faltan parámetros');
    console.log('\nUso:');
    console.log('  npm run script:test-extractor -- <id> <sqm> <rooms> <banos> <precio> <ciudad> <codauto>');
    console.log('\nEjemplo:');
    console.log('  npm run script:test-extractor -- 110169372 80 3 2 150000 Madrid 13');
    return null;
  }

  const [id, sqm, rooms, banos, precio, ciudad, codauto] = args;

  return {
    id: id.trim(),
    sqm: parseInt(sqm, 10),
    rooms: parseInt(rooms, 10),
    banos: parseInt(banos, 10),
    precioCompra: parseInt(precio, 10),
    ciudad: ciudad.trim(),
    codigoComunidadAutonoma: parseInt(codauto, 10),
  };
}

function validateNumber(value: number | null, expected: number, field: string): boolean {
  if (value === null) {
    console.log(`  ❌ ${field}: null (esperado: ${expected})`);
    return false;
  }
  if (value === expected) {
    console.log(`  ✅ ${field}: ${value}`);
    return true;
  }
  console.log(`  ❌ ${field}: ${value} (esperado: ${expected})`);
  return false;
}

function validateString(value: string | null, expected: string, field: string): boolean {
  if (!value) {
    console.log(`  ❌ ${field}: null/empty (esperado: "${expected}")`);
    return false;
  }
  const normalized = value.toLowerCase().trim();
  const expectedNorm = expected.toLowerCase().trim();
  if (normalized === expectedNorm) {
    console.log(`  ✅ ${field}: "${value}"`);
    return true;
  }
  console.log(`  ❌ ${field}: "${value}" (esperado: "${expected}")`);
  return false;
}

async function main() {
  const expected = parseArgs();
  if (!expected) {
    process.exit(1);
  }

  const url = `https://www.idealista.com/inmueble/${expected.id}/`;

  console.log('\n🧪 Testing Extractor Idealista');
  console.log('═'.repeat(60));
  console.log(`\n📋 Parámetros esperados:`);
  console.log(`   ID Anuncio: ${expected.id}`);
  console.log(`   URL: ${url}`);
  console.log(`   Metros cuadrados: ${expected.sqm}`);
  console.log(`   Habitaciones: ${expected.rooms}`);
  console.log(`   Baños: ${expected.banos}`);
  console.log(`   Precio compra: ${expected.precioCompra} €`);
  console.log(`   Ciudad: ${expected.ciudad}`);
  console.log(`   Código Comunidad: ${expected.codigoComunidadAutonoma}`);

  console.log(`\n🔄 Ejecutando autofillFromUrl (fetch HTML + extract)...`);
  const startTime = Date.now();

  try {
    const result = await autofillFromUrl(url);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Extracción completada (${duration}ms)`);
    console.log('\n📊 Resultados extraídos:');
    console.log('─'.repeat(60));

    const validations = [
      validateNumber(result.buyPrice, expected.precioCompra, 'Precio compra'),
      validateNumber(result.sqm, expected.sqm, 'Metros cuadrados'),
      validateNumber(result.rooms, expected.rooms, 'Habitaciones'),
      validateNumber(result.banos, expected.banos, 'Baños'),
      validateString(result.ciudad, expected.ciudad, 'Ciudad'),
      validateNumber(result.codigoComunidadAutonoma, expected.codigoComunidadAutonoma, 'Código Comunidad'),
    ];

    console.log('\n📈 Datos adicionales:');
    console.log(`   Source: ${result.source}`);
    if (result.estimatedRent != null) {
      console.log(`   ✅ Alquiler estimado: ${result.estimatedRent} €/mes`);
    } else {
      console.log(`   ⚠️  Alquiler estimado: no calculado`);
    }

    console.log('\n' + '═'.repeat(60));
    const passed = validations.every(v => v);
    
    if (passed) {
      console.log('✅ TODAS LAS VALIDACIONES PASARON');
      process.exit(0);
    } else {
      const failed = validations.filter(v => !v).length;
      console.log(`❌ ${failed} VALIDACIÓN(ES) FALLARON`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error durante la extracción:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
