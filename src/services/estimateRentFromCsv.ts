import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { obtenerCiudadInfo } from '../data/territorioEspanol';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RentPriceData {
  Capital: string;
  Precio_medio_eur_m2_mes: string;
  Codigo_provincia_INE: string;
}

let cachedData: Map<number, number> | null = null;

/**
 * Carga y parsea el CSV de precios de alquiler por provincia (capital).
 * Los datos se cachean en memoria tras la primera carga.
 * Retorna un Map con: código de provincia (cpro) → precio €/m²/mes
 */
async function loadRentPriceData(): Promise<Map<number, number>> {
  if (cachedData) return cachedData;

  const csvPath = join(__dirname, '../../docs/alquiler_capitales_provincia_con_codigo.csv');
  const csvContent = await readFile(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as RentPriceData[];

  const dataMap = new Map<number, number>();
  
  for (const record of records) {
    const cproStr = record.Codigo_provincia_INE?.trim();
    const priceStr = record.Precio_medio_eur_m2_mes?.trim();
    
    if (cproStr && priceStr) {
      const cpro = parseInt(cproStr, 10);
      const price = parseFloat(priceStr);
      if (!isNaN(cpro) && !isNaN(price) && price > 0) {
        dataMap.set(cpro, price);
      }
    }
  }

  cachedData = dataMap;
  console.log(`[csv-rent] Cargados ${dataMap.size} precios de alquiler por provincia desde CSV`);
  return dataMap;
}

/**
 * Busca el precio medio de alquiler (€/m²/mes) para una provincia.
 * @param cpro - Código de provincia (CPRO del INE)
 * @returns Precio medio en €/m²/mes, o null si no se encuentra
 */
async function findRentPricePerSqm(cpro: number): Promise<number | null> {
  const dataMap = await loadRentPriceData();
  return dataMap.get(cpro) ?? null;
}

/**
 * Estima el alquiler mensual para una propiedad usando datos del CSV.
 * Flujo:
 * 1. Obtiene el código de provincia (cpro) desde la ciudad (usando ciudades.csv)
 * 2. Busca el precio por m² para esa provincia en el CSV de alquileres
 * 3. Calcula: metros_cuadrados × precio_€/m²/mes
 * 
 * @param city - Nombre de la ciudad
 * @param sqm - Metros cuadrados (opcional)
 * @returns Alquiler mensual estimado en €, o null si no se puede calcular
 */
export async function estimateRentFromCsv(city: string, sqm?: number | null): Promise<number | null> {
  if (!city?.trim() || !sqm || sqm <= 0) return null;
  
  // 1. Obtener información de la ciudad (incluye cpro)
  const ciudadInfo = obtenerCiudadInfo(city);
  if (!ciudadInfo) {
    console.log(`[csv-rent] Ciudad no encontrada en ciudades.csv: ${city}`);
    return null;
  }
  
  // 2. Buscar precio por m² para esta provincia
  const pricePerSqm = await findRentPricePerSqm(ciudadInfo.cpro);
  if (pricePerSqm == null) {
    console.log(`[csv-rent] No hay precio para provincia ${ciudadInfo.cpro} (ciudad: ${city})`);
    return null;
  }
  
  // 3. Calcular alquiler estimado
  const estimatedRent = Math.round(sqm * pricePerSqm);
  console.log(`[csv-rent] ${city} (cpro:${ciudadInfo.cpro}): ${sqm}m² × ${pricePerSqm}€/m² = ${estimatedRent}€/mes`);
  return estimatedRent;
}
