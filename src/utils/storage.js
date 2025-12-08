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
  gastos.push({ ...gasto, id: Date.now().toString() });
  saveToStorage(KEYS.GASTOS_VARIABLES, gastos);
};

export const deleteGastoVariable = (id) => {
  const gastos = getGastosVariables().filter(g => g.id !== id);
  saveToStorage(KEYS.GASTOS_VARIABLES, gastos);
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
    return {
      // backwards compatible
      incomeBase: 0,
      mesActual: fallbackMes,

      // nuevo modelo de fondo disponible
      fondoDisponible: 0,
      ultimaNomina: null,
      mesReferencia: fallbackMes,
      historialNominas: []
    };
  }

  const config = JSON.parse(stored);

  // Migración simple: si existe incomeBase/mesActual, manténlos y
  // crea los nuevos campos sin eliminar los anteriores para compatibilidad
  const migrated = {
    incomeBase: typeof config.incomeBase !== 'undefined' ? config.incomeBase : 0,
    mesActual: config.mesActual || fallbackMes,

    fondoDisponible: typeof config.fondoDisponible !== 'undefined' ? config.fondoDisponible : (config.incomeBase ? config.incomeBase : 0),
    ultimaNomina: config.ultimaNomina || null,
    mesReferencia: config.mesReferencia || config.mesActual || fallbackMes,
    historialNominas: Array.isArray(config.historialNominas) ? config.historialNominas : []
  };

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