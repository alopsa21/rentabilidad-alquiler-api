/**
 * Store de rent market (precio de alquiler por m² por ciudad).
 * 
 * Implementación: JSON en disco + cache en memoria + TTL 30 días.
 * 
 * Patrón:
 * - Carga JSON al arrancar → memoria
 * - Lecturas: solo memoria (rápido)
 * - Escrituras: memoria + disco (async, no bloquea)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RENT_MARKET_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const RENT_MARKET_FILE = path.join(__dirname, '..', '..', 'data', 'rent_market.json');

export interface RentMarketEntry {
  city: string;
  province?: string;
  community?: string;
  rentEurPerSqm: number;
  source: 'idealista-report:v1';
  fetchedAt: number; // timestamp
}

// Cache en memoria
const cache = new Map<string, RentMarketEntry>();

/**
 * Genera clave única para una entrada (city + province si existe).
 */
function makeKey(city: string, province?: string): string {
  return province ? `${city}::${province}` : city;
}

/**
 * Carga datos desde JSON al arrancar.
 */
function loadFromDisk(): void {
  try {
    // Crear directorio si no existe
    const dataDir = path.dirname(RENT_MARKET_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(RENT_MARKET_FILE)) {
      console.info('[rentMarketStore] Archivo no existe, empezando con cache vacío');
      return;
    }

    const content = fs.readFileSync(RENT_MARKET_FILE, 'utf-8');
    const data: RentMarketEntry[] = JSON.parse(content);

    for (const entry of data) {
      const key = makeKey(entry.city, entry.province);
      cache.set(key, entry);
    }

    console.info(`[rentMarketStore] Cargados ${cache.size} registros desde disco`);
  } catch (err) {
    console.warn('[rentMarketStore] Error cargando desde disco:', err instanceof Error ? err.message : err);
    // Si hay error, empezar con cache vacío
  }
}

/**
 * Persiste cache a disco (async, no bloquea).
 */
async function persistToDisk(): Promise<void> {
  try {
    const entries = Array.from(cache.values());
    const content = JSON.stringify(entries, null, 2);
    
    // Escribir a archivo temporal primero (atomicidad)
    const tmpFile = `${RENT_MARKET_FILE}.tmp`;
    await fs.promises.writeFile(tmpFile, content, 'utf-8');
    
    // Renombrar (operación atómica en la mayoría de sistemas)
    await fs.promises.rename(tmpFile, RENT_MARKET_FILE);
  } catch (err) {
    console.error('[rentMarketStore] Error escribiendo a disco:', err instanceof Error ? err.message : err);
  }
}

/**
 * Obtiene entrada de rent market para una ciudad.
 * 
 * @param city - Nombre de la ciudad
 * @param province - Nombre de la provincia (opcional)
 * @returns Entrada si existe y está fresca (< 30 días), null si no existe o está caducada
 */
export function getRentMarket(city: string, province?: string): RentMarketEntry | null {
  const key = makeKey(city, province);
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // Verificar TTL
  const age = Date.now() - entry.fetchedAt;
  if (age > RENT_MARKET_TTL_MS) {
    // Caducado: eliminar del cache
    cache.delete(key);
    return null;
  }
  
  return entry;
}

/**
 * Guarda entrada de rent market.
 * 
 * @param entry - Entrada a guardar
 */
export async function setRentMarket(entry: RentMarketEntry): Promise<void> {
  const key = makeKey(entry.city, entry.province);
  cache.set(key, entry);
  
  // Persistir a disco async (no bloquea)
  await persistToDisk();
}

/**
 * Limpia todas las entradas caducadas del cache y disco.
 */
export async function cleanExpired(): Promise<void> {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.fetchedAt > RENT_MARKET_TTL_MS) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    await persistToDisk();
    console.info(`[rentMarketStore] Limpiadas ${cleaned} entradas caducadas`);
  }
}

// Cargar al importar el módulo
loadFromDisk();

// Limpiar entradas caducadas al arrancar
cleanExpired().catch((err) => {
  console.warn('[rentMarketStore] Error limpiando entradas caducadas:', err);
});

// Guardar al cerrar el proceso (graceful shutdown)
process.on('SIGTERM', async () => {
  await persistToDisk();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await persistToDisk();
  process.exit(0);
});
