import { describe, it, expect } from 'vitest';
import { extractIdealistaV1 } from '../../src/extractors/idealistaV1';
// Los datos de territorio se cargan automáticamente al importar el módulo
import '../../src/data/territorioEspanol';

describe('extractIdealistaV1', () => {
  describe('extracción desde __NEXT_DATA__', () => {
    it('debe extraer todos los campos desde __NEXT_DATA__', () => {
      const html = `
        <html>
          <head><title>Piso en venta en Madrid</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 150000,
                      "size": 80,
                      "rooms": 3,
                      "bathrooms": 2,
                      "municipality": "Madrid"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.buyPrice).toBe(150000);
      expect(result.sqm).toBe(80);
      expect(result.rooms).toBe(3);
      expect(result.banos).toBe(2);
      expect(result.ciudad).toBe('Madrid');
      expect(result.codigoComunidadAutonoma).toBe(13); // Madrid
      expect(result.source).toBe('idealista:v1');
    });

    it('debe extraer desde propertyDetail si detail no existe', () => {
      const html = `
        <html>
          <head><title>Piso en Barcelona</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "propertyDetail": {
                      "priceAmount": 200000,
                      "surface": 90,
                      "bedrooms": 4,
                      "bathroomsTotal": 2,
                      "city": "Barcelona"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.buyPrice).toBe(200000);
      expect(result.sqm).toBe(90);
      expect(result.rooms).toBe(4);
      expect(result.banos).toBe(2);
      expect(result.ciudad).toBe('Barcelona');
      expect(result.codigoComunidadAutonoma).toBe(9); // Cataluña
    });

    it('debe extraer ciudad desde address si está disponible', () => {
      const html = `
        <html>
          <head><title>Piso en Valencia</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 180000,
                      "size": 75,
                      "rooms": 2,
                      "bathrooms": 1,
                      "address": {
                        "municipality": "Valencia"
                      }
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.ciudad).toBe('Valencia');
      expect(result.codigoComunidadAutonoma).toBe(10); // Comunitat Valenciana
    });
  });

  describe('fallback con regex en HTML', () => {
    it('debe extraer precio desde HTML cuando __NEXT_DATA__ no tiene precio', () => {
      const html = `
        <html>
          <head><title>Piso en Sevilla</title></head>
          <body>
            <div class="price">
              <strong class="price">157.500 €</strong>
            </div>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "size": 80,
                      "rooms": 3,
                      "bathrooms": 2,
                      "municipality": "Sevilla"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.buyPrice).toBe(157500);
    });

    it('debe extraer metros cuadrados desde HTML', () => {
      const html = `
        <html>
          <head><title>Piso en Málaga</title></head>
          <body>
            <div>255 m² construidos</div>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 150000,
                      "rooms": 3,
                      "bathrooms": 2,
                      "municipality": "Málaga"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.sqm).toBe(255);
    });

    it('debe extraer habitaciones desde HTML', () => {
      const html = `
        <html>
          <head><title>Piso en Bilbao</title></head>
          <body>
            <div>3 habitaciones</div>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 200000,
                      "size": 90,
                      "bathrooms": 2,
                      "municipality": "Bilbao"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.rooms).toBe(3);
    });

    it('debe extraer baños desde HTML', () => {
      const html = `
        <html>
          <head><title>Piso en Zaragoza</title></head>
          <body>
            <div>2 baños</div>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 120000,
                      "size": 70,
                      "rooms": 2,
                      "municipality": "Zaragoza"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.banos).toBe(2);
    });
  });

  describe('extracción de ciudad desde título', () => {
    it('debe extraer ciudad desde el título cuando no está en __NEXT_DATA__', () => {
      const html = `
        <html>
          <head><title>Piso en venta en Avenida Paraguay, Playa de Poniente, Albatera &#8212; idealista</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 150000,
                      "size": 80,
                      "rooms": 3,
                      "bathrooms": 1
                    }
                  }
                }
              }
            </script>
            <div>Albatera</div>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.ciudad).toBe('Albatera');
      expect(result.codigoComunidadAutonoma).toBe(10); // Comunitat Valenciana
    });

    it('debe extraer ciudad con nombre compuesto desde el título', () => {
      const html = `
        <html>
          <head><title>Dúplex en venta en Calle Leopoldo Alas, Auditorio-Seminario-Parque de Invierno, San Sebastián de los Reyes &#8212; idealista</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 200000,
                      "size": 100,
                      "rooms": 4,
                      "bathrooms": 2
                    }
                  }
                }
              }
            </script>
            <div>San Sebastián de los Reyes</div>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.ciudad).toBe('San Sebastián de los Reyes');
      expect(result.codigoComunidadAutonoma).toBe(13); // Madrid
    });

    it('debe devolver null si la ciudad extraída no está en la lista', () => {
      const html = `
        <html>
          <head><title>Piso en venta en CiudadDesconocida123 &#8212; idealista</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 150000,
                      "size": 80,
                      "rooms": 3,
                      "bathrooms": 2
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.ciudad).toBeNull();
      expect(result.codigoComunidadAutonoma).toBeNull();
    });
  });

  describe('normalización de números', () => {
    it('debe normalizar precio con formato español (puntos como separadores de miles)', () => {
      const html = `
        <html>
          <head><title>Piso en Madrid</title></head>
          <body>
            <div class="price">
              <strong class="price">157.500 €</strong>
            </div>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "size": 80,
                      "rooms": 3,
                      "bathrooms": 2,
                      "municipality": "Madrid"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.buyPrice).toBe(157500);
    });

    it('debe manejar precios con espacios', () => {
      const html = `
        <html>
          <head><title>Piso en Barcelona</title></head>
          <body>
            <div class="price">
              <strong class="price">200 000 €</strong>
            </div>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "size": 90,
                      "rooms": 4,
                      "bathrooms": 2,
                      "municipality": "Barcelona"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.buyPrice).toBe(200000);
    });
  });

  describe('casos edge', () => {
    it('debe devolver nulls cuando no encuentra datos', () => {
      const html = `
        <html>
          <head><title>Página sin datos</title></head>
          <body>
            <div>Contenido sin datos estructurados</div>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.buyPrice).toBeNull();
      expect(result.sqm).toBeNull();
      expect(result.rooms).toBeNull();
      expect(result.banos).toBeNull();
      expect(result.ciudad).toBeNull();
      expect(result.codigoComunidadAutonoma).toBeNull();
      expect(result.source).toBe('idealista:v1');
    });

    it('debe manejar HTML malformado en __NEXT_DATA__', () => {
      const html = `
        <html>
          <head><title>Piso en Madrid</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              { invalid json }
            </script>
            <div class="price">
              <strong class="price">150000 €</strong>
            </div>
            <div>80 m²</div>
            <div>3 habitaciones</div>
            <div>2 baños</div>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      // Debe usar fallback regex
      expect(result.buyPrice).toBe(150000);
      expect(result.sqm).toBe(80);
      expect(result.rooms).toBe(3);
      expect(result.banos).toBe(2);
    });

    it('debe manejar ciudad desconocida', () => {
      const html = `
        <html>
          <head><title>Piso en CiudadDesconocida123</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 150000,
                      "size": 80,
                      "rooms": 3,
                      "bathrooms": 2
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.ciudad).toBeNull();
      expect(result.codigoComunidadAutonoma).toBeNull();
    });
  });

  describe('cálculo de código de comunidad', () => {
    it('debe calcular código de comunidad desde ciudad conocida', () => {
      const html = `
        <html>
          <head><title>Piso en Madrid</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 150000,
                      "size": 80,
                      "rooms": 3,
                      "bathrooms": 2,
                      "municipality": "Madrid"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.ciudad).toBe('Madrid');
      expect(result.codigoComunidadAutonoma).toBe(13);
    });

    it('debe calcular código de comunidad para Barcelona', () => {
      const html = `
        <html>
          <head><title>Piso en Barcelona</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "detail": {
                      "price": 200000,
                      "size": 90,
                      "rooms": 4,
                      "bathrooms": 2,
                      "municipality": "Barcelona"
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      const result = extractIdealistaV1(html);

      expect(result.ciudad).toBe('Barcelona');
      expect(result.codigoComunidadAutonoma).toBe(9); // Cataluña
    });
  });

  describe('bloque details-property_features (featuresText)', () => {
    it('debe devolver featuresText null cuando no hay bloque details-property_features', () => {
      const html = `
        <html>
          <head><title>Piso en Madrid</title></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {"props":{"pageProps":{"detail":{"price":150000,"size":80,"rooms":3,"bathrooms":2,"municipality":"Madrid"}}}}
            </script>
          </body>
        </html>
      `;
      const result = extractIdealistaV1(html);
      expect(result.featuresText).toBeNull();
    });

    it('debe extraer y limpiar featuresText sin HTML', () => {
      const html = `
        <html>
          <head><title>Chalet en Dénia</title></head>
          <body>
            <div class="details-property_features">
              <ul><li>Casa o chalet</li><li>266 m² construidos</li><li>5 habitaciones</li><li>4 baños</li><li>Segunda mano/buen estado</li></ul>
            </div>
          </body>
        </html>
      `;
      const result = extractIdealistaV1(html);
      expect(result.featuresText).toBeTruthy();
      expect(result.featuresText).not.toMatch(/<[^>]+>/);
      expect(result.featuresText).toMatch(/habitaciones/);
      expect(result.featuresText).toMatch(/266/);
    });
  });
});
