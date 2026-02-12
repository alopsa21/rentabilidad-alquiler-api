import type { IdealistaAutofill } from '../extractors/idealistaV1';
import { AUTOFILL_CACHE_TTL_MS } from '../config/autofill';

type CacheEntry<T> = {
  value: T;
  ts: number;
};

const cache = new Map<string, CacheEntry<IdealistaAutofill>>();

/**
 * Obtiene un valor del cache si existe y no ha expirado.
 * 
 * @param key - URL del anuncio
 * @returns Valor cacheado o null si no existe o ha expirado
 */
export function getCached<T = IdealistaAutofill>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.ts > AUTOFILL_CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

/**
 * Guarda un valor en el cache.
 * 
 * @param key - URL del anuncio
 * @param value - Resultado del autofill extraído
 */
export function setCached<T = IdealistaAutofill>(key: string, value: T): void {
  cache.set(key, { value: value as IdealistaAutofill, ts: Date.now() });
}
