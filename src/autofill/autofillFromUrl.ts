import { extractIdealistaV1, type IdealistaAutofill } from '../extractors/idealistaV1';
import { getCookiesForDomain } from '../utils/cookieJar';
import { fetchIdealistaHtml } from '../utils/fetchIdealistaHtml';
import { getCached, setCached } from '../services/autofillCache';
import { rateLimit } from '../services/rateLimiter';
import { lookupRentMarket } from '../services/rentMarketLookup';
import { obtenerCiudadInfo } from '../data/territorioEspanol';

function emptyAutofill(source: IdealistaAutofill['source']): IdealistaAutofill & { estimatedRent?: number | null } {
  return {
    buyPrice: null,
    sqm: null,
    rooms: null,
    banos: null,
    ciudad: null,
    codigoComunidadAutonoma: null,
    source,
    estimatedRent: null,
  };
}

/**
 * Autofill por URL (Idealista).
 *
 * - Aplica cache global en memoria (por URL exacta).
 * - Aplica rate limit global (una vez por request lógico).
 * - Si no se puede extraer, devuelve nulls (best-effort).
 */
export async function autofillFromUrl(url: string, cookieHeader?: string): Promise<IdealistaAutofill & { estimatedRent?: number | null }> {
  const urlStr = url.trim();
  if (!urlStr) return emptyAutofill('idealista:v1');

  try {
    const cached = getCached<IdealistaAutofill>(urlStr);
    if (cached) {
      console.info(`[autofill] Cache hit para ${urlStr}`);
      return cached;
    }

    // Solo soportamos Idealista en v1 por ahora
    if (!urlStr.includes('idealista.com')) {
      return emptyAutofill('idealista:v1');
    }

    // Rate limit: una vez por request "lógico"
    await rateLimit();

    const urlObj = new URL(urlStr);

    let cookies = cookieHeader;
    if (!cookies) {
      cookies = await getCookiesForDomain(urlObj.hostname);
    }

    const html = await fetchIdealistaHtml(urlStr, cookies);
    const result = extractIdealistaV1(html);

    // Lookup alquiler de mercado (si tenemos ciudad, m² y comunidad/provincia)
    let estimatedRent: number | null = null;
    if (
      result.ciudad &&
      result.sqm != null &&
      result.sqm > 0 &&
      result.codigoComunidadAutonoma != null
    ) {
      // Obtener info de ciudad para tener cpro
      const ciudadInfo = obtenerCiudadInfo(result.ciudad);
      
      if (ciudadInfo) {
        const rentEurPerSqm = await lookupRentMarket(
          result.ciudad,
          result.codigoComunidadAutonoma,
          ciudadInfo.cpro
        );
        
        if (rentEurPerSqm != null && rentEurPerSqm > 0) {
          estimatedRent = Math.round(result.sqm * rentEurPerSqm);
        }
      }
    }

    const enriched = { ...result, estimatedRent };

    setCached(urlStr, enriched);
    console.log('[autofill]', {
      url: urlStr,
      buyPrice: result.buyPrice != null,
      sqm: result.sqm != null,
      rooms: result.rooms != null,
      banos: result.banos != null,
      ciudad: result.ciudad != null,
      codigoComunidadAutonoma: result.codigoComunidadAutonoma != null,
      estimatedRent: estimatedRent != null,
    });

    return enriched;
  } catch (error) {
    console.warn(
      `[autofill] Error autofillFromUrl (${urlStr}):`,
      error instanceof Error ? error.message : error
    );
    return emptyAutofill('idealista:v1');
  }
}

