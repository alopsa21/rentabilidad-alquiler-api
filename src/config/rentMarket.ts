/**
 * Configuración del "rent market lookup" (informe Idealista → €/m² por ciudad).
 *
 * Persistencia:
 * - JSON en disco (simple) + cache en memoria
 *
 * Variables de entorno:
 * - RENT_MARKET_TTL_MS: TTL del dato de mercado (default 30 días)
 * - RENT_MARKET_STORE_PATH: ruta del JSON en disco (default: ./data/rent_market.json)
 */

export const RENT_MARKET_TTL_MS =
  typeof process.env.RENT_MARKET_TTL_MS !== 'undefined'
    ? Number(process.env.RENT_MARKET_TTL_MS)
    : 30 * 24 * 60 * 60 * 1000;

export const RENT_MARKET_STORE_PATH =
  typeof process.env.RENT_MARKET_STORE_PATH !== 'undefined'
    ? String(process.env.RENT_MARKET_STORE_PATH)
    : './data/rent_market.json';

