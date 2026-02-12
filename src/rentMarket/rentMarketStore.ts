import fs from 'fs';
import path from 'path';
import { RENT_MARKET_STORE_PATH, RENT_MARKET_TTL_MS } from '../config/rentMarket';

export type RentMarketEntry = {
  /** Key estable: codauto:cpro:ciudadNormalizada */
  key: string;
  codauto: number;
  cpro: number;
  city: string;
  cityNorm: string;
  communitySlug: string;
  provinceSlug: string;
  citySlug: string;
  rentEurPerSqm: number;
  fetchedAt: number; // epoch ms
  source: 'idealista-report:v1';
};

type PersistedStore = {
  version: 1;
  entries: RentMarketEntry[];
};

const store = new Map<string, RentMarketEntry>();
let loaded = false;
let writePromise: Promise<void> | null = null;

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;

  try {
    const p = path.resolve(process.cwd(), RENT_MARKET_STORE_PATH);
    if (!fs.existsSync(p)) return;
    const raw = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedStore | RentMarketEntry[];
    const entries = Array.isArray(parsed) ? parsed : parsed.entries;
    for (const e of entries ?? []) {
      if (!e || typeof e.key !== 'string') continue;
      store.set(e.key, e);
    }
  } catch (err) {
    console.warn('[rent-market] Error cargando store JSON:', err instanceof Error ? err.message : err);
  }
}

function isFresh(entry: RentMarketEntry): boolean {
  return Date.now() - entry.fetchedAt < RENT_MARKET_TTL_MS;
}

async function persist(): Promise<void> {
  const p = path.resolve(process.cwd(), RENT_MARKET_STORE_PATH);
  const dir = path.dirname(p);

  const data: PersistedStore = {
    version: 1,
    entries: Array.from(store.values()).sort((a, b) => b.fetchedAt - a.fetchedAt),
  };

  await fs.promises.mkdir(dir, { recursive: true });

  // Escritura atómica: tmp → rename
  const tmp = `${p}.tmp`;
  await fs.promises.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.promises.rename(tmp, p);
}

export function buildRentMarketKey(params: { codauto: number; cpro: number; cityNorm: string }): string {
  return `${params.codauto}:${params.cpro}:${params.cityNorm}`;
}

export function getRentMarket(key: string): { cached: boolean; entry: RentMarketEntry | null } {
  ensureLoaded();
  const entry = store.get(key) ?? null;
  if (!entry) return { cached: false, entry: null };
  if (!isFresh(entry)) return { cached: false, entry: null };
  return { cached: true, entry };
}

export function setRentMarket(entry: RentMarketEntry): Promise<void> {
  ensureLoaded();
  store.set(entry.key, entry);

  // Serializar escrituras para evitar corrupción por concurrencia
  const next = async () => {
    try {
      await persist();
    } catch (err) {
      console.warn('[rent-market] Error persistiendo store JSON:', err instanceof Error ? err.message : err);
    }
  };

  writePromise = (writePromise ?? Promise.resolve()).then(next, next);
  return writePromise;
}

// Guardar al cerrar (best-effort)
function setupShutdownPersist(): void {
  const handler = async () => {
    try {
      await (writePromise ?? Promise.resolve());
      await persist();
    } catch {
      // ignore
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGTERM', handler);
  process.once('SIGINT', handler);
}

setupShutdownPersist();

