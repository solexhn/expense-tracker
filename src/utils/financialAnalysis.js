/**
 * Módulo de Análisis Financiero Personal
 *
 * Analiza la distribución de gastos vs ingresos mensuales
 * y proporciona recomendaciones personalizadas basadas en
 * el modelo 50/30/20 (Necesidades/Deseos/Ahorro)
 */

// ============================================
// 1. CONFIGURACIÓN EDITABLE
// ============================================

/**
 * Clasificación de categorías de gastos
 * Mapea cada tipo de gasto a su clasificación financiera
 */
export const CLASIFICACION_CATEGORIAS = {
  // NECESIDADES (50%)
  necesidades: [
    'Vivienda',
    'Alquiler',
    'Hipoteca',
    'Alimentación',
    'Supermercado',
    'Transporte',
    'Combustible',
    'Seguro',
    'Salud',
    'Medicamentos',
    'Servicios',
    'Electricidad',
    'Agua',
    'Gas',
    'Internet',
    'Teléfono',
    'Educación',
    'guarderia',
    'subscripcion',
    'Impuestos',
  ],

  // DESEOS (30%)
  deseos: [
    'Ocio',
    'Entretenimiento',
    'Restaurantes',
    'Comida fuera',
    'Viajes',
    'Ropa',
    'Tecnología',
    'Hobbies',
    'Gimnasio',
    'Belleza',
    'Mascotas',
    'Regalos',
    'Streaming',
    'Netflix',
    'Spotify',
  ],

  // AHORRO (20%)
  ahorro: [
    'Ahorro',
    'Inversión',
    'Fondo de emergencia',
    'Pensión',
    'Criptomonedas',
  ],
};

/**
 * Modelo financiero recomendado (método 50/30/20)
 * Editable según preferencias del usuario
 */
export const MODELO_RECOMENDADO = {
  necesidades: 50,  // 50% de ingresos
  deseos: 30,       // 30% de ingresos
  ahorro: 20,       // 20% de ingresos
};

/**
 * Umbrales de alerta para detección de sobregasto
 */
export const UMBRALES_ALERTA = {
  critico: 10,    // Diferencia >10% es crítica
  advertencia: 5, // Diferencia >5% es advertencia
};

// ============================================
// 2. FUNCIONES DE CLASIFICACIÓN
// ============================================

/**
 * Clasifica una categoría de gasto según su tipo
 * @param {string} categoria - Nombre de la categoría
 * @returns {string} - 'necesidades', 'deseos', 'ahorro', o 'sin_clasificar'
 */
export const clasificarCategoria = (categoria) => {
  if (!categoria) return 'sin_clasificar';

  const categoriaLower = categoria.toLowerCase();

  // Buscar en necesidades
  if (
    CLASIFICACION_CATEGORIAS.necesidades.some((cat) =>
      categoriaLower.includes(cat.toLowerCase())
    )
  ) {
    return 'necesidades';
  }

  // Buscar en deseos
  if (
    CLASIFICACION_CATEGORIAS.deseos.some((cat) =>
      categoriaLower.includes(cat.toLowerCase())
    )
  ) {
    return 'deseos';
  }

  // Buscar en ahorro
  if (
    CLASIFICACION_CATEGORIAS.ahorro.some((cat) =>
      categoriaLower.includes(cat.toLowerCase())
    )
  ) {
    return 'ahorro';
  }

  // Por defecto, clasificar como "deseos" si no se encuentra
  return 'deseos';
};

// ============================================
// 3. FUNCIONES DE CÁLCULO
// ============================================

/**
 * Agrupa y suma gastos por clasificación
 * @param {Array} gastos - Array de objetos {categoria, monto}
 * @returns {Object} - {necesidades: number, deseos: number, ahorro: number}
 */
export const calcularTotalesPorClasificacion = (gastos) => {
  const totales = {
    necesidades: 0,
    deseos: 0,
    ahorro: 0,
    sin_clasificar: 0,
  };

  gastos.forEach((gasto) => {
    const clasificacion = clasificarCategoria(gasto.categoria);
    totales[clasificacion] += parseFloat(gasto.monto) || 0;
  });

  return totales;
};

/**
 * Calcula porcentajes reales basados en ingresos
 * @param {Object} totales - Totales por clasificación
 * @param {number} ingresosMensuales - Ingresos totales del mes
 * @returns {Object} - Porcentajes por clasificación
 */
export const calcularPorcentajesReales = (totales, ingresosMensuales) => {
  if (ingresosMensuales === 0) {
    return {
      necesidades: 0,
      deseos: 0,
      ahorro: 0,
      sin_clasificar: 0,
    };
  }

  return {
    necesidades: (totales.necesidades / ingresosMensuales) * 100,
    deseos: (totales.deseos / ingresosMensuales) * 100,
    ahorro: (totales.ahorro / ingresosMensuales) * 100,
    sin_clasificar: (totales.sin_clasificar / ingresosMensuales) * 100,
  };
};

/**
 * Compara porcentajes reales vs recomendados
 * @param {Object} porcentajesReales - Porcentajes actuales
 * @param {Object} modeloRecomendado - Modelo recomendado (default: 50/30/20)
 * @returns {Object} - Comparación con diferencias
 */
export const compararConModelo = (porcentajesReales, modeloRecomendado = MODELO_RECOMENDADO) => {
  return {
    necesidades: {
      real: porcentajesReales.necesidades,
      recomendado: modeloRecomendado.necesidades,
      diferencia: porcentajesReales.necesidades - modeloRecomendado.necesidades,
    },
    deseos: {
      real: porcentajesReales.deseos,
      recomendado: modeloRecomendado.deseos,
      diferencia: porcentajesReales.deseos - modeloRecomendado.deseos,
    },
    ahorro: {
      real: porcentajesReales.ahorro,
      recomendado: modeloRecomendado.ahorro,
      diferencia: porcentajesReales.ahorro - modeloRecomendado.ahorro,
    },
  };
};

// ============================================
// 4. GENERACIÓN DE SUGERENCIAS
// ============================================

/**
 * Genera sugerencias accionables basadas en la comparación
 * @param {Object} comparacion - Resultado de compararConModelo()
 * @param {Object} totales - Totales en euros
 * @param {number} ingresosMensuales - Ingresos mensuales
 * @returns {Array} - Array de sugerencias
 */
export const generarSugerencias = (comparacion, totales, ingresosMensuales) => {
  const sugerencias = [];

  // Analizar necesidades
  if (comparacion.necesidades.diferencia > UMBRALES_ALERTA.critico) {
    sugerencias.push({
      tipo: 'critico',
      categoria: 'necesidades',
      mensaje: `Tus necesidades representan el ${comparacion.necesidades.real.toFixed(1)}%, ${Math.abs(comparacion.necesidades.diferencia).toFixed(1)}% por encima del recomendado (${comparacion.necesidades.recomendado}%). Esto puede indicar costes de vivienda/transporte altos. Considera revisar gastos fijos.`,
      accion: `Intenta reducir ${((Math.abs(comparacion.necesidades.diferencia) / 100) * ingresosMensuales).toFixed(2)}€ en gastos básicos`,
    });
  }

  // Analizar deseos
  if (comparacion.deseos.diferencia > UMBRALES_ALERTA.critico) {
    const excesoDeseos = ((comparacion.deseos.diferencia / 100) * ingresosMensuales);
    sugerencias.push({
      tipo: 'advertencia',
      categoria: 'deseos',
      mensaje: `Gastas ${comparacion.deseos.real.toFixed(1)}% en deseos, superando el ${comparacion.deseos.recomendado}% recomendado.`,
      accion: `Reducir ${excesoDeseos.toFixed(2)}€ en ocio/entretenimiento te ayudaría a equilibrar tu presupuesto`,
    });
  }

  // Analizar ahorro
  if (comparacion.ahorro.diferencia < -UMBRALES_ALERTA.advertencia) {
    const deficitAhorro = ((Math.abs(comparacion.ahorro.diferencia) / 100) * ingresosMensuales);
    sugerencias.push({
      tipo: 'critico',
      categoria: 'ahorro',
      mensaje: `Solo ahorras el ${comparacion.ahorro.real.toFixed(1)}% de tus ingresos. El objetivo recomendado es ${comparacion.ahorro.recomendado}%.`,
      accion: `Intenta destinar ${deficitAhorro.toFixed(2)}€ más al ahorro mensual. Considera automatizar transferencias a cuenta de ahorro.`,
    });
  }

  // Si todo está bien
  if (sugerencias.length === 0) {
    sugerencias.push({
      tipo: 'exito',
      categoria: 'general',
      mensaje: '¡Excelente! Tu distribución financiera está equilibrada según el modelo 50/30/20.',
      accion: 'Mantén este ritmo y considera aumentar el ahorro si es posible.',
    });
  }

  return sugerencias;
};

// ============================================
// 5. DETECCIÓN DE SOBREGASTO
// ============================================

/**
 * Detecta si hay sobregasto mensual
 * @param {Object} totales - Totales de gastos
 * @param {number} ingresosMensuales - Ingresos mensuales
 * @returns {Object} - Información de sobregasto
 */
export const detectarSobregasto = (totales, ingresosMensuales) => {
  const totalGastado = totales.necesidades + totales.deseos + totales.ahorro;
  const restante = ingresosMensuales - totalGastado;
  const porcentajeGastado = (totalGastado / ingresosMensuales) * 100;

  return {
    haySobregasto: totalGastado > ingresosMensuales,
    totalGastado,
    restante,
    porcentajeGastado,
    alerta: totalGastado > ingresosMensuales * 0.95 ? 'critico' :
            totalGastado > ingresosMensuales * 0.85 ? 'advertencia' :
            'normal',
  };
};

// ============================================
// 6. PREDICCIÓN MENSUAL
// ============================================

/**
 * Predice el gasto total al final del mes basado en el ritmo actual
 * @param {Object} totales - Totales actuales
 * @param {number} diaActual - Día del mes actual (1-31)
 * @param {number} diasEnMes - Total de días del mes
 * @returns {Object} - Predicción
 */
export const predecirGastoMensual = (totales, diaActual, diasEnMes) => {
  if (diaActual === 0 || diaActual > diasEnMes) {
    return null;
  }

  const totalActual = totales.necesidades + totales.deseos + totales.ahorro;
  const promedioDiario = totalActual / diaActual;
  const gastoProyectado = promedioDiario * diasEnMes;

  return {
    totalActual,
    gastoProyectado,
    promedioDiario,
    diasRestantes: diasEnMes - diaActual,
    mensaje: `Si mantienes este ritmo, gastarás aproximadamente ${gastoProyectado.toFixed(2)}€ este mes`,
  };
};

// ============================================
// 7. FUNCIÓN PRINCIPAL
// ============================================

/**
 * Analiza la distribución financiera completa
 *
 * @param {number} ingresosMensuales - Ingresos totales del mes
 * @param {Array} gastos - Array de objetos {categoria: string, monto: number}
 * @param {Object} opciones - Opciones adicionales
 * @param {Object} opciones.modeloPersonalizado - Modelo personalizado (opcional)
 * @param {number} opciones.diaActual - Día actual para predicción (opcional)
 * @param {number} opciones.diasEnMes - Días totales del mes (opcional)
 *
 * @returns {Object} - Análisis financiero completo
 *
 * @example
 * const resultado = analizarDistribucionFinanciera(2000, [
 *   { categoria: 'Alquiler', monto: 800 },
 *   { categoria: 'Supermercado', monto: 300 },
 *   { categoria: 'Ocio', monto: 200 },
 *   { categoria: 'Ahorro', monto: 400 },
 * ]);
 */
export const analizarDistribucionFinanciera = (
  ingresosMensuales,
  gastos,
  opciones = {}
) => {
  // Validación de entrada
  if (!ingresosMensuales || ingresosMensuales <= 0) {
    throw new Error('Los ingresos mensuales deben ser mayores a 0');
  }

  if (!Array.isArray(gastos)) {
    throw new Error('Los gastos deben ser un array');
  }

  // Opciones por defecto
  const {
    modeloPersonalizado = MODELO_RECOMENDADO,
    diaActual = new Date().getDate(),
    diasEnMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
  } = opciones;

  // 1. Calcular totales por clasificación
  const totales = calcularTotalesPorClasificacion(gastos);

  // 2. Calcular porcentajes reales
  const porcentajesReales = calcularPorcentajesReales(totales, ingresosMensuales);

  // 3. Comparar con modelo recomendado
  const comparacion = compararConModelo(porcentajesReales, modeloPersonalizado);

  // 4. Generar sugerencias
  const sugerencias = generarSugerencias(comparacion, totales, ingresosMensuales);

  // 5. Detectar sobregasto
  const sobregasto = detectarSobregasto(totales, ingresosMensuales);

  // 6. Predicción mensual
  const prediccion = predecirGastoMensual(totales, diaActual, diasEnMes);

  // 7. Construir resultado final
  return {
    // Información general
    ingresosMensuales,
    totalGastos: totales.necesidades + totales.deseos + totales.ahorro,
    restante: ingresosMensuales - (totales.necesidades + totales.deseos + totales.ahorro),

    // Desglose por clasificación
    desglose: {
      necesidades: {
        total: totales.necesidades,
        porcentaje: porcentajesReales.necesidades,
      },
      deseos: {
        total: totales.deseos,
        porcentaje: porcentajesReales.deseos,
      },
      ahorro: {
        total: totales.ahorro,
        porcentaje: porcentajesReales.ahorro,
      },
    },

    // Comparación con modelo recomendado
    comparacion,

    // Sugerencias accionables
    sugerencias,

    // Detección de sobregasto
    sobregasto,

    // Predicción del mes
    prediccion,

    // Metadata
    metadata: {
      fechaAnalisis: new Date().toISOString(),
      modeloUtilizado: modeloPersonalizado,
      totalGastosAnalizados: gastos.length,
    },
  };
};

// ============================================
// 8. EXPORTACIONES
// ============================================

export default {
  analizarDistribucionFinanciera,
  clasificarCategoria,
  calcularTotalesPorClasificacion,
  calcularPorcentajesReales,
  compararConModelo,
  generarSugerencias,
  detectarSobregasto,
  predecirGastoMensual,
  CLASIFICACION_CATEGORIAS,
  MODELO_RECOMENDADO,
  UMBRALES_ALERTA,
};
