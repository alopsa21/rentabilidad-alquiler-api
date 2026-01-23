import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import { registrarRutasRentabilidad } from './routes/rentabilidad';

/**
 * Crea y configura el servidor Fastify.
 * No arranca el servidor, solo lo configura.
 * 
 * Útil para tests donde queremos inyectar el servidor sin arrancarlo.
 */
export function crearServidor(): FastifyInstance {
  const server = Fastify({
    logger: false, // Desactivar logger en tests
  });

  // Endpoint de healthcheck
  server.get('/health', async () => {
    return { status: 'ok' };
  });

  // Registrar rutas de rentabilidad
  registrarRutasRentabilidad(server);

  return server;
}

/**
 * Arranca el servidor en modo producción.
 * Solo se debe llamar cuando se ejecuta el servidor directamente.
 */
export async function arrancarServidor() {
  const server = crearServidor();

  // Configurar logger para producción
  server.log = {
    ...server.log,
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log,
    fatal: console.error,
    trace: console.log,
  };

  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Servidor API corriendo en http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
