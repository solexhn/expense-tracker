// date-fns 'format' removed (not used currently)

// Filtrar por mes (formato: "2024-11")
const filtrarPorMes = (items, mes) => {
  return items.filter(item => {
    if (!item.fecha) return false;
    return item.fecha.startsWith(mes);
  });
};

// ============ GASTOS FIJOS ============

export const calcularTotalGastosFijos = (gastosFijos) => {
  return gastosFijos
    .filter(g => g.estado === 'activo')
    .reduce((total, gasto) => total + parseFloat(gasto.cantidad), 0);
};

// ============ GASTOS VARIABLES ============

export const calcularTotalGastosVariables = (gastosVariables, mes) => {
  const gastosMes = filtrarPorMes(gastosVariables, mes);
  return gastosMes.reduce((total, gasto) => total + parseFloat(gasto.cantidad), 0);
};

// ============ INGRESOS ============

export const calcularTotalIngresos = (ingresos, mes) => {
  const ingresosMes = filtrarPorMes(ingresos, mes);
  return ingresosMes.reduce((total, ingreso) => total + parseFloat(ingreso.cantidad), 0);
};

// ============ SALDO ============

export const calcularSaldoRestante = (config, gastosFijos, gastosVariables, ingresos) => {
  const { incomeBase, mesActual } = config;
  
  const totalIngresos = parseFloat(incomeBase) + calcularTotalIngresos(ingresos, mesActual);
  const totalGastosFijos = calcularTotalGastosFijos(gastosFijos);
  const totalGastosVariables = calcularTotalGastosVariables(gastosVariables, mesActual);
  
  return totalIngresos - totalGastosFijos - totalGastosVariables;
};

// ============ RESUMEN DEL MES ============

export const obtenerResumenMes = (config, gastosFijos, gastosVariables, ingresos) => {
  const { incomeBase, mesActual } = config;
  
  const totalIngresos = parseFloat(incomeBase) + calcularTotalIngresos(ingresos, mesActual);
  const totalGastosFijos = calcularTotalGastosFijos(gastosFijos);
  const totalGastosVariables = calcularTotalGastosVariables(gastosVariables, mesActual);
  const saldoRestante = totalIngresos - totalGastosFijos - totalGastosVariables;
  
  return {
    totalIngresos,
    totalGastosFijos,
    totalGastosVariables,
    totalGastos: totalGastosFijos + totalGastosVariables,
    saldoRestante
  };
};

// ============ FORMATO DE MONEDA ============

export const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(cantidad);
};

// ============ UTILIDADES DE FECHA ============

/**
 * Devuelve el día real de cobro para un gasto fijo teniendo en cuenta
 * que si un gasto está configurado para el día 31 y el mes tiene menos
 * días, se cobrará el último día del mes.
 *
 * @param {number} diaDelMes - 1..31
 * @param {number} año - año en número entero (ej: 2025)
 * @param {number} mesIndex - índice del mes 1..12
 * @returns {number} día real (ej: 28, 30, 31)
 */
export const calcularDiaRealCobro = (diaDelMes, año, mesIndex) => {
  // mesIndex esperado 1..12. Para new Date necesitamos mesIndex en base 1 -> new Date(año, mesIndex, 0)
  const ultimoDiaDelMes = new Date(año, mesIndex, 0).getDate();
  return Math.min(diaDelMes, ultimoDiaDelMes);
};