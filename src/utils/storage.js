// Claves para LocalStorage
const KEYS = {
  GASTOS_FIJOS: 'gastosFijos',
  GASTOS_VARIABLES: 'gastosVariables',
  INGRESOS: 'ingresos',
  CONFIG: 'config'
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
  const config = localStorage.getItem(KEYS.CONFIG);
  return config ? JSON.parse(config) : { incomeBase: 0, mesActual: new Date().toISOString().slice(0, 7) };
};

export const saveConfig = (config) => {
  saveToStorage(KEYS.CONFIG, config);
};