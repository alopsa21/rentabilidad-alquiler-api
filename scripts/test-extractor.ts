#!/usr/bin/env tsx
/**
 * Script de testing manual para el extractor de Idealista.
 * Obtiene el HTML del anuncio desde Idealista y muestra los datos extraídos
 * (igual que el test idealistaV1-fixture pero contra un anuncio real por id).
 * Si hay OPENAI_API_KEY en .env, el autofill llamará al LLM y devolverá estimatedRent.
 *
 * Uso:
 *   npm run test-extractor -- <id-anuncio>
 *
 * Ejemplo:
 *   npm run test-extractor -- 110169372
 */

import 'dotenv/config';
import { autofillFromUrl } from '../src/autofill/autofillFromUrl';

function parseArgs(): string | null {
  const args = process.argv.slice(2);
  if (args.length < 1 || !args[0]?.trim()) {
    console.error('❌ Error: Falta el id del anuncio');
    console.log('\nUso:');
    console.log('  npm run test-extractor -- <id-anuncio>');
    console.log('\nEjemplo:');
    console.log('  npm run test-extractor -- 110169372');
    return null;
  }
  return args[0].trim();
}

async function main() {
  const id = parseArgs();
  if (!id) {
    process.exit(1);
  }

  const url = `https://www.idealista.com/inmueble/${id}/`;

  console.log('\n🧪 Test Extractor Idealista (fetch desde Idealista)');
  console.log('═'.repeat(60));
  console.log(`\n   ID Anuncio: ${id}`);
  console.log(`   URL: ${url}`);

  console.log('\n🔄 Obteniendo HTML desde Idealista y extrayendo datos...');
  const startTime = Date.now();

  try {
    const result = await autofillFromUrl(url);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Extracción completada (${duration}ms)`);
    console.log('\n📊 Datos extraídos:');
    console.log('─'.repeat(60));
    console.log(`   Precio: ${result.buyPrice != null ? `${result.buyPrice} €` : '—'}`);
    console.log(`   Metros: ${result.sqm ?? '—'} m²`);
    console.log(`   Habitaciones: ${result.rooms ?? '—'}`);
    console.log(`   Baños: ${result.banos ?? '—'}`);
    console.log(`   Ciudad: ${result.ciudad ?? '—'}`);
    console.log(`   Comunidad: ${result.codigoComunidadAutonoma ?? '—'}`);
    console.log(`   Source: ${result.source}`);
    if (result.estimatedRent != null) {
      console.log(`   Alquiler estimado: ${result.estimatedRent} €/mes`);
    }
    if (result.featuresText) {
      console.log(`   featuresText:\n${result.featuresText}`);
    } else {
      console.log(`   featuresText: (vacío o no encontrado)`);
    }
    console.log('═'.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la extracción:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
