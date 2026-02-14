#!/usr/bin/env tsx
/**
 * Script para comprobar el fetch del informe de Idealista (precio €/m²).
 *
 * Llama a la URL del informe, extrae el precio por m² y comprueba si coincide con el esperado.
 *
 * Uso:
 *   npm run script:test-fetch-report -- <community_slug> <province_slug> <city_slug> <precio_eur_m2>
 *   npm run script:test-fetch-report -- --verbose <community_slug> <province_slug> <city_slug> <precio_eur_m2>
 *
 * Ejemplo (Dénia):
 *   npm run script:test-fetch-report -- comunitat-valenciana alicante-alacant denia 12.5
 *
 * URL que se llama:
 *   https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/{community}/{province}/{city}/
 */

// Verbose por defecto: mostrar request (URL, headers) a Idealista
process.env.DEBUG = '1';

import { getCookiesForDomain } from '../src/utils/cookieJar';
import { fetchIdealistaHtml } from '../src/utils/fetchIdealistaHtml';
import { extractRentEurPerSqm } from '../src/extractors/idealistaReportV1';

function parseArgs(): { communitySlug: string; provinceSlug: string; citySlug: string; precioEsperado: number } | null {
  const args = process.argv.slice(2).filter((a) => a !== '--verbose');

  if (args.length < 4) {
    console.error('❌ Error: Faltan parámetros');
    console.log('\nUso:');
    console.log('  npm run script:test-fetch-report -- <community_slug> <province_slug> <city_slug> <precio_eur_m2>');
    console.log('\nEjemplo:');
    console.log('  npm run script:test-fetch-report -- comunitat-valenciana alicante-alacant denia 12.5');
    console.log('\nParámetros (segmentos de la URL del informe):');
    console.log('  community_slug - ej: comunitat-valenciana');
    console.log('  province_slug  - ej: alicante-alacant');
    console.log('  city_slug      - ej: denia');
    console.log('  precio_eur_m2  - Precio esperado en €/m² (ej: 12.5 o 12,5)');
    return null;
  }

  const [communitySlug, provinceSlug, citySlug, precioStr] = args;
  const precioEsperado = parseFloat(precioStr.replace(',', '.'));

  if (isNaN(precioEsperado) || precioEsperado <= 0) {
    console.error('❌ Error: El precio debe ser un número positivo (ej: 12.5)');
    return null;
  }

  return {
    communitySlug: communitySlug.trim(),
    provinceSlug: provinceSlug.trim(),
    citySlug: citySlug.trim(),
    precioEsperado,
  };
}

function buildReportUrl(communitySlug: string, provinceSlug: string, citySlug: string): string {
  return `https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/${communitySlug}/${provinceSlug}/${citySlug}/`;
}

async function main() {
  const params = parseArgs();
  if (!params) {
    process.exit(1);
  }

  const { communitySlug, provinceSlug, citySlug, precioEsperado } = params;
  const reportUrl = buildReportUrl(communitySlug, provinceSlug, citySlug);

  console.log('\n🧪 Testing Fetch Report Idealista (precio €/m²)');
  console.log('═'.repeat(60));
  console.log('\n📋 Parámetros:');
  console.log(`   Community: ${communitySlug}`);
  console.log(`   Province:  ${provinceSlug}`);
  console.log(`   City:      ${citySlug}`);
  console.log(`   Precio esperado: ${precioEsperado} €/m²`);
  console.log(`\n🔗 URL: ${reportUrl}`);
  console.log('\n🔄 Haciendo fetch...');
  const startTime = Date.now();

  try {
    const domain = 'www.idealista.com';
    const cookies = await getCookiesForDomain(domain);
    const html = await fetchIdealistaHtml(reportUrl, cookies);
    const duration = Date.now() - startTime;

    const precioObtenido = extractRentEurPerSqm(html);

    if (precioObtenido == null) {
      console.log(`\n⚠️  No se pudo extraer el precio €/m² del HTML (${duration}ms)`);
      console.log('\n' + '═'.repeat(60));
      console.log('RESULTADO: No se encontró precio en el informe');
      console.log('═'.repeat(60));
      process.exit(1);
    }

    const coincide = Math.abs(precioObtenido - precioEsperado) < 0.01;
    console.log(`\n💰 Precio obtenido: ${precioObtenido} €/m² (${duration}ms)`);
    console.log(`   Esperado: ${precioEsperado} €/m²`);

    console.log('\n' + '═'.repeat(60));
    if (coincide) {
      console.log('RESULTADO: OK (precio coincide)');
    } else {
      console.log(`RESULTADO: FALLO (esperado ${precioEsperado}, obtenido ${precioObtenido} €/m²)`);
    }
    console.log('═'.repeat(60));
    process.exit(coincide ? 0 : 1);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const is403 = msg.includes('403');
    console.error('\n❌ Error durante el fetch:', msg);
    console.log('\n' + '═'.repeat(60));
    console.log(is403 ? 'RESULTADO: 403 Forbidden (informe no accesible)' : `RESULTADO: Error (${msg})`);
    console.log('═'.repeat(60));
    process.exit(1);
  }
}

main();
