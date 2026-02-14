import { getCookiesForDomain } from '../utils/cookieJar';
import { rateLimit } from '../services/rateLimiter';
import {
  obtenerCiudadInfo,
  obtenerNombreComunidad,
  obtenerNombreProvincia,
  normalizar,
} from '../data/territorioEspanol';
import { extractIdealistaRentEurPerSqmV1 } from './extractIdealistaRentReportV1';
import { citySlugCandidates, provinceSlugCandidates, slugify } from './slug';
import { buildRentMarketKey, getRentMarket, setRentMarket, type RentMarketEntry } from './rentMarketStore';

const IDEALISTA_DOMAIN = 'www.idealista.com';

const COMMUNITY_SLUG_BY_CODAUTO: Partial<Record<number, string>> = {
  3: 'asturias',
  4: 'baleares',
  10: 'comunitat-valenciana',
  13: 'madrid-comunidad',
  14: 'murcia-region',
  15: 'navarra',
  17: 'la-rioja',
};

function communitySlug(codauto: number): string | null {
  const forced = COMMUNITY_SLUG_BY_CODAUTO[codauto];
  if (forced) return forced;
  const name = obtenerNombreComunidad(codauto);
  if (!name) return null;
  return slugify(name);
}

async function fetchHtml(urlPath: string, cookieHeader: string | undefined): Promise<string> {
  const url = `https://${IDEALISTA_DOMAIN}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function lookupRentEurPerSqmByCity(
  ciudad: string
): Promise<{ cached: boolean; rentEurPerSqm: number | null }> {
  // Resolver ciudad → (codauto, cpro, nombre canónico)
  const ciudadInfo = obtenerCiudadInfo(ciudad);
  if (!ciudadInfo) {
    console.log('rent-market', { city: ciudad, cached: false, rentEurPerSqm: null });
    return { cached: false, rentEurPerSqm: null };
  }

  const codauto = ciudadInfo.codauto;
  const cpro = ciudadInfo.cpro;
  const city = ciudadInfo.nombre;
  const cityNorm = normalizar(city);

  const key = buildRentMarketKey({ codauto, cpro, cityNorm });
  const cachedRes = getRentMarket(key);
  if (cachedRes.entry) {
    console.log('rent-market', { city, cached: true, rentEurPerSqm: cachedRes.entry.rentEurPerSqm });
    return { cached: true, rentEurPerSqm: cachedRes.entry.rentEurPerSqm };
  }

  const community = communitySlug(codauto);
  const provName = obtenerNombreProvincia(cpro);
  if (!community || !provName) {
    console.log('rent-market', { city, cached: false, rentEurPerSqm: null });
    return { cached: false, rentEurPerSqm: null };
  }

  const provinceCandidates = provinceSlugCandidates(provName);
  const cityCandidates = citySlugCandidates(city);

  // Bootstrap cookies (cacheadas en cookieJar)
  // Nota: rateLimit global antes de llamar a Idealista
  await rateLimit();
  const cookies = await getCookiesForDomain(IDEALISTA_DOMAIN);

  const tried: string[] = [];

  // Limitar intentos para no spamear Idealista
  for (const provinceSlug of provinceCandidates.slice(0, 3)) {
    for (const citySlug of cityCandidates.slice(0, 3)) {
      const path = `/sala-de-prensa/informes-precio-vivienda/alquiler/${community}/${provinceSlug}/${citySlug}/`;
      tried.push(path);
      try {
        // Si hay reintentos, respetar rateLimit entre requests externos
        if (tried.length > 1) {
          await rateLimit();
        }
        const html = await fetchHtml(path, cookies || undefined);
        const rentEurPerSqm = extractIdealistaRentEurPerSqmV1(html);
        if (rentEurPerSqm == null) {
          continue;
        }

        const entry: RentMarketEntry = {
          key,
          codauto,
          cpro,
          city,
          cityNorm,
          communitySlug: community,
          provinceSlug,
          citySlug,
          rentEurPerSqm,
          fetchedAt: Date.now(),
          source: 'idealista-report:v1',
        };

        await setRentMarket(entry);
        console.log('rent-market', { city, cached: false, rentEurPerSqm });
        return { cached: false, rentEurPerSqm };
      } catch {
        // Intentar siguiente combinación
      }
    }
  }

  console.log('rent-market', { city, cached: false, rentEurPerSqm: null });
  return { cached: false, rentEurPerSqm: null };
}

