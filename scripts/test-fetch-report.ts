#!/usr/bin/env tsx
/**
 * Script para probar el fetch del HTML del informe de Idealista.
 * 
 * Uso:
 *   npm run script:test-fetch-report -- <ciudad> <codauto> <cpro>
 * 
 * Ejemplo:
 *   npm run script:test-fetch-report -- Dénia 10 3
 */

import { getCookiesForDomain } from '../src/utils/cookieJar';
import { fetchIdealistaHtml } from '../src/utils/fetchIdealistaHtml';
import { getCommunitySlug, getProvinceSlug, getCitySlug } from '../src/utils/slugify';
import { obtenerNombreComunidad, obtenerNombreProvincia } from '../src/data/territorioEspanol';
// Los datos de territorio se cargan automáticamente al importar el módulo
import '../src/data/territorioEspanol';

function parseArgs(): { city: string; codauto: number; cpro: number } | null {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ Error: Faltan parámetros');
    console.log('\nUso:');
    console.log('  npm run script:test-fetch-report -- <ciudad> <codauto> <cpro>');
    console.log('\nEjemplo:');
    console.log('  npm run script:test-fetch-report -- Dénia 10 3');
    console.log('\nParámetros:');
    console.log('  ciudad  - Nombre de la ciudad (ej: Dénia)');
    console.log('  codauto - Código de comunidad autónoma (ej: 10 = Comunitat Valenciana)');
    console.log('  cpro    - Código de provincia (ej: 3 = Alicante)');
    return null;
  }

  const [city, codautoStr, cproStr] = args;

  return {
    city: city.trim(),
    codauto: parseInt(codautoStr, 10),
    cpro: parseInt(cproStr, 10),
  };
}

function buildIdealistaReportUrl(
  communitySlug: string,
  provinceSlug: string,
  citySlug: string
): string {
  return `https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/${communitySlug}/${provinceSlug}/${citySlug}/`;
}

async function main() {
  const params = parseArgs();
  if (!params) {
    process.exit(1);
  }

  const { city, codauto, cpro } = params;

  console.log('\n🧪 Testing Fetch Report Idealista');
  console.log('═'.repeat(60));
  console.log(`\n📋 Parámetros:`);
  console.log(`   Ciudad: ${city}`);
  console.log(`   Código Comunidad: ${codauto}`);
  console.log(`   Código Provincia: ${cpro}`);

  // Obtener nombres
  const nombreComunidad = obtenerNombreComunidad(codauto);
  const nombreProvincia = obtenerNombreProvincia(cpro);

  if (!nombreComunidad || !nombreProvincia) {
    console.error(`\n❌ No se encontraron nombres para codauto=${codauto}, cpro=${cpro}`);
    process.exit(1);
  }

  console.log(`   Comunidad: ${nombreComunidad}`);
  console.log(`   Provincia: ${nombreProvincia}`);

  // Construir slugs
  const communitySlug = getCommunitySlug(codauto, nombreComunidad);
  const provinceSlug = getProvinceSlug(cpro, nombreProvincia);
  const citySlug = getCitySlug(city);
  const reportUrl = buildIdealistaReportUrl(communitySlug, provinceSlug, citySlug);

  console.log(`\n🔗 URL del informe:`);
  console.log(`   ${reportUrl}`);

  console.log(`\n🔄 Haciendo fetch del HTML...`);
  const startTime = Date.now();

  try {
    // Mismo flujo que autofillFromUrl: cookies (cacheadas o bootstrap) + fetch unificado
    const domain = 'www.idealista.com';
    const cookies = await getCookiesForDomain(domain);

    // Fetch HTML del informe con la misma util que autofill (mismas cookies y headers)
    const html = await fetchIdealistaHtml(reportUrl, cookies);
    const duration = Date.now() - startTime;

    console.log(`\n✅ HTML obtenido exitosamente (${duration}ms)`);
    console.log(`\n📊 Estadísticas:`);
    console.log(`   Tamaño HTML: ${html.length} caracteres`);
    console.log(`   Líneas: ${html.split('\n').length}`);

    // Buscar si contiene el patrón de precio
    const precioMatch = html.match(/<strong>\s*([\d,]+)\s*€\/m2\s*<\/strong>/i);
    if (precioMatch) {
      const precio = parseFloat(precioMatch[1].replace(',', '.'));
      console.log(`\n💰 Precio encontrado: ${precio} €/m²`);
    } else {
      console.log(`\n⚠️  No se encontró el patrón de precio en el HTML`);
      console.log(`\n🔍 Buscando variaciones del patrón...`);
      
      // Buscar otras variaciones
      const variaciones = [
        /€\/m2/i,
        /€\/m²/i,
        /precio.*alquiler/i,
        /alquiler.*m2/i,
      ];
      
      for (const regex of variaciones) {
        if (regex.test(html)) {
          console.log(`   ✓ Encontrado: ${regex.source}`);
        }
      }
    }

    // Guardar HTML en archivo para inspección (opcional)
    const fs = await import('fs');
    const path = await import('path');
    const outputFile = path.join(process.cwd(), 'test-report-output.html');
    fs.writeFileSync(outputFile, html, 'utf-8');
    console.log(`\n💾 HTML guardado en: ${outputFile}`);

  } catch (error) {
    console.error('\n❌ Error durante el fetch:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
