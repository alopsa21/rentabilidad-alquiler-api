import { FastifySchemaCompiler } from 'fastify';
import { ZodError, ZodSchema } from 'zod';

/**
 * Error de validación de schema compatible con Fastify.
 */
interface SchemaValidationError {
  keyword: string;
  instancePath: string;
  schemaPath: string;
  params: Record<string, unknown>;
  message: string;
}

/**
 * Compilador de validación para Fastify que integra Zod.
 * 
 * Permite usar schemas Zod directamente en las rutas de Fastify
 * mediante la propiedad `schema` en la definición de rutas.
 * 
 * @example
 * ```ts
 * server.post('/rentabilidad', {
 *   schema: {
 *     body: motorInputSchema
 *   },
 *   handler: async (request) => { ... }
 * });
 * ```
 */
export function crearCompiladorZod(): FastifySchemaCompiler<ZodSchema> {
  return ({ schema }) => {
    return (data: unknown) => {
      try {
        const parsed = schema.parse(data);
        return { value: parsed };
      } catch (error) {
        if (error instanceof ZodError) {
          const validationErrors: SchemaValidationError[] = error.issues.map((issue) => ({
            keyword: issue.code,
            instancePath: issue.path.join('/'),
            schemaPath: `#/${issue.path.join('/')}`,
            params: {
              ...issue,
            },
            message: issue.message,
          }));

          return {
            error: new Error(JSON.stringify(validationErrors)),
          };
        }
        throw error;
      }
    };
  };
}
