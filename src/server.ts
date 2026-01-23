import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import { registrarRutasRentabilidad } from './routes/rentabilidad';
import { errorHandler } from './utils/errorHandler';
import { crearCompiladorZod } from './utils/validator';
import { logger } from './utils/logger';
import { config } from './config';

/**
 * Crea y configura el servidor Fastify.
 * No arranca el servidor, solo lo configura.
 * 
 * Útil para tests donde queremos inyectar el servidor sin arrancarlo.
 * 
 * @returns Instancia configurada de Fastify
 */
export function crearServidor(): FastifyInstance {
  const server = Fastify({
    logger: config.env === 'test' ? false : (logger as any), // Desactivar logger en tests
  });

  // Configurar compilador de validación Zod
  server.setValidatorCompiler(crearCompiladorZod());

  // Error handler centralizado
  server.setErrorHandler(errorHandler);

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
 * 
 * @throws Error si el servidor no puede arrancar
 */
export async function arrancarServidor(): Promise<void> {
  const server = crearServidor();

  try {
    await server.listen({ 
      port: config.port, 
      host: config.host 
    });
    
    logger.info({
      port: config.port,
      host: config.host,
      env: config.env,
    }, '🚀 Servidor API iniciado correctamente');
  } catch (err) {
    logger.fatal({ err }, 'Error al arrancar el servidor');
    process.exit(1);
  }
}
