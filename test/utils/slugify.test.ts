import { describe, it, expect } from 'vitest';
import { slugify, getCommunitySlug, getProvinceSlug, getCitySlug } from '../../src/utils/slugify';

describe('slugify', () => {
  it('debe convertir texto a slug básico', () => {
    expect(slugify('Madrid')).toBe('madrid');
    expect(slugify('Barcelona')).toBe('barcelona');
  });

  it('debe eliminar acentos', () => {
    expect(slugify('Almería')).toBe('almeria');
    expect(slugify('Córdoba')).toBe('cordoba');
  });

  it('debe convertir espacios a guiones', () => {
    expect(slugify('Ciudad Real')).toBe('ciudad-real');
    expect(slugify('Las Palmas')).toBe('las-palmas');
  });

  it('debe eliminar caracteres especiales', () => {
    expect(slugify('Madrid, Comunidad de')).toBe('madrid-comunidad-de');
  });
});

describe('getCommunitySlug', () => {
  it('debe usar mapeo específico cuando existe', () => {
    expect(getCommunitySlug(13, 'Madrid, Comunidad de')).toBe('madrid-comunidad');
    expect(getCommunitySlug(17, 'Rioja, La')).toBe('la-rioja');
  });

  it('debe usar slugify como fallback', () => {
    expect(getCommunitySlug(1, 'Andalucía')).toBe('andalucia');
  });
});

describe('getProvinceSlug', () => {
  it('debe usar mapeo específico cuando existe', () => {
    expect(getProvinceSlug(3, 'Alicante/Alacant')).toBe('alicante-alacant');
    expect(getProvinceSlug(46, 'Valencia/València')).toBe('valencia-valencia');
    expect(getProvinceSlug(15, 'Coruña, A')).toBe('a-coruna-provincia');
  });

  it('debe usar slugify + sufijo como fallback', () => {
    expect(getProvinceSlug(4, 'Almería')).toBe('almeria-provincia');
    expect(getProvinceSlug(28, 'Madrid')).toBe('madrid-provincia');
  });
});

describe('getCitySlug', () => {
  it('debe generar slug normalizado', () => {
    expect(getCitySlug('Alcolea')).toBe('alcolea');
    expect(getCitySlug('Ciudad Real')).toBe('ciudad-real');
  });
});
