/**
 * Extractor v1 para informes públicos de alquiler de Idealista.
 *
 * Objetivo: extraer el valor "XX,X €/m²" del HTML del informe.
 *
 * Best-effort: si no se encuentra, devuelve null.
 */

function parseSpanishDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function extractIdealistaRentEurPerSqmV1(html: string): number | null {
  // Variantes habituales: €/m2, €/m², €/m<sup>2</sup>
  const patterns: RegExp[] = [
    /<strong[^>]*>\s*([\d.,]+)\s*€\s*\/\s*m2\s*<\/strong>/i,
    /<strong[^>]*>\s*([\d.,]+)\s*€\s*\/\s*m²\s*<\/strong>/i,
    /<strong[^>]*>\s*([\d.,]+)\s*€\s*\/\s*m\s*<sup>\s*2\s*<\/sup>\s*<\/strong>/i,
    /<strong[^>]*>\s*([\d.,]+)\s*€\s*\/\s*m\s*<sup>\s*2\s*<\/sup>\s*<\/strong>/i,
    // Fallback más permisivo
    /<strong[^>]*>\s*([\d.,]+)\s*€\s*\/\s*m(?:2|²)\s*<\/strong>/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const n = parseSpanishDecimal(m[1]);
      if (n != null) return n;
    }
  }

  return null;
}

