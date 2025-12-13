// Claves para LocalStorage
const KEYS = {
  GASTOS_FIJOS: 'gastosFijos',
  GASTOS_VARIABLES: 'gastosVariables',
  INGRESOS: 'ingresos',
  CONFIG: 'config'
  ,CLASIFICACION_CATEGORIAS: 'clasificacionCategorias'
};

// ============ FUNCIONES GENÉRICAS ============

const getFromStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============ GASTOS FIJOS ============

export const getGastosFijos = () => {
  return getFromStorage(KEYS.GASTOS_FIJOS);
};

export const saveGastoFijo = (gasto) => {
  const gastos = getGastosFijos();
  gastos.push({ ...gasto, id: Date.now().toString() });
  saveToStorage(KEYS.GASTOS_FIJOS, gastos);
};

export const updateGastoFijo = (id, updatedGasto) => {
  const gastos = getGastosFijos();
  const index = gastos.findIndex(g => g.id === id);
  if (index !== -1) {
    gastos[index] = { ...gastos[index], ...updatedGasto };
    saveToStorage(KEYS.GASTOS_FIJOS, gastos);
  }
};

export const deleteGastoFijo = (id) => {
  const gastos = getGastosFijos().filter(g => g.id !== id);
  saveToStorage(KEYS.GASTOS_FIJOS, gastos);
};

// ============ GASTOS VARIABLES ============

export const getGastosVariables = () => {
  return getFromStorage(KEYS.GASTOS_VARIABLES);
};

export const saveGastoVariable = (gasto) => {
  const gastos = getGastosVariables();
  const config = getConfig();

  // Crear gasto con flag de seguimiento de fondo
  const nuevoGasto = {
    ...gasto,
    id: Date.now().toString(),
    deductedFromFund: true  // Marcar que fue deducido del fondo
  };

  // Agregar al array
  gastos.push(nuevoGasto);
  saveToStorage(KEYS.GASTOS_VARIABLES, gastos);

  // Restar del fondo
  config.fondoDisponible = parseFloat(config.fondoDisponible || 0) - parseFloat(gasto.cantidad);
  saveConfig(config);

  return { gasto: nuevoGasto, fondoRestante: config.fondoDisponible };
};

export const updateGastoVariable = (id, datosActualizados) => {
  const gastos = getGastosVariables();
  const indice = gastos.findIndex(g => g.id === id);

  if (indice === -1) return;

  const gastoOriginal = gastos[indice];
  const cantidadOriginal = parseFloat(gastoOriginal.cantidad);
  const cantidadNueva = parseFloat(datosActualizados.cantidad);
  const fueDeducido = gastoOriginal.deductedFromFund;

  // Actualizar el gasto
  gastos[indice] = { ...gastos[indice], ...datosActualizados };
  saveToStorage(KEYS.GASTOS_VARIABLES, gastos);

  // Si fue deducido del fondo, ajustar el fondo según la diferencia
  if (fueDeducido) {
    const config = getConfig();
    const diferencia = cantidadOriginal - cantidadNueva;
    config.fondoDisponible = parseFloat(config.fondoDisponible || 0) + diferencia;
    saveConfig(config);
  }
};

export const deleteGastoVariable = (id) => {
  const gastos = getGastosVariables();
  const gastoAEliminar = gastos.find(g => g.id === id);

  if (!gastoAEliminar) return;

  // Eliminar del array
  const gastosActualizados = gastos.filter(g => g.id !== id);
  saveToStorage(KEYS.GASTOS_VARIABLES, gastosActualizados);

  // Solo restaurar al fondo si fue originalmente deducido
  if (gastoAEliminar.deductedFromFund) {
    const config = getConfig();
    config.fondoDisponible = parseFloat(config.fondoDisponible || 0) + parseFloat(gastoAEliminar.cantidad);
    saveConfig(config);
  }
};

// ============ INGRESOS ============

export const getIngresos = () => {
  return getFromStorage(KEYS.INGRESOS);
};

export const saveIngreso = (ingreso) => {
  const ingresos = getIngresos();
  ingresos.push({ ...ingreso, id: Date.now().toString() });
  saveToStorage(KEYS.INGRESOS, ingresos);
};

export const deleteIngreso = (id) => {
  const ingresos = getIngresos().filter(i => i.id !== id);
  saveToStorage(KEYS.INGRESOS, ingresos);
};

// ============ CONFIGURACIÓN ============

export const getConfig = () => {
  const stored = localStorage.getItem(KEYS.CONFIG);
  const fallbackMes = new Date().toISOString().slice(0, 7);

  if (!stored) {
    // Usuario nuevo: inicializar con fondo vacío
    return {
      incomeBase: 0,
      mesActual: fallbackMes,
      fondoDisponible: 0,
      ultimaNomina: null,
      mesReferencia: fallbackMes,
      historialNominas: [],
      migratedToFundModel: true,
      migrationDate: new Date().toISOString()
    };
  }

  const config = JSON.parse(stored);

  // Ya migrado - devolver tal cual
  if (config.migratedToFundModel) {
    return config;
  }

  // MIGRACIÓN para usuarios existentes
  console.log('🔄 Migrando a modelo de fondo continuo...');

  const migrated = {
    // Mantener campos antiguos para compatibilidad
    incomeBase: typeof config.incomeBase !== 'undefined' ? config.incomeBase : 0,
    mesActual: config.mesActual || fallbackMes,

    // Inicializar fondo desde ingreso existente
    fondoDisponible: typeof config.fondoDisponible !== 'undefined'
      ? config.fondoDisponible
      : (config.incomeBase || 0),

    ultimaNomina: config.ultimaNomina || null,
    mesReferencia: config.mesReferencia || config.mesActual || fallbackMes,
    historialNominas: Array.isArray(config.historialNominas) ? config.historialNominas : [],

    // Marcar migración completa
    migratedToFundModel: true,
    migrationDate: new Date().toISOString()
  };

  // Guardar config migrado
  saveToStorage(KEYS.CONFIG, migrated);

  console.log('✅ Migración completada. Fondo inicial:', migrated.fondoDisponible);

  return migrated;
};

export const saveConfig = (config) => {
  saveToStorage(KEYS.CONFIG, config);
};

/**
 * Registrar una nueva nómina y añadirla al fondo disponible
 * @param {number|string} cantidad
 * @param {string} fecha - ISO date (YYYY-MM-DD) u otra representación
 * @returns {object} config actualizada
 */
export const registrarNomina = (cantidad, fecha) => {
  const config = getConfig();
  const monto = parseFloat(cantidad) || 0;

  config.fondoDisponible = parseFloat(config.fondoDisponible || 0) + monto;
  config.ultimaNomina = fecha || null;
  config.historialNominas = config.historialNominas || [];
  config.historialNominas.push({ fecha: fecha || new Date().toISOString().slice(0,10), cantidad: monto });

  saveToStorage(KEYS.CONFIG, config);
  return config;
};

// ============ CATEGORÍAS PERSONALIZABLES ============
export const getClasificacionCategorias = () => {
  const raw = localStorage.getItem(KEYS.CLASIFICACION_CATEGORIAS);
  return raw ? JSON.parse(raw) : null;
};

export const saveClasificacionCategorias = (obj) => {
  saveToStorage(KEYS.CLASIFICACION_CATEGORIAS, obj);
};