import { format } from 'date-fns';

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