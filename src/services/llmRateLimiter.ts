/**
 * Límite de llamadas al LLM para evitar abuso y controlar coste.
 * Ventana deslizante: se cuentan las llamadas en los últimos 1 min y 1 h.
 */

import { LLM_CONFIG } from '../config/llm.config';

const timestamps: number[] = [];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

function prune() {
  const now = Date.now();
  while (timestamps.length > 0 && now - timestamps[0]! > HOUR_MS) {
    timestamps.shift();
  }
}

/**
 * Devuelve true si se puede hacer una llamada más (dentro de límites por minuto y por hora).
 */
export function canCallLlm(): boolean {
  const { maxCallsPerMinute, maxCallsPerHour } = LLM_CONFIG;
  if (maxCallsPerMinute === 0 && maxCallsPerHour === 0) return true;

  prune();
  const now = Date.now();

  const inLastMinute = timestamps.filter((t) => now - t < MINUTE_MS).length;
  const inLastHour = timestamps.length;

  if (maxCallsPerMinute > 0 && inLastMinute >= maxCallsPerMinute) return false;
  if (maxCallsPerHour > 0 && inLastHour >= maxCallsPerHour) return false;
  return true;
}

/**
 * Registra una llamada al LLM. Llamar después de haber comprobado canCallLlm() y antes/inicio de la llamada real.
 */
export function recordLlmCall(): void {
  timestamps.push(Date.now());
  prune();
}
