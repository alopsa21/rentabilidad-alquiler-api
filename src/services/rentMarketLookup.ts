/**
 * Servicio de lookup de rent market (precio de alquiler por m²).
 * 
 * Flujo:
 * 1. Buscar en cache (rent_market.json + memoria)
 * 2. Si no existe o está caducado → fetch informe Idealista
 * 3. Extraer €/m² del HTML
 * 4. Guardar en cache
 * 5. Devolver precio
 */

import { getCookiesForDomain } from '../utils/cookieJar';
import { fetchIdealistaHtml } from '../utils/fetchIdealistaHtml';
import { rateLimit } from './rateLimiter';
import { getRentMarket, setRentMarket, type RentMarketEntry } from './rentMarketStore';
import { extractRentEurPerSqm } from '../extractors/idealistaReportV1';
import { getCommunitySlug, getProvinceSlug, getCitySlug } from '../utils/slugify';
import { obtenerNombreComunidad, obtenerNombreProvincia } from '../data/territorioEspanol';

/**
 * Construye URL del informe de alquiler de Idealista.
 * 
 * Formato: /sala-de-prensa/informes-precio-vivienda/alquiler/{community}/{province}/{city}/
 * Ejemplo: /sala-de-prensa/informes-precio-vivienda/alquiler/andalucia/almeria-provincia/alcolea/
 */
function buildIdealistaReportUrl(
  communitySlug: string,
  provinceSlug: string,
  citySlug: string
): string {
  return `https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/${communitySlug}/${provinceSlug}/${citySlug}/`;
}

/**
 * Lookup de rent market para una ciudad.
 * 
 * @param city - Nombre de la ciudad
 * @param codauto - Código de comunidad autónoma (CODAUTO 1-19)
 * @param cpro - Código de provincia (CPRO)
 * @returns Precio en €/m² o null si no se puede obtener
 */
export async function lookupRentMarket(
  city: string,
  codauto: number | null,
  cpro: number | null
): Promise<number | null> {
  if (!city || !codauto || !cpro) {
    return null;
  }

  // Obtener nombres de comunidad y provincia
  const nombreComunidad = obtenerNombreComunidad(codauto);
  const nombreProvincia = obtenerNombreProvincia(cpro);

  if (!nombreComunidad || !nombreProvincia) {
    console.warn(`[rentMarketLookup] No se encontraron nombres para codauto=${codauto}, cpro=${cpro}`);
    return null;
  }

  // 1. Buscar en cache
  const cached = getRentMarket(city, nombreProvincia);
  if (cached) {
    console.log('[rent-market]', {
      city,
      cached: true,
      rentEurPerSqm: cached.rentEurPerSqm,
    });
    return cached.rentEurPerSqm;
  }

  // 2. Rate limit antes de fetch externo
  await rateLimit();

  // 3. Cookies (mismo flujo que autofillFromUrl: cacheadas o bootstrap)
  const domain = 'www.idealista.com';
  const cookies = await getCookiesForDomain(domain);

  // 4. Construir URL del informe
  const communitySlug = getCommunitySlug(codauto, nombreComunidad);
  const provinceSlug = getProvinceSlug(cpro, nombreProvincia);
  const citySlug = getCitySlug(city);
  const reportUrl = buildIdealistaReportUrl(communitySlug, provinceSlug, citySlug);

  console.info(`[rentMarketLookup] Fetching informe: ${reportUrl}`);

  try {
    // 5. Fetch HTML con la misma util que autofillFromUrl (mismas cookies y headers)
    const html = await fetchIdealistaHtml(reportUrl, cookies);

    // 6. Extraer €/m²
    const rentEurPerSqm = extractRentEurPerSqm(html);

    if (!rentEurPerSqm) {
      console.warn(`[rentMarketLookup] No se pudo extraer €/m² de ${reportUrl}`);
      return null;
    }

    // 7. Guardar en cache
    const entry: RentMarketEntry = {
      city,
      province: nombreProvincia,
      community: nombreComunidad,
      rentEurPerSqm,
      source: 'idealista-report:v1',
      fetchedAt: Date.now(),
    };

    await setRentMarket(entry);

    console.log('[rent-market]', {
      city,
      cached: false,
      rentEurPerSqm,
    });

    return rentEurPerSqm;
  } catch (err) {
    console.warn(
      `[rentMarketLookup] Error fetching informe (${reportUrl}):`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
