import { FastifyInstance, FastifyRequest } from 'fastify';
import { calcularRentabilidad, type MotorInput } from 'rentabilidad-alquiler-engine';
import { motorInputSchema } from '../schemas/motorInput.schema';
import { serializarMotorOutput } from '../services/serializacion';

/**
 * Request body tipado para el endpoint de rentabilidad.
 * 
 * Fastify valida automáticamente el body usando el schema Zod.
 */
interface RentabilidadRequest {
  Body: MotorInput;
}

/**
 * Handler para el endpoint POST /rentabilidad.
 * 
 * Calcula la rentabilidad de una inversión inmobiliaria usando el motor financiero.
 * 
 * @param request - Request de Fastify con body validado automáticamente
 * @returns Resultado del cálculo serializado (Decimal → string)
 * 
 * @example
 * ```ts
 * POST /rentabilidad
 * {
 *   "precioCompra": 150000,
 *   "comunidadAutonoma": "Comunidad de Madrid",
 *   "alquilerMensual": 800
 * }
 * ```
 */
async function calcularRentabilidadHandler(
  request: FastifyRequest<RentabilidadRequest>
) {
  // El body ya está validado por Fastify usando el schema Zod
  const inputValidado = request.body;

  // Llamar al motor financiero
  const resultado = calcularRentabilidad(inputValidado);

  // Serializar el resultado (Decimal → string) y devolver
  return serializarMotorOutput(resultado);
}

/**
 * Registra las rutas de rentabilidad en el servidor Fastify.
 * 
 * Configura la validación automática del body usando el schema Zod
 * a través del compilador de validación de Fastify.
 * 
 * @param server - Instancia de Fastify donde registrar las rutas
 */
export function registrarRutasRentabilidad(server: FastifyInstance): void {
  server.post(
    '/rentabilidad',
    {
      schema: {
        body: motorInputSchema,
      },
    },
    calcularRentabilidadHandler
  );
}
