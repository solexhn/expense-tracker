/**
 * Módulo de Análisis Financiero Personal
 *
 * Analiza la distribución de gastos vs ingresos mensuales
 * y proporciona recomendaciones personalizadas basadas en
 * el modelo 50/30/20 (Necesidades/Deseos/Ahorro)
 */

import { getClasificacionCategorias } from './storage';


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
    'Trabajo',  // Herramientas necesarias para trabajar (ej: Claude, Microsoft 365)
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
    'Almacenamiento',  // Servicios cloud opcionales
  ],

  // DEUDAS - Nueva categoría para créditos/pagos fraccionados
  deudas: [
    'Crédito',
    'Pago fraccionado',
    'Sequra',
    'Cofidis',
    'Pepper',
    'Carrefour',
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
 * Modelo financiero adaptado para situaciones con deudas
 *
 * PRIORIDAD 1: Cubrir necesidades básicas (50-60%)
 * PRIORIDAD 2: Pagar deudas (lo que sea necesario, idealmente < 30%)
 * PRIORIDAD 3: Fondo de emergencia mínimo (10% como objetivo inicial)
 * PRIORIDAD 4: Ocio controlado (lo que sobre)
 *
 * Cuando NO tengas deudas, pasarás automáticamente al modelo 50/30/20
 */
export const MODELO_RECOMENDADO = {
  necesidades: 50,  // 50% de ingresos
  deseos: 20,       // 20% de ingresos (reducido mientras haya deudas)
  deudas: 30,       // Máximo 30% en pagos de deuda
  ahorro: 10,       // 10% mínimo (fondo emergencia)
};

/**
 * Modelo para cuando NO hay deudas (50/30/20 clásico)
 */
export const MODELO_SIN_DEUDAS = {
  necesidades: 50,
  deseos: 30,
  ahorro: 20,
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
 * @returns {string} - 'necesidades', 'deseos', 'deudas', 'ahorro', o 'sin_clasificar'
 */


export const clasificarCategoria = (categoria) => {
  if (!categoria) return 'sin_clasificar';

  const categoriaLower = categoria.toLowerCase();

  // Allow user-customizable categories stored in localStorage
  const custom = getClasificacionCategorias();
  const categorias = custom || CLASIFICACION_CATEGORIAS;

  // Buscar en necesidades
  if (
    categorias.necesidades.some((cat) =>
      categoriaLower.includes(cat.toLowerCase())
    )
  ) {
    return 'necesidades';
  }

  // Buscar en deudas (prioridad alta)
  if (
    categorias.deudas.some((cat) =>
      categoriaLower.includes(cat.toLowerCase())
    )
  ) {
    return 'deudas';
  }

  // Buscar en deseos
  if (
    categorias.deseos.some((cat) =>
      categoriaLower.includes(cat.toLowerCase())
    )
  ) {
    return 'deseos';
  }

  // Buscar en ahorro
  if (
    categorias.ahorro.some((cat) =>
      categoriaLower.includes(cat.toLowerCase())
    )
  ) {
    return 'ahorro';
  }

  // Por defecto, clasificar como "sin_clasificar" para que el usuario lo revise
  return 'sin_clasificar';
};

// ============================================
// 3. FUNCIONES DE CÁLCULO
// ============================================

/**
 * Agrupa y suma gastos por clasificación
 * @param {Array} gastos - Array de objetos {categoria, monto}
 * @returns {Object} - {necesidades: number, deseos: number, deudas: number, ahorro: number}
 */
export const calcularTotalesPorClasificacion = (gastos) => {
  const totales = {
    necesidades: 0,
    deseos: 0,
    deudas: 0,
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
      deudas: 0,
      ahorro: 0,
      sin_clasificar: 0,
    };
  }

  // El ahorro real es lo que queda después de todos los gastos
  const totalGastado = totales.necesidades + totales.deseos + totales.deudas + totales.ahorro + totales.sin_clasificar;
  const ahorroReal = Math.max(0, ingresosMensuales - totalGastado);

  return {
    necesidades: (totales.necesidades / ingresosMensuales) * 100,
    deseos: (totales.deseos / ingresosMensuales) * 100,
    deudas: (totales.deudas / ingresosMensuales) * 100,
    ahorro: (ahorroReal / ingresosMensuales) * 100,  // Ahorro calculado automáticamente
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

  // NUEVO: Analizar deudas primero (máxima prioridad)
  if (totales.deudas > 0) {
    const porcentajeDeudas = (totales.deudas / ingresosMensuales) * 100;
    if (porcentajeDeudas > 30) {
      sugerencias.push({
        tipo: 'critico',
        categoria: 'deudas',
        mensaje: `⚠️ ALERTA: ${porcentajeDeudas.toFixed(1)}% de tus ingresos (${totales.deudas.toFixed(2)}€) se destina a pagos de deudas/créditos. Esto limita significativamente tu capacidad de ahorro.`,
        accion: `Prioriza saldar las deudas con menos cuotas restantes. Considera consolidar créditos si es posible.`,
      });
    } else if (porcentajeDeudas > 20) {
      sugerencias.push({
        tipo: 'advertencia',
        categoria: 'deudas',
        mensaje: `Destinas ${porcentajeDeudas.toFixed(1)}% (${totales.deudas.toFixed(2)}€) a deudas. Aunque manejable, intenta no adquirir nuevos créditos.`,
        accion: `Enfócate en terminar los créditos más pequeños primero para liberar flujo de caja mensual.`,
      });
    }
  }

  // Analizar necesidades
  if (comparacion.necesidades.diferencia > UMBRALES_ALERTA.critico) {
    sugerencias.push({
      tipo: 'advertencia',
      categoria: 'necesidades',
      mensaje: `Tus necesidades básicas representan el ${comparacion.necesidades.real.toFixed(1)}%, ${Math.abs(comparacion.necesidades.diferencia).toFixed(1)}% por encima del recomendado (${comparacion.necesidades.recomendado}%).`,
      accion: `Revisa suscripciones necesarias vs opcionales. Algunas podrían moverse a "deseos" o cancelarse.`,
    });
  }

  // Analizar deseos
  if (comparacion.deseos.diferencia > UMBRALES_ALERTA.critico) {
    const excesoDeseos = ((comparacion.deseos.diferencia / 100) * ingresosMensuales);
    sugerencias.push({
      tipo: 'advertencia',
      categoria: 'deseos',
      mensaje: `Gastas ${comparacion.deseos.real.toFixed(1)}% en deseos, superando el ${comparacion.deseos.recomendado}% recomendado.`,
      accion: `Reducir ${excesoDeseos.toFixed(2)}€ en entretenimiento/suscripciones liberaría dinero para ahorro.`,
    });
  }

  // Analizar ahorro
  if (comparacion.ahorro.diferencia < -UMBRALES_ALERTA.advertencia) {
    const deficitAhorro = ((Math.abs(comparacion.ahorro.diferencia) / 100) * ingresosMensuales);
    sugerencias.push({
      tipo: 'info',
      categoria: 'ahorro',
      mensaje: `Tu tasa de ahorro actual es del ${comparacion.ahorro.real.toFixed(1)}%. El objetivo recomendado es ${comparacion.ahorro.recomendado}%.`,
      accion: `Cuando terminen algunos créditos, destina esos ${deficitAhorro.toFixed(2)}€ al ahorro en lugar de nuevos gastos.`,
    });
  }

  // NUEVO: Detectar gastos sin clasificar
  if (totales.sin_clasificar > 0) {
    sugerencias.push({
      tipo: 'info',
      categoria: 'sin_clasificar',
      mensaje: `Tienes ${totales.sin_clasificar.toFixed(2)}€ en gastos sin categoría clara.`,
      accion: `Asigna categorías específicas a estos gastos para un mejor análisis.`,
    });
  }

  // Si todo está bien
  if (sugerencias.length === 0) {
    sugerencias.push({
      tipo: 'exito',
      categoria: 'general',
      mensaje: '✅ Tu distribución financiera está equilibrada.',
      accion: 'Mantén este ritmo y considera aumentar el ahorro cuando sea posible.',
    });
  }

  return sugerencias;
};

// ============================================
// 5. PRESUPUESTO DISPONIBLE (NUEVA FUNCIÓN PRÁCTICA)
// ============================================

/**
 * Calcula cuánto dinero tienes REALMENTE disponible para gastar este mes
 * Esta es la función más importante para control diario
 *
 * @param {number} ingresosMensuales - Ingresos totales del mes
 * @param {Object} totales - Totales de gastos por categoría
 * @returns {Object} - Presupuesto disponible desglosado
 */
export const calcularPresupuestoDisponible = (ingresosMensuales, totales) => {
  // 1. Gastos FIJOS que ya no puedes evitar (deudas + necesidades fijas)
  const gastosFijos = totales.necesidades + totales.deudas;

  // 2. Lo que YA gastaste en variables/ocio este mes
  const yaGastadoVariable = totales.deseos + totales.sin_clasificar;

  // 3. Dinero DISPONIBLE ahora mismo
  const disponibleAhora = ingresosMensuales - gastosFijos - yaGastadoVariable;

  // 4. Recomendación de ahorro mínimo (10% de ingresos)
  const ahorroRecomendado = ingresosMensuales * 0.10;

  // 5. Lo que DEBERÍAS dejar de gastar para cumplir ahorro mínimo
  const disponibleParaGastar = disponibleAhora - ahorroRecomendado;

  // 6. Presupuesto sugerido para necesidades básicas (50%)
  const presupuestoNecesidades = ingresosMensuales * 0.50;

  // 7. Presupuesto sugerido para ocio (20% con deudas, 30% sin deudas)
  const tieneDeudas = totales.deudas > 0;
  const presupuestoOcio = ingresosMensuales * (tieneDeudas ? 0.20 : 0.30);

  return {
    // Información del mes
    ingresosMensuales,
    gastosFijos,
    yaGastadoVariable,

    // Lo más importante: ¿Cuánto me queda?
    disponibleAhora,
    disponibleParaGastar,

    // Objetivos de ahorro
    ahorroRecomendado,
    ahorroReal: Math.max(0, disponibleAhora),

    // Presupuestos sugeridos
    presupuestoNecesidades,
    presupuestoOcio,
    gastadoNecesidades: totales.necesidades,
    gastadoOcio: totales.deseos,

    // Estado
    tieneDeudas,
    excedioPresupuestoNecesidades: totales.necesidades > presupuestoNecesidades,
    excedioPresupuestoOcio: totales.deseos > presupuestoOcio,
    cumpleAhorroMinimo: disponibleAhora >= ahorroRecomendado,
  };
};

// ============================================
// 6. PROYECCIÓN DE LIBERACIÓN DE DEUDAS
// ============================================

/**
 * Calcula cuándo se liberarán tus deudas y cuánto dinero extra tendrás
 * Útil para planificar a futuro
 *
 * @param {Array} gastosFijos - Array de gastos fijos con información de cuotas
 * @returns {Object} - Proyección de liberación de deudas
 */
export const calcularProyeccionDeudas = (gastosFijos) => {
  // Filtrar solo créditos/deudas
  const deudas = gastosFijos.filter(g =>
    g.tipo === 'credito' ||
    (g.categoria && ['Crédito', 'Pago fraccionado', 'Sequra', 'Cofidis', 'Pepper', 'Carrefour'].some(cat =>
      g.categoria.toLowerCase().includes(cat.toLowerCase())
    ))
  );

  if (deudas.length === 0) {
    return {
      tieneDeudas: false,
      mensaje: '¡Felicidades! No tienes deudas activas.',
    };
  }

  // Ordenar por cuotas restantes (las que terminan primero)
  const deudasOrdenadas = deudas
    .filter(d => d.cuotasRestantes && d.cuotasRestantes > 0)
    .sort((a, b) => a.cuotasRestantes - b.cuotasRestantes);

  const totalMensualDeudas = deudas.reduce((sum, d) => sum + parseFloat(d.cantidad), 0);

  return {
    tieneDeudas: true,
    totalDeudas: deudas.length,
    pagoMensualTotal: totalMensualDeudas,
    proximaATerminar: deudasOrdenadas[0] || null,
    todasLasDeudas: deudasOrdenadas.map(d => ({
      nombre: d.nombre,
      cuotaMensual: d.cantidad,
      cuotasRestantes: d.cuotasRestantes,
      mesesHastaLiberar: d.cuotasRestantes,
      dineroQueSeLibera: d.cantidad,
    })),
  };
};

// ============================================
// 7. DETECCIÓN DE SOBREGASTO
// ============================================

/**
 * Detecta si hay sobregasto mensual
 * @param {Object} totales - Totales de gastos
 * @param {number} ingresosMensuales - Ingresos mensuales
 * @returns {Object} - Información de sobregasto
 */
export const detectarSobregasto = (totales, ingresosMensuales) => {
  const totalGastado = totales.necesidades + totales.deseos + totales.deudas + totales.sin_clasificar;
  const restante = ingresosMensuales - totalGastado;
  const porcentajeGastado = (totalGastado / ingresosMensuales) * 100;

  return {
    haySobregasto: totalGastado > ingresosMensuales,
    totalGastado,
    restante,
    porcentajeGastado,
    porcentajeDeudas: (totales.deudas / ingresosMensuales) * 100,
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

  const totalActual = totales.necesidades + totales.deseos + totales.deudas + totales.sin_clasificar;
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

  // 2. NUEVA FUNCIÓN: Presupuesto disponible (lo más importante)
  const presupuestoDisponible = calcularPresupuestoDisponible(ingresosMensuales, totales);

  // 3. Calcular porcentajes reales
  const porcentajesReales = calcularPorcentajesReales(totales, ingresosMensuales);

  // 4. Decidir qué modelo usar (con deudas o sin deudas)
  const modeloAUsar = totales.deudas > 0 ? MODELO_RECOMENDADO : MODELO_SIN_DEUDAS;
  const modeloFinal = modeloPersonalizado || modeloAUsar;

  // 5. Comparar con modelo recomendado
  const comparacion = compararConModelo(porcentajesReales, modeloFinal);

  // 6. Generar sugerencias
  const sugerencias = generarSugerencias(comparacion, totales, ingresosMensuales);

  // 7. Detectar sobregasto
  const sobregasto = detectarSobregasto(totales, ingresosMensuales);

  // 8. Predicción mensual
  const prediccion = predecirGastoMensual(totales, diaActual, diasEnMes);

  // 9. Construir resultado final
  const totalGastado = totales.necesidades + totales.deseos + totales.deudas + totales.sin_clasificar;
  const ahorroReal = Math.max(0, ingresosMensuales - totalGastado);

  return {
    // Información general
    ingresosMensuales,
    totalGastos: totalGastado,
    restante: ahorroReal,

    // NUEVO: Presupuesto disponible (información más práctica)
    presupuestoDisponible,

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
      deudas: {
        total: totales.deudas,
        porcentaje: porcentajesReales.deudas,
      },
      ahorro: {
        total: ahorroReal,  // Ahorro calculado, no de categoría
        porcentaje: porcentajesReales.ahorro,
      },
      sin_clasificar: {
        total: totales.sin_clasificar,
        porcentaje: porcentajesReales.sin_clasificar,
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
      modeloUtilizado: modeloFinal,
      totalGastosAnalizados: gastos.length,
      usandoModeloConDeudas: totales.deudas > 0,
    },
  };
};

// ============================================
// 8. EXPORTACIONES
// ============================================

const FINANCIAL_ANALYSIS = {
  analizarDistribucionFinanciera,
  clasificarCategoria,
  calcularTotalesPorClasificacion,
  calcularPorcentajesReales,
  compararConModelo,
  generarSugerencias,
  detectarSobregasto,
  predecirGastoMensual,
  calcularPresupuestoDisponible,
  calcularProyeccionDeudas,
  CLASIFICACION_CATEGORIAS,
  MODELO_RECOMENDADO,
  MODELO_SIN_DEUDAS,
  UMBRALES_ALERTA,
};

export default FINANCIAL_ANALYSIS;
