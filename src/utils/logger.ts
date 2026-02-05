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
