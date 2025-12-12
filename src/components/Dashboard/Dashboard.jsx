import { useState, useEffect, useCallback } from 'react';
import {
  getConfig,
  saveConfig,
  getGastosFijos,
  getGastosVariables,
  getIngresos
} from '../../utils/storage';
import { obtenerResumenMes, formatearMoneda, calcularDiaRealCobro, detectarMejorMes } from '../../utils/calculations';
import MonthlyChart from '../Charts/MonthlyChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
    let config = getConfig();
    const gastosFijos = getGastosFijos();
    const gastosVariables = getGastosVariables();
    const ingresos = getIngresos();

    // Detección inteligente: usar mes guardado en config, o detectar automáticamente el mejor
    let mesAMostrar = config.mesReferencia || config.mesActual;

    // Si el mes guardado no tiene datos, usar detección inteligente
    const hayDatosEnMesGuardado =
      gastosVariables.some(g => g.fecha && g.fecha.startsWith(mesAMostrar)) ||
      ingresos.some(i => i.fecha && i.fecha.startsWith(mesAMostrar));

    if (!hayDatosEnMesGuardado) {
      mesAMostrar = detectarMejorMes(gastosVariables, ingresos);

      // Actualizar config con el mes detectado
      config = {
        ...config,
        mesActual: mesAMostrar,
        mesReferencia: mesAMostrar
      };
      saveConfig(config);
    }

    const resumenCalculado = obtenerResumenMes(config, gastosFijos, gastosVariables, ingresos);
    setResumen(resumenCalculado);
    setMesActual(mesAMostrar);
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
    notify.push({ type: 'saldo', text: `Te quedan ${formatearMoneda(resumenCalculado.saldoRestante)} para el mes` });

    setNotificaciones(notify);
  }, [obtenerMesesDisponibles]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Resumen del Mes</h1>

          <div className="flex items-center gap-2">
            <label htmlFor="mes-selector" className="text-sm text-muted-foreground">
              Mes:
            </label>
            <select
              id="mes-selector"
              value={mesActual}
              onChange={(e) => handleMesChange(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <button
              onClick={() => setMostrarIngresos(!mostrarIngresos)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
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