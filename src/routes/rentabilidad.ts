import { FastifyInstance, FastifyRequest } from 'fastify';
import { calcularRentabilidad } from 'rentabilidad-alquiler-engine';
import { motorInputSchema } from '../schemas/motorInput.schema';
import { serializarMotorOutput } from '../services/serializacion';

/**
 * Handler para el endpoint POST /rentabilidad
 */
async function calcularRentabilidadHandler(request: FastifyRequest) {
  // 1. Validar el body con el schema Zod
  const inputValidado = motorInputSchema.parse(request.body);

  // 2. Llamar al motor financiero
  const resultado = calcularRentabilidad(inputValidado);

  // 3. Serializar el resultado (Decimal → string) y devolver
  return serializarMotorOutput(resultado);
}

/**
 * Registra las rutas de rentabilidad en el servidor Fastify
 */
export function registrarRutasRentabilidad(server: FastifyInstance) {
  server.post('/rentabilidad', calcularRentabilidadHandler);
}
