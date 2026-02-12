/**
 * Utilidades para generar slugs compatibles con URLs de Idealista.
 */

/**
 * Normaliza un string a slug (minúsculas, sin acentos, espacios → guiones).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar diacríticos
    .replace(/[^a-z0-9\s-]/g, '') // eliminar caracteres especiales
    .replace(/\s+/g, '-') // espacios → guiones
    .replace(/-+/g, '-') // múltiples guiones → uno
    .replace(/^-|-$/g, '') // eliminar guiones al inicio/final
    .trim();
}

/**
 * Mapeo de códigos de comunidad autónoma (CODAUTO) a slugs de Idealista.
 * Basado en los slugs proporcionados por el usuario.
 */
const COMMUNITY_SLUGS: Record<number, string> = {
  3: 'asturias', // "Asturias, Principado de"
  4: 'baleares', // "Balears, Illes"
  7: 'castilla-y-leon', // "Castilla y León"
  8: 'castilla-la-mancha', // "Castilla - La Mancha"
  9: 'cataluna', // "Cataluña"
  10: 'comunitat-valenciana', // "Comunitat Valenciana"
  13: 'madrid-comunidad', // "Madrid, Comunidad de"
  14: 'murcia-region', // "Murcia, Región de"
  15: 'navarra', // "Navarra, Comunidad Foral de"
  16: 'euskadi', // "País Vasco"
  17: 'la-rioja', // "Rioja, La"
};

/**
 * Mapeo de códigos de provincia (CPRO) a slugs de Idealista.
 * Basado en los slugs proporcionados por el usuario.
 */
const PROVINCE_SLUGS: Record<number, string> = {
  1: 'alava', // "Araba/Álava"
  3: 'alicante-alacant', // "Alicante/Alacant"
  7: 'baleares', // "Balears, Illes"
  12: 'castellon-castello', // "Castellón/Castelló"
  15: 'a-coruna-provincia', // "Coruña, A"
  20: 'guipuzcoa', // "Gipuzkoa"
  26: 'la-rioja', // "Rioja, La"
  33: 'asturias', // "Asturias" (provincia)
  35: 'las-palmas', // "Palmas, Las"
  38: 'santa-cruz-de-tenerife-provincia', // "Santa Cruz de Tenerife"
  39: 'cantabria', // "Cantabria" (provincia)
  46: 'valencia-valencia', // "Valencia/València"
  48: 'vizcaya', // "Bizkaia"
};

/**
 * Genera slug de comunidad autónoma para Idealista.
 * 
 * @param codauto - Código CODAUTO (1-19)
 * @param nombreComunidad - Nombre completo de la comunidad
 * @returns Slug para usar en URL de Idealista
 */
export function getCommunitySlug(codauto: number, nombreComunidad: string): string {
  // Si hay mapeo específico, usarlo
  if (COMMUNITY_SLUGS[codauto]) {
    return COMMUNITY_SLUGS[codauto];
  }
  
  // Fallback: slugify del nombre
  return slugify(nombreComunidad);
}

/**
 * Genera slug de provincia para Idealista.
 * 
 * @param cpro - Código de provincia (CPRO)
 * @param nombreProvincia - Nombre de la provincia (fallback si no hay mapeo)
 * @returns Slug para usar en URL de Idealista
 */
export function getProvinceSlug(cpro: number, nombreProvincia: string): string {
  // Si hay mapeo específico, usarlo
  if (PROVINCE_SLUGS[cpro]) {
    return PROVINCE_SLUGS[cpro];
  }
  
  // Fallback: slugify del nombre + sufijo "-provincia"
  return `${slugify(nombreProvincia)}-provincia`;
}

/**
 * Genera slug de ciudad para Idealista.
 * 
 * @param nombreCiudad - Nombre de la ciudad
 * @returns Slug normalizado
 */
export function getCitySlug(nombreCiudad: string): string {
  return slugify(nombreCiudad);
}
