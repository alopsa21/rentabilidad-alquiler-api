import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Ciudad {
  codauto: number;
  cpro: number;
  nombre: string;
}

interface Provincia {
  cpro: number;
  nombre: string;
  codauto: number;
}

// Datos precargados en memoria
let comunidades: Map<number, string> = new Map();
let ciudades: Ciudad[] = [];
let ciudadesNormalizadas: Map<string, Ciudad> = new Map();
let provincias: Map<number, Provincia> = new Map();

/**
 * Normaliza un string para comparaciones (minúsculas, sin acentos, sin espacios extras)
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar diacríticos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Carga los CSV en memoria. Se ejecuta automáticamente al importar este módulo.
 */
function cargarDatos() {
  const docsDir = path.join(__dirname, '..', '..', 'docs');
  
  // 1. Cargar comunidades
  const comunidadesPath = path.join(docsDir, 'comunidades.csv');
  const comunidadesContent = fs.readFileSync(comunidadesPath, 'utf-8');
  const comunidadesLines = comunidadesContent.split('\n').slice(1); // saltar header
  
  for (const line of comunidadesLines) {
    if (!line.trim()) continue;
    const match = line.match(/^(\d+),(.+)$/);
    if (match) {
      const codigo = parseInt(match[1], 10);
      let nombre = match[2].trim();
      // Quitar comillas si existen
      if (nombre.startsWith('"') && nombre.endsWith('"')) {
        nombre = nombre.slice(1, -1);
      }
      comunidades.set(codigo, nombre);
    }
  }
  
  // 2. Cargar ciudades
  const ciudadesPath = path.join(docsDir, 'ciudades.csv');
  const ciudadesContent = fs.readFileSync(ciudadesPath, 'utf-8');
  const ciudadesLines = ciudadesContent.split('\n').slice(2); // saltar header y primera línea
  
  for (const line of ciudadesLines) {
    if (!line.trim()) continue;
    // El CSV tiene formato: CODAUTO,CPRO,CMUN,DC,"NOMBRE"
    // Algunos nombres tienen comillas y comas internas, ej: 10,03,075,9,"Castell de Guadalest, el"
    const match = line.match(/^(\d+),(\d+),(\d+),(\d+),(.+)$/);
    if (match) {
      const codauto = parseInt(match[1], 10);
      const cpro = parseInt(match[2], 10);
      let nombre = match[5].trim();
      
      // Quitar comillas si existen (al inicio y/o al final)
      nombre = nombre.replace(/^"/, '').replace(/"$/, '');
      
      if (!isNaN(codauto) && !isNaN(cpro) && nombre) {
        const ciudad: Ciudad = { codauto, cpro, nombre };
        ciudades.push(ciudad);
        ciudadesNormalizadas.set(normalizar(nombre), ciudad);
        
        // También guardar info de provincia si no existe
        if (!provincias.has(cpro)) {
          provincias.set(cpro, {
            cpro,
            nombre: '', // se inferirá del nombre de las ciudades si es necesario
            codauto
          });
        }
      }
    }
  }
  
  console.log(`✅ Cargados: ${comunidades.size} comunidades, ${ciudades.length} ciudades`);
}

/**
 * Busca el código de comunidad autónoma por nombre de ciudad
 * @returns Código CODAUTO (1-19) o null si no se encuentra
 */
export function buscarCodigoComunidadPorCiudad(nombreCiudad: string): number | null {
  const ciudadNorm = normalizar(nombreCiudad);
  const ciudad = ciudadesNormalizadas.get(ciudadNorm);
  
  if (ciudad) {
    return ciudad.codauto;
  }
  
  // Búsqueda parcial si no hay match exacto
  for (const [normNombre, ciudad] of ciudadesNormalizadas) {
    if (normNombre.includes(ciudadNorm) || ciudadNorm.includes(normNombre)) {
      return ciudad.codauto;
    }
  }
  
  return null;
}

/**
 * Busca el nombre de comunidad autónoma por nombre de ciudad (legacy)
 * @deprecated Usar buscarCodigoComunidadPorCiudad
 */
export function buscarComunidadPorCiudad(nombreCiudad: string): string | null {
  const codigo = buscarCodigoComunidadPorCiudad(nombreCiudad);
  if (codigo !== null) {
    return comunidades.get(codigo) || null;
  }
  return null;
}

/**
 * Busca el código de comunidad autónoma por código de provincia
 * @returns Código CODAUTO (1-19) o null si no se encuentra
 */
export function buscarCodigoComunidadPorCodigoProvincia(cpro: number): number | null {
  const provincia = provincias.get(cpro);
  if (provincia) {
    return provincia.codauto;
  }
  return null;
}

/**
 * Busca el nombre de comunidad autónoma por código de provincia (legacy)
 * @deprecated Usar buscarCodigoComunidadPorCodigoProvincia
 */
export function buscarComunidadPorCodigoProvincia(cpro: number): string | null {
  const codigo = buscarCodigoComunidadPorCodigoProvincia(cpro);
  if (codigo !== null) {
    return comunidades.get(codigo) || null;
  }
  return null;
}

/**
 * Busca el código de comunidad autónoma por nombre de provincia
 * @returns Código CODAUTO (1-19) o null si no se encuentra
 */
export function buscarCodigoComunidadPorProvincia(nombreProvincia: string): number | null {
  const provinciaNorm = normalizar(nombreProvincia);
  
  // Mapeo de nombres de provincia comunes a códigos de provincia (cpro)
  const nombresProvincia: Record<string, number> = {
    'alava': 1, 'araba': 1,
    'albacete': 2,
    'alicante': 3,
    'almeria': 4,
    'avila': 5,
    'badajoz': 6,
    'baleares': 7, 'illes balears': 7, 'palma': 7,
    'barcelona': 8,
    'burgos': 9,
    'caceres': 10,
    'cadiz': 11,
    'castellon': 12,
    'ciudad real': 13,
    'cordoba': 14,
    'a coruna': 15, 'coruna': 15,
    'cuenca': 16,
    'girona': 17,
    'granada': 18,
    'guadalajara': 19,
    'gipuzkoa': 20, 'guipuzcoa': 20,
    'huelva': 21,
    'huesca': 22,
    'jaen': 23,
    'leon': 24,
    'lleida': 25,
    'la rioja': 26, 'logrono': 26,
    'lugo': 27,
    'madrid': 28,
    'malaga': 29,
    'murcia': 30,
    'navarra': 31,
    'ourense': 32,
    'asturias': 33,
    'palencia': 34,
    'las palmas': 35,
    'pontevedra': 36,
    'salamanca': 37,
    'santa cruz de tenerife': 38, 'tenerife': 38,
    'cantabria': 39,
    'segovia': 40,
    'sevilla': 41,
    'soria': 42,
    'tarragona': 43,
    'teruel': 44,
    'toledo': 45,
    'valencia': 46,
    'valladolid': 47,
    'vizcaya': 48, 'bizkaia': 48,
    'zamora': 49,
    'zaragoza': 50,
    'ceuta': 51,
    'melilla': 52
  };
  
  const cpro = nombresProvincia[provinciaNorm];
  if (cpro) {
    return buscarCodigoComunidadPorCodigoProvincia(cpro);
  }
  
  return null;
}

/**
 * Busca el nombre de comunidad autónoma por nombre de provincia (legacy)
 * @deprecated Usar buscarCodigoComunidadPorProvincia
 */
export function buscarComunidadPorProvincia(nombreProvincia: string): string | null {
  const codigo = buscarCodigoComunidadPorProvincia(nombreProvincia);
  if (codigo !== null) {
    return comunidades.get(codigo) || null;
  }
  return null;
}

/**
 * Obtiene todas las comunidades autónomas
 */
export function obtenerTodasLasComunidades(): string[] {
  return Array.from(comunidades.values());
}

/**
 * Obtiene el código de una comunidad por su nombre
 */
export function obtenerCodigoComunidad(nombreComunidad: string): number | null {
  const nombreNorm = normalizar(nombreComunidad);
  for (const [codigo, nombre] of comunidades) {
    if (normalizar(nombre) === nombreNorm) {
      return codigo;
    }
  }
  return null;
}

/**
 * Obtiene el nombre de una comunidad autónoma por su código
 * @param codigo - Código CODAUTO (1-19)
 * @returns Nombre de la comunidad o null si el código no existe
 */
export function obtenerNombreComunidad(codigo: number): string | null {
  return comunidades.get(codigo) || null;
}

/**
 * Obtiene todas las ciudades cargadas en memoria
 * @returns Array de objetos Ciudad con codauto, cpro y nombre
 */
export function obtenerTodasLasCiudades(): Ciudad[] {
  return ciudades;
}

/**
 * Obtiene todas las ciudades (nombres) de una comunidad autónoma por CODAUTO.
 * Útil para desplegables en frontend.
 */
export function obtenerCiudadesPorCodauto(codauto: number): string[] {
  if (!Number.isFinite(codauto)) return [];
  const nombres = ciudades
    .filter((c) => c.codauto === codauto)
    .map((c) => c.nombre)
    .filter(Boolean);
  // Ordenar para UX consistente
  return nombres.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

/**
 * Busca una ciudad por nombre y devuelve su información completa.
 * Útil para verificar si una ciudad existe y obtener su codauto y cpro.
 * 
 * @param nombreCiudad - Nombre de la ciudad a buscar
 * @returns Objeto Ciudad con codauto, cpro y nombre, o null si no se encuentra
 */
export function obtenerCiudadInfo(nombreCiudad: string): Ciudad | null {
  const ciudadNorm = normalizar(nombreCiudad);
  const exact = ciudadesNormalizadas.get(ciudadNorm);
  if (exact) return exact;

  // Fallback: búsqueda parcial
  for (const [normNombre, ciudad] of ciudadesNormalizadas) {
    if (normNombre.includes(ciudadNorm) || ciudadNorm.includes(normNombre)) {
      return ciudad;
    }
  }
  return null;
}

/**
 * Exportar función de normalización para usar en extractores
 */
export { normalizar };

// Cargar datos al inicializar el módulo
cargarDatos();
