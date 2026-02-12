import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { obtenerCiudadesPorCodauto } from '../data/territorioEspanol';

const ciudadesQuerySchema = z.object({
  codauto: z.coerce.number().int().min(1).max(19),
});

interface CiudadesRequest {
  Querystring: z.infer<typeof ciudadesQuerySchema>;
}

async function ciudadesHandler(request: FastifyRequest<CiudadesRequest>) {
  const { codauto } = request.query;
  return { ciudades: obtenerCiudadesPorCodauto(codauto) };
}

export function registrarRutasTerritorio(server: FastifyInstance): void {
  server.get(
    '/territorio/ciudades',
    {
      schema: {
        querystring: ciudadesQuerySchema,
      },
    },
    ciudadesHandler
  );
}

