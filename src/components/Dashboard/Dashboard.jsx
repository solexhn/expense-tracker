import { useState, useEffect, useCallback } from 'react';
import {
  getConfig,
  saveConfig,
  getGastosFijos,
  getGastosVariables,
  getIngresos
} from '../../utils/storage';
import { obtenerResumenMes, obtenerResumenFondo, formatearMoneda, calcularDiaRealCobro, detectarMejorMes } from '../../utils/calculations';
import MonthlyChart from '../Charts/MonthlyChart';
import CalendarView from '../Calendar/CalendarView';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiEye, FiEyeOff, FiBriefcase, FiCalendar, FiBell, FiCheckCircle } from 'react-icons/fi';

const Dashboard = () => {
  const [resumen, setResumen] = useState({
    totalIngresos: 0,
    totalGastosFijos: 0,
    totalGastosVariables: 0,
    totalGastos: 0,
    saldoRestante: 0
  });

  const [mesActual, setMesActual] = useState('');
  const [mostrarIngresos, setMostrarIngresos] = useState(() => {
    const saved = localStorage.getItem('mostrarIngresos');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [viewMode, setViewMode] = useState('fund'); // 'fund' o 'historical'

  useEffect(() => {
    localStorage.setItem('mostrarIngresos', JSON.stringify(mostrarIngresos));
  }, [mostrarIngresos]);

  const obtenerMesesDisponibles = useCallback(() => {
    const gastosVariables = getGastosVariables();
    const ingresos = getIngresos();

    const fechas = new Set();

    // Extraer meses de gastos variables
    gastosVariables.forEach(g => {
      if (g.fecha) {
        fechas.add(g.fecha.substring(0, 7));
      }
    });

    // Extraer meses de ingresos
    ingresos.forEach(i => {
      if (i.fecha) {
        fechas.add(i.fecha.substring(0, 7));
      }
    });

    // Convertir Set a array y ordenar (mas reciente primero)
    const meses = Array.from(fechas).sort((a, b) => b.localeCompare(a));

    // Si no hay meses, agregar el mes actual
    if (meses.length === 0) {
      meses.push(new Date().toISOString().slice(0, 7));
    }

    return meses;
  }, []);

  const cargarDatos = useCallback(() => {
    const config = getConfig();
    const gastosFijos = getGastosFijos();
    const gastosVariables = getGastosVariables();
    const ingresos = getIngresos();

    let saldoParaNotificacion = 0;

    if (viewMode === 'fund') {
      // MODO FONDO: Mostrar balance actual del fondo
      const resumenFondo = obtenerResumenFondo(config, gastosFijos);

      setResumen({
        fondoDisponible: resumenFondo.fondoDisponible,
        totalGastosFijos: resumenFondo.totalGastosFijos,
        disponibleReal: resumenFondo.disponibleDespuesDeGastosFijos,
        ultimaNomina: resumenFondo.ultimaNomina,
        isFundMode: true
      });

      saldoParaNotificacion = resumenFondo.disponibleDespuesDeGastosFijos;

    } else {
      // MODO HISTÓRICO: Filtrado mensual (lógica existente)
      let mesAMostrar = config.mesReferencia || config.mesActual;

      // Si el mes guardado no tiene datos, usar detección inteligente
      const hayDatosEnMesGuardado =
        gastosVariables.some(g => g.fecha && g.fecha.startsWith(mesAMostrar)) ||
        ingresos.some(i => i.fecha && i.fecha.startsWith(mesAMostrar));

      if (!hayDatosEnMesGuardado) {
        mesAMostrar = detectarMejorMes(gastosVariables, ingresos);
      }

      const resumenCalculado = obtenerResumenMes(config, gastosFijos, gastosVariables, ingresos);
      setResumen({ ...resumenCalculado, isFundMode: false });
      setMesActual(mesAMostrar);

      saldoParaNotificacion = resumenCalculado.saldoRestante;
    }

    setMesesDisponibles(obtenerMesesDisponibles());

    // notificaciones simples
    const hoy = new Date();
    const añoHoy = hoy.getFullYear();
    const mesHoy = hoy.getMonth() + 1; // 1..12
    const diaHoy = hoy.getDate();

    const notify = [];
    // comprobar gastos fijos que se cobran hoy
    gastosFijos.forEach(g => {
      if (g.estado !== 'activo') return;
      const diaReal = calcularDiaRealCobro(g.diaDelMes, añoHoy, mesHoy);
      if (diaReal === diaHoy) {
        notify.push({ type: 'cobro', text: `Hoy se cobra ${g.nombre} — ${formatearMoneda(g.cantidad)}` });
      }
    });

    // aviso de saldo restante
    const mensajeSaldo = viewMode === 'fund'
      ? `Te quedan ${formatearMoneda(saldoParaNotificacion)} disponibles`
      : `Te quedan ${formatearMoneda(saldoParaNotificacion)} para el mes`;
    notify.push({ type: 'saldo', text: mensajeSaldo });

    setNotificaciones(notify);
  }, [viewMode, obtenerMesesDisponibles]);

  const handleMesChange = (nuevoMes) => {
    const config = getConfig();

    // Actualizar ambos campos para compatibilidad
    const nuevoConfig = {
      ...config,
      mesActual: nuevoMes,
      mesReferencia: nuevoMes
    };

    saveConfig(nuevoConfig);

    // Recargar datos
    cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="w-full px-4 py-6 space-y-6 overflow-x-clip">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          {viewMode === 'fund' ? 'Resumen del Fondo' : 'Resumen del Mes'}
        </h1>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-toggle__btn ${viewMode === 'fund' ? 'mode-toggle__btn--active' : ''}`}
            onClick={() => setViewMode('fund')}
          >
            <FiBriefcase className="h-4 w-4" />
            Fondo Actual
          </button>
          <button
            className={`mode-toggle__btn ${viewMode === 'historical' ? 'mode-toggle__btn--active' : ''}`}
            onClick={() => setViewMode('historical')}
          >
            <FiCalendar className="h-4 w-4" />
            Vista Histórica
          </button>
        </div>

        {/* Info banner for historical view */}
        {viewMode === 'historical' && (
          <div className="info-banner mt-3">
            <div className="flex items-center gap-2">
              <FiCalendar className="h-4 w-4" />
              <span>Viendo datos históricos</span>
            </div>
            <select
              value={mesActual}
              onChange={(e) => handleMesChange(e.target.value)}
              className="info-banner__select"
            >
              {mesesDisponibles.map(mes => (
                <option key={mes} value={mes}>
                  {new Date(mes + '-01').toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {resumen.isFundMode ? (
          // FUND MODE
          <>
            {/* Hero Card - Main Balance */}
            <div className={`hero-card stats-grid__hero ${resumen.fondoDisponible < 0 ? 'hero-card--negative' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Fondo Disponible</p>
                  <p className="stat-value">{formatearMoneda(resumen.fondoDisponible)}</p>
                  <p className="stat-sublabel">
                    Última nómina: {resumen.ultimaNomina || 'No registrada'}
                  </p>
                </div>
                <div className="stat-icon">
                  <FiBriefcase className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Fixed Expenses Card */}
            <div className="stat-card stat-card--orange">
              <div className="flex items-start justify-between">
                <p className="stat-label">Gastos Fijos</p>
                <div className="stat-icon stat-icon--orange">
                  <FiCreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="stat-value text-orange-600">{formatearMoneda(resumen.totalGastosFijos)}</p>
              <p className="stat-sublabel">Recurrentes mensuales</p>
            </div>

            {/* Real Available Card */}
            <div className={`stat-card ${resumen.disponibleReal < 0 ? 'stat-card--red' : 'stat-card--green'}`}>
              <div className="flex items-start justify-between">
                <p className="stat-label">Disponible Real</p>
                <div className={`stat-icon ${resumen.disponibleReal < 0 ? 'stat-icon--red' : 'stat-icon--green'}`}>
                  {resumen.disponibleReal < 0 ? (
                    <FiTrendingDown className="h-5 w-5" />
                  ) : (
                    <FiTrendingUp className="h-5 w-5" />
                  )}
                </div>
              </div>
              <p className={`stat-value ${resumen.disponibleReal < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {formatearMoneda(resumen.disponibleReal)}
              </p>
              <p className="stat-sublabel">Fondo - Gastos fijos</p>
            </div>
          </>
        ) : (
          // HISTORICAL MODE
          <>
            {/* Income Card */}
            <div className="stat-card stat-card--green">
              <div className="flex items-start justify-between">
                <p className="stat-label">Ingresos Totales</p>
                <button
                  onClick={() => setMostrarIngresos(!mostrarIngresos)}
                  className="stat-icon stat-icon--green"
                  style={{ cursor: 'pointer' }}
                  aria-label={mostrarIngresos ? 'Ocultar ingresos' : 'Mostrar ingresos'}
                >
                  {mostrarIngresos ? (
                    <FiEye className="h-5 w-5" />
                  ) : (
                    <FiEyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="stat-value text-green-600">
                {mostrarIngresos ? formatearMoneda(resumen.totalIngresos) : '••••••'}
              </p>
            </div>

            {/* Fixed Expenses */}
            <div className="stat-card stat-card--orange">
              <div className="flex items-start justify-between">
                <p className="stat-label">Gastos Fijos</p>
                <div className="stat-icon stat-icon--orange">
                  <FiCreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="stat-value text-orange-600">{formatearMoneda(resumen.totalGastosFijos)}</p>
            </div>

            {/* Variable Expenses */}
            <div className="stat-card stat-card--blue">
              <div className="flex items-start justify-between">
                <p className="stat-label">Gastos Variables</p>
                <div className="stat-icon stat-icon--blue">
                  <FiDollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="stat-value text-blue-600">{formatearMoneda(resumen.totalGastosVariables)}</p>
            </div>

            {/* Total Expenses */}
            <div className="stat-card stat-card--red">
              <div className="flex items-start justify-between">
                <p className="stat-label">Gastos Totales</p>
                <div className="stat-icon stat-icon--red">
                  <FiTrendingDown className="h-5 w-5" />
                </div>
              </div>
              <p className="stat-value text-red-500">{formatearMoneda(resumen.totalGastos)}</p>
            </div>

            {/* Remaining Balance */}
            <div className={`stat-card ${resumen.saldoRestante < 0 ? 'stat-card--red' : 'stat-card--green'}`}>
              <div className="flex items-start justify-between">
                <p className="stat-label">Saldo Restante</p>
                <div className={`stat-icon ${resumen.saldoRestante < 0 ? 'stat-icon--red' : 'stat-icon--green'}`}>
                  {resumen.saldoRestante < 0 ? (
                    <FiTrendingDown className="h-5 w-5" />
                  ) : (
                    <FiTrendingUp className="h-5 w-5" />
                  )}
                </div>
              </div>
              <p className={`stat-value ${resumen.saldoRestante < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {formatearMoneda(resumen.saldoRestante)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Notifications */}
      {notificaciones.length > 0 && (
        <div>
          <h2 className="section-title">
            <span className="section-title__icon">
              <FiBell className="h-4 w-4" />
            </span>
            Notificaciones
          </h2>
          <div className="notification-card">
            {notificaciones.map((n, idx) => (
              <div key={idx} className="notification-item">
                <div className={`notification-icon ${n.type === 'cobro' ? 'notification-icon--warning' : 'notification-icon--success'}`}>
                  {n.type === 'cobro' ? (
                    <FiCreditCard className="h-5 w-5" />
                  ) : (
                    <FiCheckCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="notification-content">
                  <p className="notification-text">{n.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <MonthlyChart resumen={resumen} />

      {/* Calendar */}
      <CalendarView />
    </div>
  );
};

export default Dashboard;