import { type MotorOutput } from 'rentabilidad-alquiler-engine';

/**
 * Serializa un MotorOutput a JSON.
 * Convierte todos los Decimal a string para que sean serializables en JSON.
 * 
 * @param output - Resultado del motor financiero
 * @returns Objeto JSON serializable con todos los campos como string
 */
export function serializarMotorOutput(output: MotorOutput) {
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
