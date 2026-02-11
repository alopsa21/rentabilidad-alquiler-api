/**
 * Extractor v1 para anuncios de Idealista.
 * 
 * Extrae datos básicos del HTML usando regex específicas.
 * Best-effort: si falla cualquier campo, devuelve null.
 */

import { buscarCodigoComunidadPorCiudad, obtenerTodasLasCiudades, normalizar } from "../data/territorioEspanol.js";

export interface IdealistaAutofill {
  buyPrice: number | null;
  sqm: number | null;
  rooms: number | null;
  banos: number | null;
  ciudad: string | null;
  codigoComunidadAutonoma: number | null;
  source: "idealista:v1";
}

/**
 * Normaliza un número que puede venir con puntos como separadores de miles
 * y coma como separador decimal (formato español).
 */
function normalizeNumber(input: string): number {
  return Number(input.replace(/\./g, "").replace(",", "."));
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

  // Ciudad: buscar en el título y verificar en la lista de ciudades
  if (ciudad === null) {
    // 1. Extraer el título
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const titulo = titleMatch[1];
      const tituloNormalizado = normalizar(titulo);
      
      // 2. Dividir el título en palabras
      const palabrasTitulo = tituloNormalizado.split(/[\s,\-\u2014]+/).filter(p => p.length >= 3);
      
      // 3. Buscar cuáles palabras del título son ciudades conocidas
      const todasLasCiudades = obtenerTodasLasCiudades();
      const ciudadesCandidatas: Array<{ nombre: string; palabraMatch: string; matchCompleto: boolean }> = [];
      
      // Palabras genéricas de inmobiliaria que debemos ignorar
      const palabrasInmobiliarias = [
        'casa', 'piso', 'venta', 'alquiler', 'chalet', 'apartamento', 'duplex',
        'atico', 'estudio', 'loft', 'villa', 'finca', 'local', 'oficina',
        'garaje', 'parking', 'trastero', 'terreno', 'solar', 'nave', 'pueblo',
        'nueva', 'nuevo', 'obra', 'segunda', 'mano', 'lujo', 'centro', 'adosado',
        'independiente', 'pareado', 'plantas', 'planta', 'baja', 'reformar', 'rustica'
      ];
      
      // Artículos y preposiciones que debemos ignorar
      const articulosYPreposiciones = [
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'de', 'del', 'al', 'en', 'con', 'por', 'para', 'sobre'
      ];
      
      // Primero: buscar ciudades cuyo nombre COMPLETO aparece en el título (mayor prioridad)
      for (const ciudadData of todasLasCiudades) {
        const nombreNormalizado = normalizar(ciudadData.nombre);
        // Quitar artículos y comas del nombre de la ciudad para la comparación
        const nombreLimpio = nombreNormalizado.replace(/,\s*(el|la|los|las)$/i, '').trim();
        
        // Buscar el nombre completo en el título (con word boundaries)
        const regex = new RegExp(
          `(?<![a-z0-9])${nombreLimpio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`,
          'i'
        );
        
        if (regex.test(tituloNormalizado)) {
          ciudadesCandidatas.push({ 
            nombre: ciudadData.nombre, 
            palabraMatch: nombreLimpio,
            matchCompleto: true
          });
        }
      }
      
      // Segundo: si no hay matches completos, buscar por palabras individuales
      if (ciudadesCandidatas.length === 0) {
        for (const palabra of palabrasTitulo) {
          // Ignorar palabras inmobiliarias genéricas y artículos
          if (palabrasInmobiliarias.includes(palabra) || articulosYPreposiciones.includes(palabra)) continue;
          
          // Solo buscar palabras significativas (>= 5 caracteres)
          if (palabra.length < 5) continue;
          
          // Buscar si esta palabra coincide con alguna ciudad o palabra dentro de un nombre de ciudad
          for (const ciudadData of todasLasCiudades) {
            const nombreNormalizado = normalizar(ciudadData.nombre);
            const palabrasCiudad = nombreNormalizado.split(/[,\s]+/);
            
            // Coincidencia de palabra dentro del nombre de ciudad
            if (palabrasCiudad.includes(palabra)) {
              ciudadesCandidatas.push({ 
                nombre: ciudadData.nombre, 
                palabraMatch: palabra,
                matchCompleto: false
              });
              break; // Solo agregar una vez por palabra del título
            }
          }
        }
      }
      
      // 4. Si hay ciudades candidatas, elegir la que más aparece en el HTML
      if (ciudadesCandidatas.length > 0) {
        const htmlNormalizado = normalizar(html);
        const ocurrencias = new Map<string, number>();
        
        for (const candidata of ciudadesCandidatas) {
          const palabraMatch = candidata.palabraMatch;
          const regex = new RegExp(
            `(?<![a-z0-9])${palabraMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`,
            'gi'
          );
          const matches = htmlNormalizado.match(regex);
          const count = matches ? matches.length : 0;
          
          if (!ocurrencias.has(candidata.nombre) || ocurrencias.get(candidata.nombre)! < count) {
            ocurrencias.set(candidata.nombre, count);
          }
        }
        
        // Tomar la ciudad con más ocurrencias
        if (ocurrencias.size > 0) {
          const ciudadesOrdenadas = Array.from(ocurrencias.entries())
            .sort((a, b) => {
              // Primero por ocurrencias
              if (b[1] !== a[1]) return b[1] - a[1];
              // En empate, nombre más largo (más específico)
              return b[0].length - a[0].length;
            });
          
          ciudad = ciudadesOrdenadas[0][0];
        }
      }
    }
  }

  // 3) Código de comunidad autónoma: obtener directamente desde la ciudad extraída
  let codigoComunidadAutonoma: number | null = null;
  if (ciudad) {
    codigoComunidadAutonoma = buscarCodigoComunidadPorCiudad(ciudad);
  }

  return {
    buyPrice,
    sqm,
    rooms,
    banos,
    ciudad,
    codigoComunidadAutonoma,
    source: "idealista:v1"
  };
}
