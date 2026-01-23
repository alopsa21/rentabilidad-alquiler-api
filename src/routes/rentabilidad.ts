import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { calcularRentabilidad, type MotorOutput } from 'rentabilidad-alquiler-engine';
import { motorInputSchema } from '../schemas/motorInput.schema';

/**
 * Serializa un MotorOutput a JSON.
 * Convierte todos los Decimal a string para que sean serializables.
 */
function serializarMotorOutput(output: MotorOutput) {
  return {
    totalCompra: output.totalCompra.toString(),
    capitalPropio: output.capitalPropio.toString(),
    ingresosAnuales: output.ingresosAnuales.toString(),
    gastosAnuales: output.gastosAnuales.toString(),
    beneficioAntesImpuestos: output.beneficioAntesImpuestos.toString(),
    cashflowAntesAmortizar: output.cashflowAntesAmortizar.toString(),
    cashflowFinal: output.cashflowFinal.toString(),
    rentabilidadBruta: output.rentabilidadBruta.toString(),
    rentabilidadNeta: output.rentabilidadNeta.toString(),
    roceAntes: output.roceAntes.toString(),
    roceFinal: output.roceFinal.toString(),
  };
}

/**
 * Handler para el endpoint POST /rentabilidad
 */
async function calcularRentabilidadHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // 1. Validar el body con el schema Zod
    const inputValidado = motorInputSchema.parse(request.body);

    // 2. Llamar al motor financiero
    const resultado = calcularRentabilidad(inputValidado);

    // 3. Serializar el resultado (Decimal → string) y devolver
    return serializarMotorOutput(resultado);
  } catch (error) {
    // Manejo de errores
    if (error instanceof Error && 'issues' in error) {
      // Error de validación Zod → 400
      return reply.code(400).send({
        status: 'error-validacion',
        message: 'El body del request no es válido',
        errores: (error as any).issues,
      });
    }

    // Si el error es del motor (comunidad no válida, etc.), devolver 400
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('comunidad autónoma no soportada') || 
          errorMessage.includes('comunidad autonoma')) {
        return reply.code(400).send({
          status: 'error-validacion',
          message: error.message,
        });
      }
    }

    // Error interno (del motor u otro) → 500
    request.log.error(error);
    return reply.code(500).send({
      status: 'error-interno',
      message: 'Error interno del servidor al calcular la rentabilidad',
    });
  }
}

/**
 * Registra las rutas de rentabilidad en el servidor Fastify
 */
export function registrarRutasRentabilidad(server: FastifyInstance) {
  server.post('/rentabilidad', calcularRentabilidadHandler);
}
