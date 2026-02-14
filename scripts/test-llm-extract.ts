#!/usr/bin/env tsx
/**
 * Script para probar el servicio LLM (extracción + estimación de alquiler).
 * Obtiene datos del anuncio desde Idealista por id y llama a OpenAI.
 *
 * Requiere OPENAI_API_KEY en .env o en el entorno.
 *
 * Uso:
 *   npm run test-llm-extract -- <id-anuncio>
 *
 * Ejemplo:
 *   npm run test-llm-extract -- 110169372
 */

import 'dotenv/config';
import { autofillFromUrl } from '../src/autofill/autofillFromUrl';
import { fetchLlmPropertyExtract, SYSTEM_PROMPT, buildUserPrompt } from '../src/services/llmPropertyExtract';
import { getOpenAiApiKey } from '../src/config/llm.config';

function parseArgs(): string | null {
  const args = process.argv.slice(2);
  if (args.length < 1 || !args[0]?.trim()) {
    console.error('❌ Error: Falta el id del anuncio');
    console.log('\nUso:');
    console.log('  npm run test-llm-extract -- <id-anuncio>');
    console.log('\nEjemplo:');
    console.log('  npm run test-llm-extract -- 110169372');
    console.log('\nRequisito: OPENAI_API_KEY en .env o en el entorno.');
    return null;
  }
  return args[0].trim();
}

async function main() {
  const id = parseArgs();
  if (!id) {
    process.exit(1);
  }

  if (!getOpenAiApiKey()) {
    console.error('❌ OPENAI_API_KEY no configurada. Añádela a .env o export OPENAI_API_KEY=sk-...');
    process.exit(1);
  }

  const url = `https://www.idealista.com/inmueble/${id}/`;

  console.log('\n🧪 Test LLM Property Extract');
  console.log('═'.repeat(60));
  console.log(`   ID: ${id}`);
  console.log(`   URL: ${url}`);

  console.log('\n🔄 1) Obteniendo HTML desde Idealista y extrayendo datos...');
  const startFetch = Date.now();

  let autofill;
  try {
    autofill = await autofillFromUrl(url);
  } catch (error) {
    console.error('❌ Error en autofill:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log(`   (${Date.now() - startFetch}ms)`);
  console.log(`   ciudad: ${autofill.ciudad ?? '—'}`);
  console.log(`   buyPrice: ${autofill.buyPrice ?? '—'} €`);
  console.log(`   featuresText: ${autofill.featuresText ? `${autofill.featuresText.length} chars` : '—'}`);

  const city = autofill.ciudad?.trim() || '';
  const purchasePrice = autofill.buyPrice ?? 0;
  const featuresText = autofill.featuresText?.trim() || '';

  if (!city || !purchasePrice || !featuresText) {
    console.error('\n❌ Faltan datos para el LLM (ciudad, precio o featuresText). No se puede llamar a OpenAI.');
    process.exit(1);
  }

  const userPrompt = buildUserPrompt({ city, purchasePrice, featuresText });
  console.log('\n📤 Prompt enviado a OpenAI:');
  console.log('─'.repeat(60));
  console.log('[System]\n' + SYSTEM_PROMPT);
  console.log('\n[User]\n' + userPrompt);
  console.log('─'.repeat(60));

  console.log('\n🔄 2) Llamando a OpenAI...');
  const startLlm = Date.now();
  const result = await fetchLlmPropertyExtract({ city, purchasePrice, featuresText });
  console.log(`   (${Date.now() - startLlm}ms)`);

  if (!result) {
    console.log('\n⚠️  LLM devolvió null (revisa logs anteriores: API key, timeout, validación).');
    process.exit(0);
  }

  console.log('\n📊 Resultado LLM:');
  console.log('─'.repeat(60));
  console.log(`   sqm:      ${result.sqm ?? '—'}`);
  console.log(`   rooms:    ${result.rooms ?? '—'}`);
  console.log(`   bathrooms: ${result.bathrooms ?? '—'}`);
  console.log(`   maxRent:  ${result.maxRent} €/mes`);
  console.log(`   source:   ${result.source}`);
  console.log('═'.repeat(60));
  console.log('\n💡 Tokens consumidos: ver log "llm-property" arriba (prompt, completion, total).');
  process.exit(0);
}

main();
