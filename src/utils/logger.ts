import pino from 'pino';
import { config } from '../config';

/**
 * Logger estructurado de la aplicación.
 * 
 * Usa pino para logging estructurado en formato JSON.
 * En desarrollo, usa pino-pretty para formato legible.
 */
export const logger = pino({
  level: config.logLevel,
  transport: config.env === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * Crea un logger con contexto adicional.
 * 
 * @param context - Contexto adicional para los logs (ej: { requestId: 'abc123' })
 * @returns Logger con contexto
 * 
 * @example
 * ```ts
 * const requestLogger = loggerConContexto({ requestId: 'req-123' });
 * requestLogger.info('Procesando request');
 * // Log: { level: 30, msg: 'Procesando request', requestId: 'req-123' }
 * ```
 */
export function loggerConContexto(context: Record<string, unknown>) {
  return logger.child(context);
}
