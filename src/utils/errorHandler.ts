import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

/**
 * Tipos de errores que puede lanzar la API
 */
export interface ErrorValidacion {
  status: 'error-validacion';
  message: string;
  errores?: unknown[];
}

export interface ErrorInterno {
  status: 'error-interno';
  message: string;
}

export type ApiError = ErrorValidacion | ErrorInterno;

/**
 * Determina si un error es de validación Zod
 */
export function esErrorZod(error: unknown): error is ZodError {
  return error instanceof Error && 'issues' in error;
}

/**
 * Determina si un error es del motor (comunidad no válida, etc.)
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
 * Crea una respuesta de error de validación
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
 * Crea una respuesta de error interno
 */
export function crearErrorInterno(message: string): ErrorInterno {
  return {
    status: 'error-interno',
    message,
  };
}

/**
 * Error handler centralizado de Fastify
 * Maneja todos los errores que ocurren en las rutas
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log del error para debugging
  request.log.error(error);

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
