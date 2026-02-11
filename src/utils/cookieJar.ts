/**
 * Cookie jar simple para mantener cookies entre peticiones.
 * Usado para bootstrap: GET homepage → guardar Set-Cookie → usar en requests siguientes.
 */

interface CookieEntry {
  cookies: string;
  timestamp: number;
}

// Cache en memoria: domain → cookies
const cookieCache = new Map<string, CookieEntry>();

// TTL: 30 minutos (las cookies de sesión suelen durar más, pero por seguridad renovamos)
const COOKIE_TTL_MS = 30 * 60 * 1000;

/**
 * Parsea los headers Set-Cookie de una Response y devuelve un string Cookie para usar en requests.
 */
function parseSetCookieHeaders(response: Response): string {
  const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
  if (setCookieHeaders.length === 0) return '';

  // Extraer nombre=valor de cada Set-Cookie (ignorar path, domain, expires, etc.)
  const cookies: string[] = [];
  for (const header of setCookieHeaders) {
    const match = header.match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies.push(`${match[1]}=${match[2]}`);
    }
  }

  return cookies.join('; ');
}

/**
 * Obtiene cookies para un dominio. Si no hay o expiraron, hace GET a la homepage para obtenerlas.
 * @param domain - Dominio (ej: 'www.idealista.com')
 * @returns String de cookies para usar en header Cookie, o '' si falla
 */
export async function getCookiesForDomain(domain: string): Promise<string> {
  const now = Date.now();
  const cached = cookieCache.get(domain);

  // Si hay cache válido, devolver
  if (cached && now - cached.timestamp < COOKIE_TTL_MS) {
    console.info(`[cookieJar] Usando cookies cacheadas para ${domain}`);
    return cached.cookies;
  }

  // Bootstrap: hacer GET a la homepage para obtener cookies iniciales
  console.info(`[cookieJar] Bootstrap: GET https://${domain}/ para obtener cookies`);
  try {
    const response = await fetch(`https://${domain}/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.warn(`[cookieJar] Bootstrap falló: ${response.status} ${response.statusText}`);
      return '';
    }

    const cookies = parseSetCookieHeaders(response);
    if (cookies) {
      console.info(`[cookieJar] Guardadas ${cookies.split(';').length} cookies para ${domain}`);
      cookieCache.set(domain, { cookies, timestamp: now });
      return cookies;
    }

    console.warn(`[cookieJar] No se obtuvieron cookies en la respuesta`);
    return '';
  } catch (err) {
    console.warn(`[cookieJar] Error en bootstrap:`, err instanceof Error ? err.message : err);
    return '';
  }
}

/**
 * Limpia las cookies cacheadas de un dominio (útil si detectamos que expiraron).
 */
export function clearCookiesForDomain(domain: string): void {
  cookieCache.delete(domain);
  console.info(`[cookieJar] Cookies limpiadas para ${domain}`);
}
