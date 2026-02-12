import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractIdealistaV1 } from '../../src/extractors/idealistaV1';
// Los datos de territorio se cargan automáticamente al importar el módulo
import '../../src/data/territorioEspanol';

/**
 * Test que lee HTMLs reales desde test/fixtures/ y valida la extracción.
 * 
 * Para añadir un nuevo test:
 * 1. Guarda el HTML en test/fixtures/nombre-del-test.html
 * 2. Añade un caso de test aquí con los valores esperados
 */

const FIXTURES_DIR = join(__dirname, '../fixtures');

function loadFixture(filename: string): string {
  const filePath = join(FIXTURES_DIR, filename);
  return readFileSync(filePath, 'utf-8');
}

describe('extractIdealistaV1 - HTMLs reales desde fixtures', () => {
  it('debe extraer datos correctamente desde HTML real de Idealista', () => {
    // Si no existe el archivo, el test se salta
    try {
      const html = loadFixture('idealista-real.html');
      
      const result = extractIdealistaV1(html);
      
      // Valores esperados del HTML real
      expect(result.buyPrice).toBe(795000);
      expect(result.sqm).toBe(266);
      expect(result.rooms).toBe(5);
      expect(result.banos).toBe(4);
      expect(result.ciudad).toBe('Dénia');
      expect(result.codigoComunidadAutonoma).toBe(10); // Comunitat Valenciana
      expect(result.source).toBe('idealista:v1');
      
      console.log('\n📊 Datos extraídos:');
      console.log(`   Precio: ${result.buyPrice} €`);
      console.log(`   Metros: ${result.sqm} m²`);
      console.log(`   Habitaciones: ${result.rooms}`);
      console.log(`   Baños: ${result.banos}`);
      console.log(`   Ciudad: ${result.ciudad}`);
      console.log(`   Comunidad: ${result.codigoComunidadAutonoma}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Archivo no existe, saltar test
        console.log('⚠️  Archivo test/fixtures/idealista-real.html no encontrado. Saltando test.');
        return;
      }
      throw error;
    }
  });

  // Puedes añadir más tests aquí para diferentes HTMLs
  // Ejemplo:
  // it('debe extraer datos de otro anuncio', () => {
  //   const html = loadFixture('otro-anuncio.html');
  //   const result = extractIdealistaV1(html);
  //   expect(result.ciudad).toBe('Barcelona');
  //   // ... más validaciones
  // });
});
