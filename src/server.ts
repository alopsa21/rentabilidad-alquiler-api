import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
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
export async function crearServidor(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: config.env === 'test' ? false : (logger as any), // Desactivar logger en tests
  });

  // CORS: permitir peticiones desde el frontend (ej. http://localhost:5173)
  await server.register(cors, {
    origin: true, // en desarrollo refleja el origen de la petición; en producción conviene restringir
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
  const server = await crearServidor();

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
