import { z } from 'zod';
import { Decimal } from 'decimal.js';

/**
 * Schema Zod para validar el input del motor de rentabilidad.
 * 
 * Refleja exactamente la estructura de MotorInput del motor.
 * Los valores monetarios se validan como number o string y luego
 * se convierten a Decimal para el motor.
 * 
 * Este schema se usa tanto para validación manual como para
 * validación automática en Fastify mediante el compilador de validación.
 */

/**
 * Schema base para valores monetarios.
 * 
 * Acepta number positivo o string convertible a número (>= 0)
 * y los transforma a Decimal para el motor.
 */
const decimalSchema = z.union([
  z.number().positive(),
  z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
  }, { message: 'Debe ser un número válido' }),
]).transform((val) => new Decimal(val));

/**
 * Schema para comunidad autónoma.
 * 
 * Debe ser un string no vacío.
 */
const comunidadAutonomaSchema = z.string().min(1, 'La comunidad autónoma es obligatoria');

/**
 * Schema para valores booleanos opcionales.
 */
const booleanSchema = z.boolean().optional();

/**
 * Schema para plazo de hipoteca (años).
 * 
 * Debe ser un número entero positivo.
 */
const plazoHipotecaSchema = z.number().int().positive().optional();

/**
 * Schema completo para el input del motor de rentabilidad.
 * 
 * Valida todos los campos del MotorInput, incluyendo obligatorios y opcionales.
 * Los valores monetarios se transforman automáticamente a Decimal.
 */
export const motorInputSchema = z.object({
  // Campos obligatorios
  precioCompra: decimalSchema,
  comunidadAutonoma: comunidadAutonomaSchema,
  alquilerMensual: decimalSchema,

  // Campos opcionales de compra
  notaria: decimalSchema.optional(),
  registro: decimalSchema.optional(),
  comisionInmobiliaria: decimalSchema.optional(),
  otrosGastosCompra: decimalSchema.optional(),
  reforma: decimalSchema.optional(),
  tasacion: decimalSchema.optional(),
  gestoriaBanco: decimalSchema.optional(),
  seguroVidaHipoteca: decimalSchema.optional(),

  // Gastos anuales opcionales
  comunidadAnual: decimalSchema.optional(),
  ibi: decimalSchema.optional(),
  seguroHogar: decimalSchema.optional(),
  seguroImpago: decimalSchema.optional(),
  basura: decimalSchema.optional(),
  agua: decimalSchema.optional(),
  electricidad: decimalSchema.optional(),
  gas: decimalSchema.optional(),
  internet: decimalSchema.optional(),

  // Inputs de financiación opcionales
  hayHipoteca: booleanSchema,
  importeHipoteca: decimalSchema.optional(),
  tipoInteres: decimalSchema.optional(),
  plazoHipoteca: plazoHipotecaSchema,
});
