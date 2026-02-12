/**
 * Configuración de autofill (cache + rate limit) para proteger requests a Idealista.
 *
 * Variables de entorno:
 * - AUTOFILL_CACHE_TTL_MS   TTL del cache en milisegundos (default: 3600000 = 1h)
 * - AUTOFILL_RATE_LIMIT_MS  Mínimo ms entre dos requests externos a Idealista (default: 2000 = 2s)
 *
 * Ejemplo para ser más conservador con Idealista:
 *   AUTOFILL_RATE_LIMIT_MS=5000 AUTOFILL_CACHE_TTL_MS=7200000 npm run dev
 */

/** TTL del cache en ms. Por defecto 1 hora. */
export const AUTOFILL_CACHE_TTL_MS =
  typeof process.env.AUTOFILL_CACHE_TTL_MS !== 'undefined'
    ? Number(process.env.AUTOFILL_CACHE_TTL_MS)
    : 60 * 60 * 1000;

/** Mínimo ms entre dos requests externos a Idealista. Por defecto 2 segundos. */
export const AUTOFILL_RATE_LIMIT_MS =
  typeof process.env.AUTOFILL_RATE_LIMIT_MS !== 'undefined'
    ? Number(process.env.AUTOFILL_RATE_LIMIT_MS)
    : 2000;
