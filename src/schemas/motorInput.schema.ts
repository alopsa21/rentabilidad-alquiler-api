import { z } from 'zod';
import { Decimal } from 'decimal.js';

/**
 * Schema Zod para validar el input del motor de rentabilidad.
 * 
 * Refleja exactamente la estructura de MotorInput del motor.
 * Los valores monetarios se validan como number o string y luego
 * se convierten a Decimal para el motor.
 */

// Schema base para valores monetarios (acepta number o string)
const decimalSchema = z.union([
  z.number().positive(),
  z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
  }, { message: 'Debe ser un número válido' }),
]).transform((val) => new Decimal(val));

// Schema para comunidad autónoma (string)
const comunidadAutonomaSchema = z.string().min(1, 'La comunidad autónoma es obligatoria');

// Schema para valores booleanos
const booleanSchema = z.boolean().optional();

// Schema para número entero positivo (años)
const plazoHipotecaSchema = z.number().int().positive().optional();

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
