import { extractIdealistaV1, type IdealistaAutofill } from '../extractors/idealistaV1';
import { getCookiesForDomain } from '../utils/cookieJar';
import { getCached, setCached } from '../services/autofillCache';
import { rateLimit } from '../services/rateLimiter';

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';

function emptyAutofill(source: IdealistaAutofill['source']): IdealistaAutofill {
  return {
    buyPrice: null,
    sqm: null,
    rooms: null,
    banos: null,
    ciudad: null,
    codigoComunidadAutonoma: null,
    source,
  };
}

async function fetchHtml(url: string, cookieHeader?: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
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

/**
 * Autofill por URL (Idealista).
 *
 * - Aplica cache global en memoria (por URL exacta).
 * - Aplica rate limit global (una vez por request lógico).
 * - Si no se puede extraer, devuelve nulls (best-effort).
 */
export async function autofillFromUrl(url: string, cookieHeader?: string): Promise<IdealistaAutofill> {
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

    const html = await fetchHtml(urlStr, cookies);
    const result = extractIdealistaV1(html);

    setCached(urlStr, result);
    console.log('[autofill]', {
      url: urlStr,
      buyPrice: result.buyPrice != null,
      sqm: result.sqm != null,
      rooms: result.rooms != null,
      banos: result.banos != null,
      ciudad: result.ciudad != null,
      codigoComunidadAutonoma: result.codigoComunidadAutonoma != null,
    });

    return result;
  } catch (error) {
    console.warn(
      `[autofill] Error autofillFromUrl (${urlStr}):`,
      error instanceof Error ? error.message : error
    );
    return emptyAutofill('idealista:v1');
  }
}

