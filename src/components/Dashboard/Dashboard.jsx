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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Eye, EyeOff } from 'lucide-react';

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
    <div className="w-full lg:max-w-7xl lg:mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {viewMode === 'fund' ? 'Resumen del Fondo' : 'Resumen del Mes'}
        </h1>

        {/* Selector de modo: Fondo vs Histórico */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          <Button
            variant={viewMode === 'fund' ? 'default' : 'outline'}
            onClick={() => setViewMode('fund')}
            size="sm"
          >
            💰 Fondo Actual
          </Button>
          <Button
            variant={viewMode === 'historical' ? 'default' : 'outline'}
            onClick={() => setViewMode('historical')}
            size="sm"
          >
            📅 Vista Histórica
          </Button>
        </div>

        {/* Banner para vista histórica */}
        {viewMode === 'historical' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 rounded text-sm text-blue-800 dark:text-blue-200 flex items-center justify-between">
            <span>📅 Viendo datos históricos del mes seleccionado</span>
            <div className="flex items-center gap-2">
              <label htmlFor="mes-selector" className="text-xs">
                Mes:
              </label>
              <select
                id="mes-selector"
                value={mesActual}
                onChange={(e) => handleMesChange(e.target.value)}
                className="px-2 py-1 border border-input bg-background text-foreground rounded text-xs focus:outline-none focus:ring-2 focus:ring-ring"
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
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resumen.isFundMode ? (
          // MODO FONDO: Mostrar balance del fondo
          <>
            <Card className="md:col-span-2 border-2 border-green-500/30 bg-green-50 dark:bg-green-900/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">💰 Fondo Disponible Actual</CardTitle>
                <Wallet className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatearMoneda(resumen.fondoDisponible)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Última nómina: {resumen.ultimaNomina || 'No registrada'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Fijos (Mensuales)</CardTitle>
                <CreditCard className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatearMoneda(resumen.totalGastosFijos)}
                </div>
                <p className="text-xs text-muted-foreground">Recurrentes cada mes</p>
              </CardContent>
            </Card>

            <Card className={resumen.disponibleReal < 0 ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-green-500'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponible Real</CardTitle>
                {resumen.disponibleReal < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${resumen.disponibleReal < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatearMoneda(resumen.disponibleReal)}
                </div>
                <p className="text-xs text-muted-foreground">Fondo - Gastos fijos</p>
              </CardContent>
            </Card>
          </>
        ) : (
          // MODO HISTÓRICO: Mantener cards mensuales existentes
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <button
                  onClick={() => setMostrarIngresos(!mostrarIngresos)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  aria-label={mostrarIngresos ? 'Ocultar ingresos' : 'Mostrar ingresos'}
                >
                  {mostrarIngresos ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {mostrarIngresos ? formatearMoneda(resumen.totalIngresos) : '••••••'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Fijos</CardTitle>
                <CreditCard className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatearMoneda(resumen.totalGastosFijos)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Variables</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatearMoneda(resumen.totalGastosVariables)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatearMoneda(resumen.totalGastos)}
                </div>
              </CardContent>
            </Card>

            <Card className={resumen.saldoRestante < 0 ? 'border-red-500' : 'border-green-500'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Restante</CardTitle>
                {resumen.saldoRestante < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${resumen.saldoRestante < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatearMoneda(resumen.saldoRestante)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {notificaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notificaciones.map((n, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="text-sm text-foreground">{n.text}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <MonthlyChart resumen={resumen} />
    </div>
  );
};

export default Dashboard;