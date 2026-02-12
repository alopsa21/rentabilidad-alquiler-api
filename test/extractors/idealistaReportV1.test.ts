import { describe, it, expect } from 'vitest';
import { extractRentEurPerSqm } from '../../src/extractors/idealistaReportV1';

describe('extractRentEurPerSqm', () => {
  it('debe extraer precio con formato español (coma decimal)', () => {
    const html = '<strong>15,50 €/m2</strong>';
    const result = extractRentEurPerSqm(html);
    expect(result).toBe(15.5);
  });

  it('debe extraer precio con espacios', () => {
    const html = '<strong>  12,30  €/m2  </strong>';
    const result = extractRentEurPerSqm(html);
    expect(result).toBe(12.3);
  });

  it('debe extraer precio case-insensitive', () => {
    const html = '<strong>10,25 €/M2</strong>';
    const result = extractRentEurPerSqm(html);
    expect(result).toBe(10.25);
  });

  it('debe devolver null si no encuentra el patrón', () => {
    const html = '<div>Precio: 15.50 €/m2</div>';
    const result = extractRentEurPerSqm(html);
    expect(result).toBeNull();
  });

  it('debe devolver null si el valor no es válido', () => {
    const html = '<strong>0 €/m2</strong>';
    const result = extractRentEurPerSqm(html);
    expect(result).toBeNull();
  });

  it('debe extraer el primer valor encontrado', () => {
    const html = '<strong>10,50 €/m2</strong> y también <strong>20,00 €/m2</strong>';
    const result = extractRentEurPerSqm(html);
    expect(result).toBe(10.5);
  });
});
