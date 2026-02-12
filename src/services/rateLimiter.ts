import { AUTOFILL_RATE_LIMIT_MS } from '../config/autofill';

let lastRun = 0;

/**
 * Rate limiter global: asegura un mínimo de AUTOFILL_RATE_LIMIT_MS entre requests externos a Idealista.
 * Uso: llamar antes de cada fetch externo (cookie bootstrap y fetch del anuncio).
 */
export async function rateLimit(): Promise<void> {
  const now = Date.now();
  const delta = now - lastRun;

  if (delta < AUTOFILL_RATE_LIMIT_MS) {
    const waitTime = AUTOFILL_RATE_LIMIT_MS - delta;
    console.info(`[rateLimit] Esperando ${Math.round(waitTime)}ms (mín ${AUTOFILL_RATE_LIMIT_MS / 1000}s entre requests)`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRun = Date.now();
}
