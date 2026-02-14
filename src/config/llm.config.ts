/**
 * Configuración del LLM (OpenAI) para extracción de datos de inmuebles y estimación de alquiler.
 *
 * MODELOS RECOMENDADOS (febrero 2026):
 * - gpt-4.1-nano: $0.10 input / $0.40 output. ~$0.00006/llamada (~16,700 llamadas/€)
 * - gpt-4o-mini:  $0.15 input / $0.60 output. ~$0.00009/llamada (~11,100 llamadas/€)
 *
 * Variables de entorno:
 * - OPENAI_API_KEY            API key de OpenAI (requerido para llamar al LLM)
 * - LLM_MODEL                 Modelo (default: gpt-4.1-nano)
 * - LLM_MAX_TOKENS            Máximo tokens de respuesta (default: 256)
 * - LLM_TEMPERATURE           Temperatura 0-2 (default: 0.1, más bajo = más determinista)
 * - LLM_TIMEOUT_MS            Timeout en ms (default: 20000)
 * - LLM_MAX_CALLS_PER_MINUTE  Máx. llamadas por minuto. 0 = sin límite (default: 60)
 * - LLM_MAX_CALLS_PER_HOUR    Máx. llamadas por hora. 0 = sin límite (default: 500)
 */

export const LLM_CONFIG = {
  model: process.env.LLM_MODEL || 'gpt-4.1-nano',
  maxTokens: typeof process.env.LLM_MAX_TOKENS !== 'undefined' ? Number(process.env.LLM_MAX_TOKENS) : 256,
  temperature: typeof process.env.LLM_TEMPERATURE !== 'undefined' ? Number(process.env.LLM_TEMPERATURE) : 0.1,
  timeoutMs: typeof process.env.LLM_TIMEOUT_MS !== 'undefined' ? Number(process.env.LLM_TIMEOUT_MS) : 20_000,
  maxCallsPerMinute: typeof process.env.LLM_MAX_CALLS_PER_MINUTE !== 'undefined' ? Number(process.env.LLM_MAX_CALLS_PER_MINUTE) : 60,
  maxCallsPerHour: typeof process.env.LLM_MAX_CALLS_PER_HOUR !== 'undefined' ? Number(process.env.LLM_MAX_CALLS_PER_HOUR) : 500,
};

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}
