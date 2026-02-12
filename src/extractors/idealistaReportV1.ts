/**
 * Extractor v1 para informes de alquiler de Idealista.
 * 
 * Extrae el precio de alquiler por m² desde el HTML del informe.
 * 
 * Patrón buscado: <strong>XX,X €/m2</strong>
 * Regex: <strong>\s*([\d,]+)\s*€/m2\s*</strong>
 */

/**
 * Extrae el precio de alquiler por m² desde el HTML del informe.
 * 
 * @param html - HTML completo de la página del informe
 * @returns Precio en €/m² o null si no se encuentra
 */
export function extractRentEurPerSqm(html: string): number | null {
  // Patrón principal: <strong>XX,X €/m2</strong>
  const regex = /<strong>\s*([\d,]+)\s*€\/m2\s*<\/strong>/i;
  const match = html.match(regex);
  
  if (!match) {
    return null;
  }
  
  // Convertir formato español (coma decimal) a número
  const valorStr = match[1].replace(',', '.');
  const valor = parseFloat(valorStr);
  
  if (isNaN(valor) || valor <= 0) {
    return null;
  }
  
  return valor;
}
