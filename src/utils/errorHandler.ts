import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger';

/**
 * Respuesta de error de validación.
 * 
 * Se devuelve cuando el request no cumple con el schema esperado.
 */
export interface ErrorValidacion {
  /** Tipo de error */
  status: 'error-validacion';
  /** Mensaje descriptivo del error */
  message: string;
  /** Detalles de los errores de validación (opcional) */
  errores?: unknown[];
}

/**
 * Respuesta de error interno del servidor.
 * 
 * Se devuelve cuando ocurre un error inesperado en el procesamiento.
 */
export interface ErrorInterno {
  /** Tipo de error */
  status: 'error-interno';
  /** Mensaje descriptivo del error */
  message: string;
}

/**
 * Tipo unión de todos los errores posibles de la API.
 */
export type ApiError = ErrorValidacion | ErrorInterno;

/**
 * Determina si un error es de validación Zod.
 * 
 * @param error - Error a verificar
 * @returns true si es un ZodError
 */
export function esErrorZod(error: unknown): error is ZodError {
  return error instanceof Error && 'issues' in error;
}

/**
 * Determina si un error proviene del motor (comunidad no válida, etc.).
 * 
 * @param error - Error a verificar
 * @returns true si es un error del motor
 */
export function esErrorMotor(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('comunidad autónoma no soportada') ||
    errorMessage.includes('comunidad autonoma')
  );
}

/**
 * Crea una respuesta de error de validación.
 * 
 * @param message - Mensaje descriptivo del error
 * @param errores - Detalles opcionales de los errores
 * @returns Objeto de error de validación
 */
export function crearErrorValidacion(
  message: string,
  errores?: unknown[]
): ErrorValidacion {
  return {
    status: 'error-validacion',
    message,
    ...(errores && { errores }),
  };
}

/**
 * Crea una respuesta de error interno.
 * 
 * @param message - Mensaje descriptivo del error
 * @returns Objeto de error interno
 */
export function crearErrorInterno(message: string): ErrorInterno {
  return {
    status: 'error-interno',
    message,
  };
}

/**
 * Error handler centralizado de Fastify.
 * 
 * Maneja todos los errores que ocurren en las rutas y devuelve
 * respuestas HTTP apropiadas según el tipo de error.
 * 
 * @param error - Error capturado por Fastify
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify para enviar la respuesta
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log del error para debugging
  logger.error({
    err: error,
    url: request.url,
    method: request.method,
  }, 'Error en request');

  // Error de validación de Fastify (FST_ERR_VALIDATION)
  if (error.validation || error.code === 'FST_ERR_VALIDATION') {
    let errores: unknown[] | undefined;
    
    // Intentar parsear el mensaje como JSON si contiene errores de validación
    try {
      const parsed = JSON.parse(error.message);
      if (Array.isArray(parsed)) {
        errores = parsed;
      }
    } catch {
      // Si no es JSON, usar el mensaje tal cual
    }

    reply.code(400).send(crearErrorValidacion(
      'El body del request no es válido',
      errores || error.validation
    ));
    return;
  }

  // Error de validación Zod (puede venir como error original)
  const errorOriginal = error.cause || error;
  if (esErrorZod(errorOriginal)) {
    reply.code(400).send(crearErrorValidacion(
      'El body del request no es válido',
      errorOriginal.issues
    ));
    return;
  }

  // Error del motor (comunidad no válida, etc.)
  if (esErrorMotor(errorOriginal) || esErrorMotor(error)) {
    const errorMessage = errorOriginal instanceof Error 
      ? errorOriginal.message 
      : error.message;
    reply.code(400).send(crearErrorValidacion(errorMessage));
    return;
  }

  // Error interno (del motor u otro)
  reply.code(500).send(crearErrorInterno(
    'Error interno del servidor al calcular la rentabilidad'
  ));
}
