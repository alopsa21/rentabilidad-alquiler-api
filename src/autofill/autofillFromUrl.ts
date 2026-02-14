import { extractIdealistaV1, type IdealistaAutofill } from '../extractors/idealistaV1';
import { getCookiesForDomain } from '../utils/cookieJar';
import { getCached, setCached } from '../services/autofillCache';
import { rateLimit } from '../services/rateLimiter';
import { fetchLlmPropertyExtract } from '../services/llmPropertyExtract';
import { getAutofillForceSource } from '../config/autofill.config';
import { estimateRentFromCsv } from '../services/estimateRentFromCsv';

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
    featuresText: null,
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

    // Si AUTOFILL_FORCE_SOURCE=idealista, no llamar al LLM (test: no consumir tokens)
    // Pero intentamos estimar alquiler desde CSV si tenemos ciudad y m²
    if (getAutofillForceSource() === 'idealista') {
      const estimatedRent = await estimateRentFromCsv(result.ciudad ?? '', result.sqm);
      const resultWithRent: IdealistaAutofill = {
        ...result,
        estimatedRent: estimatedRent,
        alquilerMensual: estimatedRent,
      };
      setCached(urlStr, resultWithRent);
      console.log('[autofill]', {
        url: urlStr,
        source: 'idealista:v1',
        forced: true,
        buyPrice: resultWithRent.buyPrice != null,
        sqm: resultWithRent.sqm != null,
        rooms: resultWithRent.rooms != null,
        banos: resultWithRent.banos != null,
        ciudad: resultWithRent.ciudad != null,
        codigoComunidadAutonoma: resultWithRent.codigoComunidadAutonoma != null,
        estimatedRent: resultWithRent.estimatedRent,
      });
      return resultWithRent;
    }

    // Si tenemos ciudad, precio y featuresText, llamar al LLM; OpenAI sobreescribe/completa
    const city = result.ciudad?.trim();
    const purchasePrice = result.buyPrice;
    const featuresText = result.featuresText?.trim();
    if (city && purchasePrice != null && purchasePrice > 0 && featuresText) {
      const llmResult = await fetchLlmPropertyExtract({
        city,
        purchasePrice,
        featuresText,
      });
      if (llmResult) {
        // +10%: modelo usa datos ~2024; precios de alquiler han subido al menos 10%
        const estimatedRent = Math.round(llmResult.maxRent * 1.1);
        const merged: IdealistaAutofill = {
          ...result,
          sqm: llmResult.sqm ?? result.sqm,
          rooms: llmResult.rooms ?? result.rooms,
          banos: llmResult.bathrooms ?? result.banos,
          estimatedRent,
          alquilerMensual: estimatedRent,
          source: 'openai:v2',
        };
        setCached(urlStr, merged);
        console.log('[autofill]', {
          url: urlStr,
          source: 'openai:v2',
          buyPrice: merged.buyPrice != null,
          sqm: merged.sqm != null,
          rooms: merged.rooms != null,
          banos: merged.banos != null,
          ciudad: merged.ciudad != null,
          codigoComunidadAutonoma: merged.codigoComunidadAutonoma != null,
          estimatedRent: merged.estimatedRent,
        });
        return merged;
      }
    }

    // Si llegamos aquí, es porque no se llamó al LLM (falta ciudad, precio o featuresText)
    // Intentamos estimar alquiler desde CSV como fallback
    const estimatedRent = await estimateRentFromCsv(result.ciudad ?? '', result.sqm);
    const resultWithRent: IdealistaAutofill = {
      ...result,
      estimatedRent: estimatedRent,
      alquilerMensual: estimatedRent,
    };
    setCached(urlStr, resultWithRent);
    console.log('[autofill]', {
      url: urlStr,
      source: 'idealista:v1',
      buyPrice: resultWithRent.buyPrice != null,
      sqm: resultWithRent.sqm != null,
      rooms: resultWithRent.rooms != null,
      banos: resultWithRent.banos != null,
      ciudad: resultWithRent.ciudad != null,
      codigoComunidadAutonoma: resultWithRent.codigoComunidadAutonoma != null,
      estimatedRent: resultWithRent.estimatedRent,
    });

    return resultWithRent;
  } catch (error) {
    console.warn(
      `[autofill] Error autofillFromUrl (${urlStr}):`,
      error instanceof Error ? error.message : error
    );
    return emptyAutofill('idealista:v1');
  }
}

