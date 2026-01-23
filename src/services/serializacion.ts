import { type MotorOutput } from 'rentabilidad-alquiler-engine';

/**
 * Resultado serializado del motor financiero.
 * 
 * Todos los valores Decimal se convierten a string para ser serializables en JSON.
 */
export interface MotorOutputSerializado {
  /** Total de la compra (precio + gastos) */
  totalCompra: string;
  /** Capital propio invertido */
  capitalPropio: string;
  /** Ingresos anuales por alquiler */
  ingresosAnuales: string;
  /** Gastos anuales totales */
  gastosAnuales: string;
  /** Beneficio antes de impuestos */
  beneficioAntesImpuestos: string;
  /** Cashflow antes de amortizar hipoteca */
  cashflowAntesAmortizar: string;
  /** Cashflow final (después de amortizar) */
  cashflowFinal: string;
  /** Rentabilidad bruta (%) */
  rentabilidadBruta: string;
  /** Rentabilidad neta (%) */
  rentabilidadNeta: string;
  /** ROCE antes de amortizar (%) */
  roceAntes: string;
  /** ROCE final (%) */
  roceFinal: string;
}

/**
 * Serializa un MotorOutput a JSON.
 * 
 * Convierte todos los valores Decimal a string para que sean serializables en JSON,
 * ya que JSON no soporta tipos Decimal nativamente.
 * 
 * @param output - Resultado del motor financiero con valores Decimal
 * @returns Objeto JSON serializable con todos los campos como string
 * 
 * @example
 * ```ts
 * const resultado = calcularRentabilidad(input);
 * const serializado = serializarMotorOutput(resultado);
 * // serializado.totalCompra es un string, no un Decimal
 * ```
 */
export function serializarMotorOutput(output: MotorOutput): MotorOutputSerializado {
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
