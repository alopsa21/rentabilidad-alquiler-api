/**
 * Extractor v1 para anuncios de Idealista.
 * 
 * Extrae datos básicos del HTML usando regex específicas.
 * Best-effort: si falla cualquier campo, devuelve null.
 */

import { buscarCodigoComunidadPorCiudad, obtenerCiudadInfo } from "../data/territorioEspanol.js";

export interface IdealistaAutofill {
  buyPrice: number | null;
  sqm: number | null;
  rooms: number | null;
  banos: number | null;
  ciudad: string | null;
  codigoComunidadAutonoma: number | null;
  /**
   * Texto plano con las características del inmueble (bloque details-property_features limpiado).
   * Para envío al LLM; no se pasa HTML crudo.
   */
  featuresText: string | null;
  /**
   * Alquiler mensual estimado (mercado) en €/mes.
   * Viene del LLM (maxRent) cuando source es openai:v2.
   */
  estimatedRent?: number | null;
  /** Para compatibilidad con el front: mismo valor que estimatedRent cuando viene del LLM. */
  alquilerMensual?: number | null;
  source: "idealista:v1" | "openai:v2";
}

/**
 * Normaliza un número que puede venir con puntos como separadores de miles
 * y coma como separador decimal (formato español).
 */
function normalizeNumber(input: string): number {
  return Number(input.replace(/\./g, "").replace(",", "."));
}

/** Regex para bloques div.details-property_features (class puede tener más clases). */
const RE_DETAILS_PROPERTY_FEATURES = /<div[^>]*class="[^"]*details-property_features[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

/** No incluir bloques que estén después de "Certificado energético" (solo Características básicas y Equipamiento). */
const CORTE_CERTIFICADO = /Certificado energético/i;

/**
 * Extrae el HTML interno de los bloques div.details-property_features que aparecen
 * antes de "Certificado energético", y los concatena.
 */
function extractFeaturesHtml(html: string): string {
  const corte = html.match(CORTE_CERTIFICADO);
  const htmlAntesCertificado = corte ? html.slice(0, corte.index!) : html;

  const parts: string[] = [];
  let m: RegExpExecArray | null;
  RE_DETAILS_PROPERTY_FEATURES.lastIndex = 0;
  while ((m = RE_DETAILS_PROPERTY_FEATURES.exec(htmlAntesCertificado)) !== null) {
    parts.push(m[1].trim());
  }
  return parts.join(" ");
}

/**
 * Limpia HTML a texto plano: elimina tags y normaliza espacios.
 * Antes de enviar al LLM no se pasa HTML crudo.
 */
function htmlToFeaturesText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Busca el primer valor numérico asociado a una clave en un objeto (recursivo, profundidad limitada). */
function findNumberInObject(
  o: unknown,
  keys: string[],
  maxDepth: number
): number | null {
  if (maxDepth <= 0 || !o || typeof o !== "object" || Array.isArray(o))
    return null;
  for (const k of keys) {
    const v = (o as Record<string, unknown>)[k];
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
  }
  // Buscar en hijos
  for (const v of Object.values(o)) {
    if (Array.isArray(v)) continue;
    const n = findNumberInObject(v, keys, maxDepth - 1);
    if (n != null) return n;
  }
  return null;
}

/** Busca el primer string asociado a una clave en un objeto (recursivo, profundidad limitada). */
function findStringInObject(
  o: unknown,
  keys: string[],
  maxDepth: number
): string | null {
  if (maxDepth <= 0 || !o || typeof o !== "object" || Array.isArray(o))
    return null;
  for (const k of keys) {
    const v = (o as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  // Buscar en hijos
  for (const v of Object.values(o)) {
    if (Array.isArray(v)) continue;
    const s = findStringInObject(v, keys, maxDepth - 1);
    if (s != null) return s;
  }
  return null;
}

/**
 * Intenta extraer datos desde __NEXT_DATA__ (Next.js).
 * Idealista usa Next.js y embebe los datos del anuncio en este script.
 */
function extractFromNextData(html: string): Partial<IdealistaAutofill> | null {
  const scriptMatch = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json"\s*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) return null;

  try {
    const nextData = JSON.parse(scriptMatch[1]) as Record<string, unknown>;
    const pageProps = (nextData?.props as Record<string, unknown>)?.pageProps as Record<string, unknown> | undefined;
    if (!pageProps || typeof pageProps !== "object") return null;

    // Objeto candidato: detail, propertyDetail, listing, initialProps, data, etc.
    const detail =
      pageProps.detail ??
      pageProps.propertyDetail ??
      pageProps.listing ??
      pageProps.initialProps ??
      pageProps.data ??
      pageProps;

    const root = typeof detail === "object" && detail !== null ? detail : pageProps;
    const buyPrice = findNumberInObject(root, ["price", "priceAmount", "priceValue", "salePrice", "amount"], 4);
    const sqm = findNumberInObject(root, ["size", "surface", "constructedArea", "area", "sqm", "builtArea"], 4);
    const rooms = findNumberInObject(root, ["rooms", "bedrooms", "numRooms", "roomCount"], 4);
    const banos = findNumberInObject(root, ["bathrooms", "bathroomsTotal", "numBathrooms", "bathroomCount"], 4);
    const ciudad = findStringInObject(root, ["municipality", "city", "locality", "town"], 4)
      ?? (root && typeof root === "object" && root !== null && typeof (root as Record<string, unknown>).address === "object"
        ? findStringInObject((root as Record<string, unknown>).address, ["municipality", "city", "locality"], 2)
        : null);

    return {
      buyPrice: buyPrice ?? null,
      sqm: sqm ?? null,
      rooms: rooms ?? null,
      banos: banos ?? null,
      ciudad,
    };
  } catch {
    return null;
  }
}

/**
 * Extrae datos de un anuncio de Idealista desde el HTML.
 * 
 * @param html - HTML completo de la página del anuncio
 * @returns Objeto con datos extraídos o nulls si no se encuentran
 */
export function extractIdealistaV1(html: string): IdealistaAutofill {
  // 1) Intentar primero __NEXT_DATA__ (Next.js) — Idealista usa esto
  const fromNext = extractFromNextData(html);
  let buyPrice = fromNext?.buyPrice ?? null;
  let sqm = fromNext?.sqm ?? null;
  let rooms = fromNext?.rooms ?? null;
  let banos = fromNext?.banos ?? null;
  let ciudad = fromNext?.ciudad ?? null;

  // 2) Fallback: regex en HTML para los campos que no se encontraron
  // Precio de compra
  if (buyPrice === null) {
    const priceMatch =
      html.match(/<strong[^>]*class="[^"]*price[^"]*"[^>]*>([\d\.\s]+)\s*€/i) ??
      html.match(/data-price="([\d\.]+)"/i) ??
      html.match(/([1-9]\d{2,5}(?:\.\d{3})*)\s*€/);
    if (priceMatch) {
      buyPrice = normalizeNumber(priceMatch[1].replace(/\s/g, ''));
    }
  }

  // Metros cuadrados
  if (sqm === null) {
    const sqmMatch =
      html.match(/(\d+)\s*m[²2]\s*construidos/i) ??
      html.match(/<span[^>]*>[\s\S]{0,50}?(\d+)[\s\S]{0,50}?<\/span>[\s\S]{0,50}?m[²2]/i) ??
      html.match(/(\d+)\s*m[²2]/i);
    if (sqmMatch) {
      sqm = Number(sqmMatch[1]);
    }
  }

  // Habitaciones
  if (rooms === null) {
    const roomsMatch =
      html.match(/(\d+)\s*habitaciones/i) ??
      html.match(/(\d+)\s*hab\.?/i) ??
      html.match(/<span[^>]*>[\s\S]{0,50}?(\d+)[\s\S]{0,50}?<\/span>[\s\S]{0,50}?hab/i) ??
      html.match(/(\d+)\s*dormitorios/i);
    if (roomsMatch) {
      rooms = Number(roomsMatch[1]);
    }
  }

  // Baños
  if (banos === null) {
    const banosMatch =
      html.match(/(\d+)\s*baños/i) ??
      html.match(/(\d+)\s*baño/i) ??
      html.match(/<span[^>]*>[\s\S]{0,50}?(\d+)[\s\S]{0,50}?<\/span>[\s\S]{0,50}?baño/i) ??
      html.match(/(\d+)\s*aseos/i);
    if (banosMatch) {
      banos = Number(banosMatch[1]);
    }
  }

  // Ciudad: extraer desde el título (patrón: última coma antes de &#8212;)
  if (ciudad === null) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const titulo = titleMatch[1];
      
      // Buscar patrón: texto entre la última coma y &#8212; (guión largo HTML entity)
      // Ejemplo: "Piso en venta en Avenida Paraguay, Playa de Poniente, Benidorm &#8212; idealista"
      // Resultado: "Benidorm"
      const ciudadMatch = titulo.match(/,\s*([^,]+?)\s*&#8212;/);
      
      if (ciudadMatch) {
        const ciudadExtraida = ciudadMatch[1].trim();
        
        // Si la ciudad contiene "/" (nombres bilingües, ej: "Alcoy / Alcoi"), probar ambas variantes
        if (ciudadExtraida.includes('/')) {
          const variantes = ciudadExtraida.split('/').map(v => v.trim());
          
          for (const variante of variantes) {
            const ciudadInfo = obtenerCiudadInfo(variante);
            if (ciudadInfo) {
              // Usar el nombre exacto de la ciudad encontrada
              ciudad = ciudadInfo.nombre;
              break;
            }
          }
        } else {
          // Verificar que la ciudad extraída está en nuestra lista de ciudades
          const ciudadInfo = obtenerCiudadInfo(ciudadExtraida);
          
          if (ciudadInfo) {
            // Usar el nombre exacto de la ciudad encontrada (puede tener mayúsculas/acentos correctos)
            ciudad = ciudadInfo.nombre;
          }
        }
        // Si no está en la lista (ni ninguna variante), ciudad permanece null
      }
    }
  }

  // 3) Código de comunidad autónoma: obtener directamente desde la ciudad extraída
  let codigoComunidadAutonoma: number | null = null;
  if (ciudad) {
    codigoComunidadAutonoma = buscarCodigoComunidadPorCiudad(ciudad);
  }

  // 4) Bloque de características (details-property_features): extraer y limpiar a texto plano
  const featuresHtml = extractFeaturesHtml(html);
  // DEBUG temporal: contenido crudo del div antes de limpiar
  if (featuresHtml) {
    console.log("[DEBUG] featuresHtml (antes de limpiar):\n", featuresHtml);
  }
  const featuresText = featuresHtml ? htmlToFeaturesText(featuresHtml) : null;

  return {
    buyPrice,
    sqm,
    rooms,
    banos,
    ciudad,
    codigoComunidadAutonoma,
    featuresText,
    source: "idealista:v1"
  };
}
