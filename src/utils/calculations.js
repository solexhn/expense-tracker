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

// ============ SISTEMA DE FONDOS ============

/**
 * Resumen basado en fondo (alternativa al modelo mensual)
 * Usado para el modelo de fondo continuo
 */
export const obtenerResumenFondo = (config, gastosFijos) => {
  const fondoDisponible = parseFloat(config.fondoDisponible || 0);
  const totalGastosFijos = calcularTotalGastosFijos(gastosFijos);

  return {
    fondoDisponible,
    totalGastosFijos,
    disponibleDespuesDeGastosFijos: fondoDisponible - totalGastosFijos,
    ultimaNomina: config.ultimaNomina || null,
    mesReferencia: config.mesReferencia || config.mesActual
  };
};

/**
 * Calcula el total de gastos variables que fueron deducidos del fondo
 */
export const calcularTotalGastosVariablesDeducidos = (gastosVariables) => {
  return gastosVariables
    .filter(g => g.deductedFromFund === true)
    .reduce((total, gasto) => total + parseFloat(gasto.cantidad), 0);
};

/**
 * Calcula el total de nóminas registradas en el historial
 */
export const calcularTotalNominasRegistradas = (config) => {
  const historial = config.historialNominas || [];
  return historial.reduce((total, nomina) => total + parseFloat(nomina.cantidad), 0);
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

// ============ SELECCIÓN INTELIGENTE DE MES ============

/**
 * Detecta automáticamente el mejor mes para mostrar basándose en:
 * 1. Si hay datos del mes actual -> mes actual
 * 2. Si NO hay datos del mes actual -> mes más reciente con datos
 * 3. Si NO hay datos -> mes actual
 *
 * @param {Array} gastosVariables - todos los gastos variables
 * @param {Array} ingresos - todos los ingresos
 * @returns {string} mes en formato YYYY-MM
 */
export const detectarMejorMes = (gastosVariables, ingresos) => {
  const mesActual = new Date().toISOString().slice(0, 7);

  // Recolectar todos los meses con datos
  const fechas = new Set();

  gastosVariables.forEach(g => {
    if (g.fecha) {
      fechas.add(g.fecha.substring(0, 7));
    }
  });

  ingresos.forEach(i => {
    if (i.fecha) {
      fechas.add(i.fecha.substring(0, 7));
    }
  });

  // Si no hay datos, devolver mes actual
  if (fechas.size === 0) {
    return mesActual;
  }

  // Si hay datos del mes actual, devolver mes actual
  if (fechas.has(mesActual)) {
    return mesActual;
  }

  // Si NO hay datos del mes actual, devolver el mes más reciente
  const mesesOrdenados = Array.from(fechas).sort((a, b) => b.localeCompare(a));
  return mesesOrdenados[0];
};