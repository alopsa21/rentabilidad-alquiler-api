/**
 * Normaliza strings para usarlos en URLs tipo Idealista.
 *
 * Objetivo: generar slugs razonables sin depender de una lista completa de excepciones.
 */

function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function reorderCommaArticle(input: string): string {
  const s = input.trim();
  const m = s.match(/^(.+),\s*(el|la|los|las|a)$/i);
  if (!m) return s;
  return `${m[2]} ${m[1]}`.trim();
}

export function slugify(input: string): string {
  const base = stripDiacritics(input)
    .toLowerCase()
    .trim();

  // Reemplazar separadores habituales por espacios para luego colapsar
  const normalized = base
    .replace(/[\/]+/g, ' ')
    .replace(/[’'`´]/g, '')
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized;
}

export function provinceSlugCandidates(nombreProvincia: string): string[] {
  const base = reorderCommaArticle(nombreProvincia);
  const parts = base.split('/').map((p) => p.trim()).filter(Boolean);
  const candidates = parts.length > 0 ? parts : [base];

  const slugs = candidates
    .map((c) => slugify(c))
    .filter(Boolean)
    .map((s) => `${s}-provincia`);

  // Dedup manteniendo orden
  return Array.from(new Set(slugs));
}

export function citySlugCandidates(nombreCiudad: string): string[] {
  const reordered = reorderCommaArticle(nombreCiudad);
  const c1 = slugify(reordered);
  const c2 = slugify(nombreCiudad);
  return Array.from(new Set([c1, c2].filter(Boolean)));
}

