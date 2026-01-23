import 'dotenv/config';
import Fastify from 'fastify';
import { Decimal } from 'decimal.js';
import {
  calcularRentabilidad,
  type MotorInput,
  type MotorOutput,
} from 'rentabilidad-alquiler-engine';
import { registrarRutasRentabilidad } from './routes/rentabilidad';

const server = Fastify({
  logger: true,
});

// Endpoint de healthcheck
server.get('/health', async () => {
  return { status: 'ok' };
});

// Endpoint temporal para probar integración con el motor
server.get('/test-motor', async () => {
  const input: MotorInput = {
    precioCompra: new Decimal('150000'),
    comunidadAutonoma: 'Comunidad de Madrid',
    alquilerMensual: new Decimal('800'),
  };

  const resultado: MotorOutput = calcularRentabilidad(input);

  // Devolvemos una versión serializada (string) de algunos campos
  return {
    totalCompra: resultado.totalCompra.toString(),
    ingresosAnuales: resultado.ingresosAnuales.toString(),
    rentabilidadBruta: resultado.rentabilidadBruta.toString(),
    rentabilidadNeta: resultado.rentabilidadNeta.toString(),
  };
});

// Registrar rutas de rentabilidad
registrarRutasRentabilidad(server);

// Iniciar el servidor
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Servidor API corriendo en http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
