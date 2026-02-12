import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { crearServidor } from '../src/server';
import type { FastifyInstance } from 'fastify';

describe('POST /rentabilidad', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await crearServidor();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Request válida', () => {
    it('debe devolver status 200 con resultado completo', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rentabilidad',
        payload: {
          precioCompra: 150000,
          codigoComunidadAutonoma: 13, // Comunidad de Madrid
          alquilerMensual: 800,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);

      const body = JSON.parse(response.body);

      // Validar que existen los campos clave del MotorOutput
      expect(body).toHaveProperty('totalCompra');
      expect(body).toHaveProperty('capitalPropio');
      expect(body).toHaveProperty('ingresosAnuales');
      expect(body).toHaveProperty('gastosAnuales');
      expect(body).toHaveProperty('beneficioAntesImpuestos');
      expect(body).toHaveProperty('cashflowAntesAmortizar');
      expect(body).toHaveProperty('cashflowFinal');
      expect(body).toHaveProperty('rentabilidadBruta');
      expect(body).toHaveProperty('rentabilidadNeta');
      expect(body).toHaveProperty('roceAntes');
      expect(body).toHaveProperty('roceFinal');

      // Validar que los campos son strings (Decimal serializado)
      expect(typeof body.totalCompra).toBe('string');
      expect(typeof body.cashflowFinal).toBe('string');
      expect(typeof body.rentabilidadBruta).toBe('string');

      // Validar que los valores son numéricos válidos
      expect(Number(body.totalCompra)).toBeGreaterThan(0);
      expect(Number(body.rentabilidadBruta)).toBeGreaterThan(0);
    });

    it('debe funcionar con request que incluye hipoteca', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rentabilidad',
        payload: {
          precioCompra: 200000,
          codigoComunidadAutonoma: 9, // Cataluña
          alquilerMensual: 1000,
          hayHipoteca: true,
          importeHipoteca: 150000,
          tipoInteres: 2.5,
          plazoHipoteca: 30,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);

      // Validar campos clave
      expect(body).toHaveProperty('totalCompra');
      expect(body).toHaveProperty('cashflowFinal');
      expect(body).toHaveProperty('rentabilidadBruta');

      // Con hipoteca, el capital propio debe ser menor que el total de compra
      const totalCompra = Number(body.totalCompra);
      const capitalPropio = Number(body.capitalPropio);
      expect(capitalPropio).toBeLessThan(totalCompra);
    });

    it('debe aceptar valores monetarios como string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rentabilidad',
        payload: {
          precioCompra: '150000',
          codigoComunidadAutonoma: 13, // Comunidad de Madrid
          alquilerMensual: '800',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('totalCompra');
      expect(Number(body.totalCompra)).toBeGreaterThan(0);
    });
  });

  describe('Request inválida', () => {
    it('debe devolver status 400 cuando faltan campos obligatorios', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rentabilidad',
        payload: {
          precioCompra: 150000,
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'error-validacion');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('errores');
      expect(Array.isArray(body.errores)).toBe(true);
    });

    it('debe devolver status 400 cuando precioCompra no es válido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rentabilidad',
        payload: {
          precioCompra: 'invalid',
          codigoComunidadAutonoma: 13, // Comunidad de Madrid
          alquilerMensual: 800,
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'error-validacion');
    });

    it('debe devolver status 400 cuando la comunidad autónoma no es válida', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rentabilidad',
        payload: {
          precioCompra: 150000,
          codigoComunidadAutonoma: 99, // Código inválido (fuera del rango 1-19)
          alquilerMensual: 800,
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'error-validacion');
      // Verificar que hay un error relacionado con codigoComunidadAutonoma en el array de errores
      expect(body.errores).toBeDefined();
      expect(Array.isArray(body.errores)).toBe(true);
      const errorCodigo = body.errores.find((e: any) => 
        e.instancePath === 'codigoComunidadAutonoma' || 
        e.path?.includes('codigoComunidadAutonoma')
      );
      expect(errorCodigo).toBeDefined();
    });

    it('debe devolver status 400 cuando el body está vacío', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/rentabilidad',
        payload: {},
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'error-validacion');
    });
  });
});
