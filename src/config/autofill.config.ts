/**
 * Configuración del autofill (extracción + opcional LLM).
 *
 * Variables de entorno:
 * - AUTOFILL_FORCE_SOURCE  Si es "idealista", nunca se llama al LLM y siempre se devuelve
 *                          source "idealista:v1" (solo extracción HTML). Útil en test para no consumir tokens.
 *                          En prod no definir o dejar vacío para usar IA cuando esté disponible.
 */

export type AutofillForceSource = 'idealista' | undefined;

export function getAutofillForceSource(): AutofillForceSource {
  const v = process.env.AUTOFILL_FORCE_SOURCE?.trim().toLowerCase();
  if (v === 'idealista') return 'idealista';
  return undefined;
}
