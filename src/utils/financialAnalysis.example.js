/**
 * EJEMPLOS DE USO DEL MÓDULO DE ANÁLISIS FINANCIERO
 *
 * Este archivo muestra cómo usar las funciones del módulo
 * financialAnalysis.js en diferentes escenarios
 */

import { analizarDistribucionFinanciera } from './financialAnalysis';

// ============================================
// EJEMPLO 1: Análisis básico con distribución equilibrada
// ============================================

console.log('=== EJEMPLO 1: Distribución equilibrada ===\n');

const ejemplo1 = analizarDistribucionFinanciera(2000, [
  { categoria: 'Alquiler', monto: 700 },
  { categoria: 'Supermercado', monto: 250 },
  { categoria: 'Transporte', monto: 50 },
  { categoria: 'Restaurantes', monto: 300 },
  { categoria: 'Ocio', monto: 200 },
  { categoria: 'Netflix', monto: 15 },
  { categoria: 'Spotify', monto: 10 },
  { categoria: 'Ahorro', monto: 400 },
]);

console.log('Resultado:', JSON.stringify(ejemplo1, null, 2));

/*
Salida esperada:
{
  "ingresosMensuales": 2000,
  "totalGastos": 1925,
  "restante": 75,
  "desglose": {
    "necesidades": {
      "total": 1000,
      "porcentaje": 50
    },
    "deseos": {
      "total": 525,
      "porcentaje": 26.25
    },
    "ahorro": {
      "total": 400,
      "porcentaje": 20
    }
  },
  "comparacion": { ... },
  "sugerencias": [
    {
      "tipo": "exito",
      "mensaje": "¡Excelente! Tu distribución..."
    }
  ],
  ...
}
*/

// ============================================
// EJEMPLO 2: Sobregasto en "deseos"
// ============================================

console.log('\n=== EJEMPLO 2: Sobregasto en deseos ===\n');

const ejemplo2 = analizarDistribucionFinanciera(2000, [
  { categoria: 'Alquiler', monto: 700 },
  { categoria: 'Supermercado', monto: 300 },
  { categoria: 'Restaurantes', monto: 400 },
  { categoria: 'Ropa', monto: 350 },
  { categoria: 'Viajes', monto: 200 },
  { categoria: 'Ocio', monto: 150 },
  { categoria: 'Ahorro', monto: 100 },
]);

console.log('Sugerencias:', ejemplo2.sugerencias);

/*
Salida esperada:
[
  {
    "tipo": "advertencia",
    "categoria": "deseos",
    "mensaje": "Gastas 55% en deseos, superando el 30% recomendado.",
    "accion": "Reducir 500€ en ocio/entretenimiento..."
  },
  {
    "tipo": "critico",
    "categoria": "ahorro",
    "mensaje": "Solo ahorras el 5% de tus ingresos...",
    "accion": "Intenta destinar 300€ más al ahorro..."
  }
]
*/

// ============================================
// EJEMPLO 3: Modelo personalizado (60/20/20)
// ============================================

console.log('\n=== EJEMPLO 3: Modelo personalizado ===\n');

const ejemplo3 = analizarDistribucionFinanciera(
  3000,
  [
    { categoria: 'Hipoteca', monto: 1200 },
    { categoria: 'Alimentación', monto: 500 },
    { categoria: 'Seguro', monto: 100 },
    { categoria: 'Ocio', monto: 400 },
    { categoria: 'Ahorro', monto: 600 },
  ],
  {
    modeloPersonalizado: {
      necesidades: 60,
      deseos: 20,
      ahorro: 20,
    },
  }
);

console.log('Comparación con modelo 60/20/20:', ejemplo3.comparacion);

// ============================================
// EJEMPLO 4: Con predicción mensual
// ============================================

console.log('\n=== EJEMPLO 4: Predicción a mitad de mes ===\n');

const ejemplo4 = analizarDistribucionFinanciera(
  2500,
  [
    { categoria: 'Alquiler', monto: 800 },
    { categoria: 'Supermercado', monto: 200 },
    { categoria: 'Transporte', monto: 50 },
    { categoria: 'Restaurantes', monto: 150 },
  ],
  {
    diaActual: 15,
    diasEnMes: 30,
  }
);

console.log('Predicción:', ejemplo4.prediccion);

/*
Salida esperada:
{
  "totalActual": 1200,
  "gastoProyectado": 2400,
  "promedioDiario": 80,
  "diasRestantes": 15,
  "mensaje": "Si mantienes este ritmo, gastarás aproximadamente 2400€ este mes"
}
*/

// ============================================
// EJEMPLO 5: Detección de sobregasto crítico
// ============================================

console.log('\n=== EJEMPLO 5: Sobregasto crítico ===\n');

const ejemplo5 = analizarDistribucionFinanciera(1500, [
  { categoria: 'Alquiler', monto: 900 },
  { categoria: 'Supermercado', monto: 400 },
  { categoria: 'Transporte', monto: 200 },
  { categoria: 'Ocio', monto: 300 },
]);

console.log('Sobregasto:', ejemplo5.sobregasto);
console.log('Sugerencias:', ejemplo5.sugerencias);

/*
Salida esperada:
{
  "haySobregasto": true,
  "totalGastado": 1800,
  "restante": -300,
  "porcentajeGastado": 120,
  "alerta": "critico"
}
*/

// ============================================
// EJEMPLO 6: Integración con datos reales del tracker
// ============================================

console.log('\n=== EJEMPLO 6: Integración con expense tracker ===\n');

// Simular datos del tracker
const ingresoBase = 2000;
const ingresosExtra = [
  { concepto: 'Freelance', cantidad: 500 },
  { concepto: 'Bonus', cantidad: 200 },
];

const gastosVariables = [
  { concepto: 'Mercadona', categoria: 'Supermercado', cantidad: 85 },
  { concepto: 'Repsol', categoria: 'Combustible', cantidad: 60 },
  { concepto: 'Cine', categoria: 'Ocio', cantidad: 25 },
];

const gastosFijos = [
  { nombre: 'Alquiler', categoria: 'Vivienda', cantidad: 750, estado: 'activo' },
  { nombre: 'Netflix', categoria: 'Streaming', cantidad: 12, estado: 'activo' },
  { nombre: 'Gimnasio', categoria: 'Gimnasio', cantidad: 35, estado: 'pausado' }, // No se cuenta
];

// Calcular ingresos totales
const ingresosTotales = ingresoBase + ingresosExtra.reduce((sum, i) => sum + i.cantidad, 0);

// Preparar gastos para el análisis
const gastosParaAnalisis = [
  ...gastosVariables.map((g) => ({ categoria: g.categoria, monto: g.cantidad })),
  ...gastosFijos
    .filter((g) => g.estado === 'activo')
    .map((g) => ({ categoria: g.categoria, monto: g.cantidad })),
];

const analisisReal = analizarDistribucionFinanciera(ingresosTotales, gastosParaAnalisis);

console.log('Análisis de datos reales:');
console.log('- Ingresos totales:', analisisReal.ingresosMensuales, '€');
console.log('- Total gastado:', analisisReal.totalGastos, '€');
console.log('- Restante:', analisisReal.restante, '€');
console.log('\nDesglose:');
console.log('  Necesidades:', analisisReal.desglose.necesidades.porcentaje.toFixed(1), '%');
console.log('  Deseos:', analisisReal.desglose.deseos.porcentaje.toFixed(1), '%');
console.log('  Ahorro:', analisisReal.desglose.ahorro.porcentaje.toFixed(1), '%');
console.log('\nPrimera sugerencia:', analisisReal.sugerencias[0].mensaje);

export {
  ejemplo1,
  ejemplo2,
  ejemplo3,
  ejemplo4,
  ejemplo5,
  analisisReal,
};
