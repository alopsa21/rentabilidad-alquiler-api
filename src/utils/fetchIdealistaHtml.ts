/**
 * Fetch HTML de Idealista con headers y cookies unificados.
 * Usado por autofillFromUrl (página de anuncio) y rentMarketLookup (informe de alquiler).
 * Las cookies se obtienen con getCookiesForDomain() (pueden estar cacheadas).
 */

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';

/**
 * Hace GET a una URL de idealista.com con los mismos headers que el autofill.
 * Debe usarse siempre con las cookies de getCookiesForDomain('www.idealista.com').
 *
 * @param url - URL completa (anuncio o informe)
 * @param cookieHeader - Cookies obtenidas de getCookiesForDomain (o cacheadas)
 */
export async function fetchIdealistaHtml(url: string, cookieHeader?: string): Promise<string> {
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
        Referer: 'https://www.idealista.com/',
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
