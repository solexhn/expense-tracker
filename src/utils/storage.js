// Claves para LocalStorage
const KEYS = {
  GASTOS_FIJOS: 'gastosFijos',
  GASTOS_VARIABLES: 'gastosVariables',
  INGRESOS: 'ingresos',
  CONFIG: 'config',
  CLASIFICACION_CATEGORIAS: 'clasificacionCategorias',
  // Nuevas claves para sistema de sobres y metas
  SOBRES: 'sobresPresupuesto',
  METAS_AHORRO: 'metasAhorro'
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

/**
 * Establecer un saldo inicial personalizado
 * Útil para empezar desde una situación real sin perder configuraciones
 * @param {number|string} cantidad - El saldo actual real
 * @param {string} motivo - Motivo opcional del ajuste
 * @returns {object} config actualizada
 */
export const establecerSaldoInicial = (cantidad, motivo = 'Ajuste manual') => {
  const config = getConfig();
  const montoAnterior = parseFloat(config.fondoDisponible || 0);
  const montoNuevo = parseFloat(cantidad) || 0;

  // Guardar historial del ajuste
  config.historialAjustes = config.historialAjustes || [];
  config.historialAjustes.push({
    fecha: new Date().toISOString(),
    montoAnterior,
    montoNuevo,
    diferencia: montoNuevo - montoAnterior,
    motivo
  });

  // Establecer el nuevo saldo
  config.fondoDisponible = montoNuevo;
  config.ultimoAjuste = new Date().toISOString().slice(0, 10);

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

// ============ SISTEMA DE SOBRES (ENVELOPE BUDGETING) ============

/**
 * Categorías predefinidas para sobres
 * El usuario puede crear más, pero estas son las básicas
 */
export const CATEGORIAS_SOBRES_DEFAULT = [
  { id: 'necesidades', nombre: '🏠 Necesidades', color: 'blue', tipo: 'fijo' },
  { id: 'alimentacion', nombre: '🛒 Alimentación', color: 'green', tipo: 'variable' },
  { id: 'transporte', nombre: '🚗 Transporte', color: 'yellow', tipo: 'variable' },
  { id: 'ocio', nombre: '🎮 Ocio', color: 'purple', tipo: 'variable' },
  { id: 'ahorro_emergencia', nombre: '🛡️ Fondo Emergencia', color: 'emerald', tipo: 'ahorro' },
  { id: 'pago_extra_deudas', nombre: '💳 Pago Extra Deudas', color: 'red', tipo: 'deuda' },
  { id: 'otros', nombre: '📦 Otros', color: 'gray', tipo: 'variable' }
];

/**
 * Obtiene los sobres guardados o inicializa con defaults
 * @returns {Object} { sobres: Array, dineroSinAsignar: number, ultimaActualizacion: string }
 */
export const getSobres = () => {
  const stored = localStorage.getItem(KEYS.SOBRES);

  if (!stored) {
    // Inicializar con sobres vacíos
    const initial = {
      sobres: CATEGORIAS_SOBRES_DEFAULT.map(cat => ({
        ...cat,
        asignado: 0,
        gastado: 0
      })),
      dineroSinAsignar: 0,
      ultimaActualizacion: new Date().toISOString()
    };
    return initial;
  }

  return JSON.parse(stored);
};

/**
 * Guarda los sobres en localStorage
 * @param {Object} sobresData - Datos de sobres completos
 */
export const saveSobres = (sobresData) => {
  sobresData.ultimaActualizacion = new Date().toISOString();
  saveToStorage(KEYS.SOBRES, sobresData);
};

/**
 * Sincroniza el dinero sin asignar con el fondo disponible
 * Llamar cuando se actualice el fondo (nómina, etc)
 */
export const sincronizarSobresConFondo = () => {
  const config = getConfig();
  const sobresData = getSobres();

  // Calcular total asignado
  const totalAsignado = sobresData.sobres.reduce((sum, s) => sum + s.asignado, 0);

  // El dinero sin asignar es la diferencia
  sobresData.dineroSinAsignar = Math.max(0, config.fondoDisponible - totalAsignado);

  saveSobres(sobresData);
  return sobresData;
};

/**
 * Asigna dinero a un sobre específico
 * @param {string} sobreId - ID del sobre
 * @param {number} cantidad - Cantidad a asignar
 * @returns {Object} Sobres actualizados
 */
export const asignarASobre = (sobreId, cantidad) => {
  const sobresData = getSobres();
  const sobre = sobresData.sobres.find(s => s.id === sobreId);

  if (!sobre) {
    console.error('Sobre no encontrado:', sobreId);
    return sobresData;
  }

  // Verificar que hay dinero sin asignar suficiente
  const cantidadNum = parseFloat(cantidad) || 0;
  if (cantidadNum > sobresData.dineroSinAsignar) {
    console.warn('No hay suficiente dinero sin asignar');
    return sobresData;
  }

  sobre.asignado += cantidadNum;
  sobresData.dineroSinAsignar -= cantidadNum;

  saveSobres(sobresData);
  return sobresData;
};

/**
 * Establece el monto asignado de un sobre directamente
 * @param {string} sobreId - ID del sobre
 * @param {number} nuevoMonto - Nuevo monto total asignado
 */
export const establecerAsignacionSobre = (sobreId, nuevoMonto) => {
  const sobresData = getSobres();
  const config = getConfig();
  const sobre = sobresData.sobres.find(s => s.id === sobreId);

  if (!sobre) return sobresData;

  // Calcular nuevo total asignado
  const totalOtrosSobres = sobresData.sobres
    .filter(s => s.id !== sobreId)
    .reduce((sum, s) => sum + s.asignado, 0);

  const nuevoTotal = totalOtrosSobres + nuevoMonto;

  // No permitir asignar más del fondo disponible
  if (nuevoTotal > config.fondoDisponible) {
    return sobresData;
  }

  sobre.asignado = nuevoMonto;
  sobresData.dineroSinAsignar = config.fondoDisponible - nuevoTotal;

  saveSobres(sobresData);
  return sobresData;
};

/**
 * Transfiere dinero entre sobres
 * @param {string} desdeId - ID del sobre origen
 * @param {string} haciaId - ID del sobre destino
 * @param {number} cantidad - Cantidad a transferir
 */
export const transferirEntreSobres = (desdeId, haciaId, cantidad) => {
  const sobresData = getSobres();
  const sobreDesde = sobresData.sobres.find(s => s.id === desdeId);
  const sobreHacia = sobresData.sobres.find(s => s.id === haciaId);

  if (!sobreDesde || !sobreHacia) return sobresData;

  const cantidadNum = parseFloat(cantidad) || 0;
  const disponibleEnOrigen = sobreDesde.asignado - sobreDesde.gastado;

  if (cantidadNum > disponibleEnOrigen) {
    console.warn('No hay suficiente en el sobre origen');
    return sobresData;
  }

  sobreDesde.asignado -= cantidadNum;
  sobreHacia.asignado += cantidadNum;

  saveSobres(sobresData);
  return sobresData;
};

/**
 * Registra un gasto contra un sobre
 * @param {string} sobreId - ID del sobre
 * @param {number} cantidad - Cantidad gastada
 */
export const registrarGastoEnSobre = (sobreId, cantidad) => {
  const sobresData = getSobres();
  const sobre = sobresData.sobres.find(s => s.id === sobreId);

  if (!sobre) return sobresData;

  sobre.gastado += parseFloat(cantidad) || 0;

  saveSobres(sobresData);
  return sobresData;
};

/**
 * Crea un nuevo sobre personalizado
 * @param {Object} nuevoSobre - { nombre, color, tipo }
 */
export const crearSobre = (nuevoSobre) => {
  const sobresData = getSobres();

  const sobre = {
    id: `custom_${Date.now()}`,
    nombre: nuevoSobre.nombre,
    color: nuevoSobre.color || 'gray',
    tipo: nuevoSobre.tipo || 'variable',
    asignado: 0,
    gastado: 0
  };

  sobresData.sobres.push(sobre);
  saveSobres(sobresData);
  return sobresData;
};

/**
 * Elimina un sobre (solo personalizados)
 * @param {string} sobreId - ID del sobre a eliminar
 */
export const eliminarSobre = (sobreId) => {
  const sobresData = getSobres();

  // No permitir eliminar sobres predefinidos
  if (!sobreId.startsWith('custom_')) {
    console.warn('No se pueden eliminar sobres predefinidos');
    return sobresData;
  }

  const sobre = sobresData.sobres.find(s => s.id === sobreId);
  if (sobre) {
    // Devolver el dinero asignado al pool sin asignar
    sobresData.dineroSinAsignar += (sobre.asignado - sobre.gastado);
  }

  sobresData.sobres = sobresData.sobres.filter(s => s.id !== sobreId);
  saveSobres(sobresData);
  return sobresData;
};

/**
 * Reinicia los sobres al inicio de un nuevo período
 * Opcionalmente mantiene los excedentes o los pasa al siguiente mes
 * @param {boolean} mantenerExcedentes - Si true, los excedentes se suman al nuevo período
 */
export const reiniciarSobres = (mantenerExcedentes = true) => {
  const sobresData = getSobres();
  const config = getConfig();

  let excedenteTotal = 0;

  sobresData.sobres.forEach(sobre => {
    const excedente = sobre.asignado - sobre.gastado;
    if (mantenerExcedentes && excedente > 0) {
      excedenteTotal += excedente;
    }
    sobre.asignado = mantenerExcedentes ? Math.max(0, excedente) : 0;
    sobre.gastado = 0;
  });

  sobresData.dineroSinAsignar = config.fondoDisponible - excedenteTotal;

  saveSobres(sobresData);
  return sobresData;
};

// ============ METAS DE AHORRO ============

/**
 * Obtiene todas las metas de ahorro
 * @returns {Array} Array de metas
 */
export const getMetasAhorro = () => {
  const stored = localStorage.getItem(KEYS.METAS_AHORRO);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Guarda una nueva meta de ahorro
 * @param {Object} meta - { nombre, objetivo, fechaLimite, progreso, icono, color }
 */
export const saveMetaAhorro = (meta) => {
  const metas = getMetasAhorro();

  const nuevaMeta = {
    id: Date.now().toString(),
    nombre: meta.nombre,
    objetivo: parseFloat(meta.objetivo) || 0,
    fechaLimite: meta.fechaLimite || null, // formato YYYY-MM
    progreso: parseFloat(meta.progreso) || 0,
    icono: meta.icono || '🎯',
    color: meta.color || 'blue',
    fechaCreacion: new Date().toISOString(),
    historialAportes: []
  };

  metas.push(nuevaMeta);
  saveToStorage(KEYS.METAS_AHORRO, metas);
  return nuevaMeta;
};

/**
 * Actualiza una meta existente
 * @param {string} id - ID de la meta
 * @param {Object} cambios - Campos a actualizar
 */
export const updateMetaAhorro = (id, cambios) => {
  const metas = getMetasAhorro();
  const index = metas.findIndex(m => m.id === id);

  if (index !== -1) {
    metas[index] = { ...metas[index], ...cambios };
    saveToStorage(KEYS.METAS_AHORRO, metas);
  }

  return metas[index];
};

/**
 * Elimina una meta
 * @param {string} id - ID de la meta
 */
export const deleteMetaAhorro = (id) => {
  const metas = getMetasAhorro().filter(m => m.id !== id);
  saveToStorage(KEYS.METAS_AHORRO, metas);
};

/**
 * Aporta dinero a una meta
 * @param {string} metaId - ID de la meta
 * @param {number} cantidad - Cantidad a aportar
 * @param {string} origen - Descripción del origen (opcional)
 */
export const aportarAMeta = (metaId, cantidad, origen = 'Aporte manual') => {
  const metas = getMetasAhorro();
  const meta = metas.find(m => m.id === metaId);

  if (!meta) return null;

  const aporte = {
    fecha: new Date().toISOString(),
    cantidad: parseFloat(cantidad),
    origen
  };

  meta.progreso += parseFloat(cantidad);
  meta.historialAportes = meta.historialAportes || [];
  meta.historialAportes.push(aporte);

  saveToStorage(KEYS.METAS_AHORRO, metas);
  return meta;
};

/**
 * Calcula estadísticas de una meta
 * @param {Object} meta - Objeto de meta
 * @returns {Object} Estadísticas calculadas
 */
export const calcularEstadisticasMeta = (meta) => {
  const porcentaje = meta.objetivo > 0 ? (meta.progreso / meta.objetivo) * 100 : 0;
  const restante = Math.max(0, meta.objetivo - meta.progreso);

  // Calcular meses hasta fecha límite
  let mesesRestantes = null;
  let aporteMensualNecesario = null;

  if (meta.fechaLimite) {
    const [year, month] = meta.fechaLimite.split('-').map(Number);
    const fechaLimite = new Date(year, month - 1, 1);
    const hoy = new Date();

    mesesRestantes = Math.max(0,
      (fechaLimite.getFullYear() - hoy.getFullYear()) * 12 +
      (fechaLimite.getMonth() - hoy.getMonth())
    );

    aporteMensualNecesario = mesesRestantes > 0 ? restante / mesesRestantes : restante;
  }

  // Determinar hitos alcanzados
  const hitos = [];
  if (porcentaje >= 25) hitos.push({ porcentaje: 25, mensaje: '¡25% alcanzado!' });
  if (porcentaje >= 50) hitos.push({ porcentaje: 50, mensaje: '¡Mitad del camino!' });
  if (porcentaje >= 75) hitos.push({ porcentaje: 75, mensaje: '¡75% - Ya casi!' });
  if (porcentaje >= 100) hitos.push({ porcentaje: 100, mensaje: '🎉 ¡META CUMPLIDA!' });

  const ultimoHito = hitos.length > 0 ? hitos[hitos.length - 1] : null;

  return {
    porcentaje: Math.min(100, porcentaje),
    restante,
    mesesRestantes,
    aporteMensualNecesario,
    completada: porcentaje >= 100,
    hitos,
    ultimoHito
  };
};