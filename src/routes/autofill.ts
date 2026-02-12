import { FastifyInstance, FastifyRequest } from 'fastify';
import { autofillFromUrl } from '../autofill/autofillFromUrl';
import { extractIdealistaV1 } from '../extractors/idealistaV1';
import { z } from 'zod';

/**
 * Schema de validación para el body del endpoint /autofill (por URL)
 */
const autofillRequestSchema = z.object({
  url: z.string().url('La URL debe ser válida'),
  cookies: z.string().optional(),
});

/**
 * Schema para el endpoint /autofill/from-html (HTML obtenido localmente para testing)
 */
const autofillFromHtmlSchema = z.object({
  url: z.string().url('La URL debe ser válida'),
  html: z.string().min(1, 'El HTML no puede estar vacío'),
});

interface AutofillRequest {
  Body: z.infer<typeof autofillRequestSchema>;
}

interface AutofillFromHtmlRequest {
  Body: z.infer<typeof autofillFromHtmlSchema>;
}

/**
 * Handler para el endpoint POST /autofill.
 * Acepta cookies opcionales para Idealista (si el usuario las pasa desde el navegador).
 */
async function autofillHandler(
  request: FastifyRequest<AutofillRequest>
) {
  const { url, cookies } = request.body;
  const result = await autofillFromUrl(url, cookies);
  return result;
}

/**
 * Handler para POST /autofill/from-html.
 * Extrae datos desde HTML ya obtenido (útil para testing con archivos HTML locales).
 */
async function autofillFromHtmlHandler(
  request: FastifyRequest<AutofillFromHtmlRequest>
) {
  const { url, html } = request.body;
  if (url.includes('idealista.com')) {
    return extractIdealistaV1(html);
  }
  return {
    buyPrice: null,
    sqm: null,
    rooms: null,
    banos: null,
    ciudad: null,
    codigoComunidadAutonoma: null,
    alquilerMensual: null,
    source: 'idealista:v1' as const,
  };
}

/**
 * Registra las rutas de autofill en el servidor Fastify.
 */
export function registrarRutasAutofill(server: FastifyInstance): void {
  server.post(
    '/autofill',
    {
      schema: {
        body: autofillRequestSchema,
      },
    },
    autofillHandler
  );

  server.post(
    '/autofill/from-html',
    {
      schema: {
        body: autofillFromHtmlSchema,
      },
    },
    autofillFromHtmlHandler
  );
}
