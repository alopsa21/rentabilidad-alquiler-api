/**
 * Configuración centralizada de la aplicación.
 * 
 * Valida y tipa todas las variables de entorno necesarias.
 * Lanza error al inicio si faltan variables requeridas.
 */

/**
 * Configuración de la aplicación
 */
export interface AppConfig {
  /** Puerto en el que escucha el servidor */
  port: number;
  /** Host en el que escucha el servidor */
  host: string;
  /** Entorno de ejecución */
  env: 'development' | 'production' | 'test';
  /** Nivel de logging */
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

/**
 * Carga y valida la configuración desde variables de entorno.
 * 
 * @returns Configuración validada y tipada
 * @throws Error si faltan variables requeridas o son inválidas
 */
export function cargarConfiguracion(): AppConfig {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const env = (process.env.NODE_ENV || 'development') as AppConfig['env'];
  const logLevel = (process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug')) as AppConfig['logLevel'];

  // Validar puerto
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`PORT debe ser un número entre 1 y 65535, recibido: ${process.env.PORT}`);
  }

  // Validar nivel de log
  const nivelesValidos: AppConfig['logLevel'][] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  if (!nivelesValidos.includes(logLevel)) {
    throw new Error(`LOG_LEVEL debe ser uno de: ${nivelesValidos.join(', ')}, recibido: ${logLevel}`);
  }

  return {
    port,
    host,
    env,
    logLevel,
  };
}

/**
 * Configuración singleton (se carga una vez al importar)
 */
export const config = cargarConfiguracion();
