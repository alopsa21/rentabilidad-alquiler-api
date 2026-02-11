import type { IdealistaAutofill } from '../extractors/idealistaV1';
import { extractIdealistaV1 } from '../extractors/idealistaV1';
import { getCookiesForDomain } from '../utils/cookieJar';

/**
 * Headers tipo navegador (como los de un curl real) para que Idealista devuelva HTML completo.
 * Incluye Referer y sec-* para parecer una navegación same-origin.
 */
function getBrowserLikeHeaders(url: string, cookieHeader?: string): Record<string, string> {
  const isIdealista = url.includes('idealista.com');
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Ch-Ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Linux"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': isIdealista ? 'same-origin' : 'none',
    'Sec-Fetch-User': '?1',
    'Priority': 'u=0, i',
  };
  if (isIdealista) {
    headers['Referer'] = 'https://www.idealista.com/';
  }
  if (cookieHeader && cookieHeader.trim()) {
    headers['Cookie'] = cookieHeader.trim();
  }
  return headers;
}

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Obtiene el HTML de una URL con timeout.
 * 
 * @param url - URL del anuncio
 * @param cookieHeader - Opcional: cabecera Cookie (ej. copiada del navegador) para Idealista
 * @returns HTML como string
 * @throws Error si no se puede obtener el HTML
 */
async function fetchHtml(url: string, cookieHeader?: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: getBrowserLikeHeaders(url, cookieHeader),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await response.text();

    // Log para diagnosticar cuando Idealista bloquea o devuelve captcha
    const len = html.length;
    if (!response.ok) {
      console.warn(`[autofill] Fetch ${url}: ${response.status} ${response.statusText}, body length=${len}`);
      throw new Error(`Error al obtener HTML: ${response.status} ${response.statusText}`);
    }
    if (len < 5000) {
      console.warn(`[autofill] Fetch ${url}: body muy corto (${len} chars), posible captcha o bloqueo. Primeros 200 chars:`, html.slice(0, 200));
    } else {
      console.info(`[autofill] Fetch ${url}: OK, ${len} chars`);
    }

    return html;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      console.warn(`[autofill] Fetch ${url} falló:`, err.message);
    }
    throw err;
  }
}

/**
 * Detecta el dominio de la URL y delega al extractor correspondiente.
 * 
 * @param url - URL del anuncio inmobiliario
 * @param cookieHeader - Opcional: cabecera Cookie para Idealista (si el usuario la pasa desde el frontend)
 * @returns Datos extraídos o nulls si no se puede extraer
 */
export async function autofillFromUrl(url: string, cookieHeader?: string): Promise<IdealistaAutofill> {
  try {
    // Validar que sea una URL válida
    const urlObj = new URL(url);

    // Bootstrap de cookies si es Idealista y no se pasaron cookies desde el frontend
    let cookies = cookieHeader;
    if (url.includes('idealista.com') && !cookies) {
      const domain = urlObj.hostname;
      cookies = await getCookiesForDomain(domain);
    }

    // Obtener HTML (con cookies: las del frontend, o las del bootstrap, o ninguna)
    const html = await fetchHtml(url, cookies);

    // Detectar dominio y delegar al extractor correspondiente
    if (url.includes('idealista.com')) {
      return extractIdealistaV1(html);
    }

    // Si no es un dominio conocido, devolver objeto vacío
    return {
      buyPrice: null,
      sqm: null,
      rooms: null,
      banos: null,
      ciudad: null,
      codigoComunidadAutonoma: null,
      source: "idealista:v1"
    };
  } catch (error) {
    // En caso de error (red, timeout, 403, etc.), devolver nulls
    if (error instanceof Error) {
      console.warn('[autofill] autofillFromUrl error:', error.message);
    }
    return {
      buyPrice: null,
      sqm: null,
      rooms: null,
      banos: null,
      ciudad: null,
      codigoComunidadAutonoma: null,
      source: "idealista:v1"
    };
  }
}
