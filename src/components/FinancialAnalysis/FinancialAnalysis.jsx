import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Target,
  PieChart,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { analizarDistribucionFinanciera, calcularProyeccionDeudas } from '../../utils/financialAnalysis';
import { getConfig, getGastosFijos, getGastosVariables, getIngresos } from '../../utils/storage';

/**
 * Componente de Análisis Financiero
 *
 * Muestra un análisis completo de la distribución financiera personal
 * basado en el modelo 50/30/20 (Necesidades/Deseos/Ahorro)
 */
const FinancialAnalysis = ({ updateTrigger }) => {
  const [analisis, setAnalisis] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [proyeccionDeudas, setProyeccionDeudas] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarAnalisis = useCallback(() => {
    try {
      setLoading(true);

      // Obtener datos del storage
      const config = getConfig();
      const gastosFijos = getGastosFijos().filter((g) => g.estado === 'activo');

      // Calcular proyección de deudas
      const proyeccion = calcularProyeccionDeudas(gastosFijos);
      setProyeccionDeudas(proyeccion);

      // IMPORTANTE: Usar gastos deducidos del fondo, NO filtrado mensual
      // En el sistema de fondos, solo nos importan los gastos que ya fueron deducidos
      const gastosVariables = getGastosVariables().filter((g) =>
        g.deductedFromFund === true
      );

      // Calcular ingresos totales - usar fondoDisponible del sistema de fondos
      // Esto representa el dinero real disponible ahora
      const ingresosTotales = parseFloat(config.fondoDisponible || 0);

      // Validar que haya ingresos
      if (ingresosTotales <= 0) {
        setAnalisis(null);
        setLoading(false);
        return;
      }

      // Preparar gastos para análisis
      const gastosParaAnalisis = [
        ...gastosFijos.map((g) => ({
          categoria: g.categoria || g.tipo,
          monto: g.cantidad,
        })),
        ...gastosVariables.map((g) => ({
          categoria: g.categoria || 'General',
          monto: g.cantidad,
        })),
      ];

      // Ejecutar análisis
      const resultado = analizarDistribucionFinanciera(
        ingresosTotales,
        gastosParaAnalisis
      );

      setAnalisis(resultado);
    } catch (error) {
      console.error('Error al cargar análisis:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // construir lista de meses disponibles para selección
  const construirMesesDisponibles = () => {
    const config = getConfig();
    const mesesSet = new Set();
    // añadir mes de referencia
    mesesSet.add(config.mesActual || config.mesReferencia);

    getGastosVariables().forEach(g => {
      if (g.fecha) mesesSet.add(g.fecha.slice(0,7));
    });

    getIngresos().forEach(i => {
      if (i.fecha) mesesSet.add(i.fecha.slice(0,7));
    });

    const meses = Array.from(mesesSet).filter(Boolean).sort().reverse();
    return meses;
  };

  const formatMesLabel = (mes) => {
    try {
      const [y,m] = mes.split('-');
      const d = new Date(parseInt(y,10), parseInt(m,10)-1, 1);
      return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } catch (err) {
      return mes;
    }
  };

  useEffect(() => {
    cargarAnalisis();
  }, [cargarAnalisis]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Cargando análisis...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analisis) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Info className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Configura tu ingreso base para ver el análisis
                </h3>
                <p className="text-muted-foreground">
                  Ve a la pestaña <strong>Ingresos</strong> y configura tu ingreso mensual
                  para obtener recomendaciones financieras personalizadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'exito':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'advertencia':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'critico':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTipoBadgeClass = (tipo) => {
    switch (tipo) {
      case 'exito':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'advertencia':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critico':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Análisis Financiero</h1>
        </div>
        <div>
          <select
            value={mesSeleccionado || getConfig().mesActual || getConfig().mesReferencia}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {construirMesesDisponibles().map((m) => (
              <option key={m} value={m}>{formatMesLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* NUEVA SECCIÓN: ¿Cuánto me queda para gastar? */}
      <Card className="border-2 border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-blue-900 dark:text-blue-100">💰 Tu Presupuesto Este Mes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Disponible AHORA */}
            <div className="bg-card p-4 rounded-lg border-2 border-green-500/30">
              <p className="text-sm text-muted-foreground mb-1">💵 Disponible ahora</p>
              <p className={`text-4xl font-bold ${analisis.presupuestoDisponible.disponibleAhora >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {analisis.presupuestoDisponible.disponibleAhora.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Ingresos - Gastos fijos - Ya gastado
              </p>
            </div>

            {/* Recomendación: cuánto gastar */}
            <div className="bg-card p-4 rounded-lg border-2 border-blue-500/30">
              <p className="text-sm text-muted-foreground mb-1">🎯 Puedes gastar (con ahorro)</p>
              <p className={`text-4xl font-bold ${analisis.presupuestoDisponible.disponibleParaGastar >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {analisis.presupuestoDisponible.disponibleParaGastar.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Reservando {analisis.presupuestoDisponible.ahorroRecomendado.toFixed(2)}€ para ahorro (10%)
              </p>
            </div>
          </div>

          {/* Presupuestos por categoría */}
          <div className="bg-card p-4 rounded-lg space-y-3 border border-border">
            <h4 className="font-semibold text-sm">Presupuestos Sugeridos vs Gastado</h4>

            {/* Necesidades */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>🏠 Necesidades</span>
                <span className={analisis.presupuestoDisponible.excedioPresupuestoNecesidades ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400'}>
                  {analisis.presupuestoDisponible.gastadoNecesidades.toFixed(2)}€ / {analisis.presupuestoDisponible.presupuestoNecesidades.toFixed(2)}€
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${analisis.presupuestoDisponible.excedioPresupuestoNecesidades ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{width: `${Math.min((analisis.presupuestoDisponible.gastadoNecesidades / analisis.presupuestoDisponible.presupuestoNecesidades) * 100, 100)}%`}}
                />
              </div>
            </div>

            {/* Ocio */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>🎮 Ocio/Deseos</span>
                <span className={analisis.presupuestoDisponible.excedioPresupuestoOcio ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400'}>
                  {analisis.presupuestoDisponible.gastadoOcio.toFixed(2)}€ / {analisis.presupuestoDisponible.presupuestoOcio.toFixed(2)}€
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${analisis.presupuestoDisponible.excedioPresupuestoOcio ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{width: `${Math.min((analisis.presupuestoDisponible.gastadoOcio / analisis.presupuestoDisponible.presupuestoOcio) * 100, 100)}%`}}
                />
              </div>
            </div>
          </div>

          {/* Banner informativo sobre el sistema de fondos */}
          <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 p-3 rounded-lg text-sm mt-3">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              💡 Análisis basado en tu fondo disponible actual
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
              Los porcentajes se calculan sobre el dinero real que tienes ahora, no sobre ingresos mensuales estimados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resumen general (simplificado) */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">
                {analisis.ingresosMensuales.toFixed(2)} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastos Fijos (obligatorios)</p>
              <p className="text-2xl font-bold text-orange-600">
                {analisis.presupuestoDisponible.gastosFijos.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">Necesidades + Deudas</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ahorro Real</p>
              <p
                className={`text-2xl font-bold ${
                  analisis.restante >= analisis.presupuestoDisponible.ahorroRecomendado ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {analisis.restante.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">
                {analisis.presupuestoDisponible.cumpleAhorroMinimo ? '✅ Cumples el 10%' : '⚠️ Por debajo del 10%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de sobregasto */}
      {analisis.sobregasto.haySobregasto && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">
                  ¡Alerta de Sobregasto!
                </h3>
                <p className="text-sm text-red-800 mt-1">
                  Estás gastando más de lo que ingresas. Revisa tus gastos para
                  evitar déficit financiero.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución 50/30/20 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Distribución Financiera (Modelo 50/30/20)</CardTitle>
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Objetivo recomendado
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Necesidades */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                <span className="font-medium">Necesidades</span>
              </div>
              <div className="text-right">
                <span className="font-bold">
                  {analisis.desglose.necesidades.porcentaje.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  (Recomendado: {analisis.comparacion.necesidades.recomendado}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(analisis.desglose.necesidades.porcentaje, 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium w-20 text-right">
                {analisis.desglose.necesidades.total.toFixed(2)} €
              </span>
            </div>
            {analisis.comparacion.necesidades.diferencia !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {analisis.comparacion.necesidades.diferencia > 0
                  ? `${analisis.comparacion.necesidades.diferencia.toFixed(1)}% por encima`
                  : `${Math.abs(analisis.comparacion.necesidades.diferencia).toFixed(1)}% por debajo`}
              </p>
            )}
          </div>

          {/* Deseos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full" />
                <span className="font-medium">Deseos</span>
              </div>
              <div className="text-right">
                <span className="font-bold">
                  {analisis.desglose.deseos.porcentaje.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  (Recomendado: {analisis.comparacion.deseos.recomendado}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all"
                  style={{
                    width: `${Math.min(analisis.desglose.deseos.porcentaje, 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium w-20 text-right">
                {analisis.desglose.deseos.total.toFixed(2)} €
              </span>
            </div>
            {analisis.comparacion.deseos.diferencia !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {analisis.comparacion.deseos.diferencia > 0
                  ? `${analisis.comparacion.deseos.diferencia.toFixed(1)}% por encima`
                  : `${Math.abs(analisis.comparacion.deseos.diferencia).toFixed(1)}% por debajo`}
              </p>
            )}
          </div>

          {/* Deudas */}
          {analisis.desglose.deudas && analisis.desglose.deudas.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full" />
                  <span className="font-medium">Deudas/Créditos</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-600">
                    {analisis.desglose.deudas.porcentaje.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Mantener &lt; 30%)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{
                      width: `${Math.min(analisis.desglose.deudas.porcentaje, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-20 text-right">
                  {analisis.desglose.deudas.total.toFixed(2)} €
                </span>
              </div>
              <p className="text-xs text-red-600 mt-1 font-medium">
                Pagos mensuales de créditos y financiación
              </p>
            </div>
          )}

          {/* Ahorro */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
                <span className="font-medium">Ahorro</span>
              </div>
              <div className="text-right">
                <span className="font-bold">
                  {analisis.desglose.ahorro.porcentaje.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  (Recomendado: {analisis.comparacion.ahorro.recomendado}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{
                    width: `${Math.min(analisis.desglose.ahorro.porcentaje, 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium w-20 text-right">
                {analisis.desglose.ahorro.total.toFixed(2)} €
              </span>
            </div>
            {analisis.comparacion.ahorro.diferencia !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {analisis.comparacion.ahorro.diferencia > 0
                  ? `${analisis.comparacion.ahorro.diferencia.toFixed(1)}% por encima`
                  : `${Math.abs(analisis.comparacion.ahorro.diferencia).toFixed(1)}% por debajo`}
              </p>
            )}
          </div>

          {/* Gastos sin clasificar */}
          {analisis.desglose.sin_clasificar && analisis.desglose.sin_clasificar.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <span className="font-medium">Sin clasificar</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-600">
                    {analisis.desglose.sin_clasificar.porcentaje.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 transition-all"
                    style={{
                      width: `${Math.min(analisis.desglose.sin_clasificar.porcentaje, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-20 text-right">
                  {analisis.desglose.sin_clasificar.total.toFixed(2)} €
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Asigna categorías a estos gastos para mejor análisis
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predicción mensual - DESHABILITADO en sistema de fondos */}
      {/* En el sistema de fondos continuos, la predicción mensual no tiene sentido */}
      {/* porque no hay reset mensual. El "presupuesto disponible" ya muestra esto */}

      {/* Proyección de deudas */}
      {proyeccionDeudas && proyeccionDeudas.tieneDeudas && (
        <Card className="border-2 border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-orange-900 dark:text-orange-100">📅 Plan de Salida de Deudas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Resumen de deudas activas</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total de créditos</p>
                  <p className="text-2xl font-bold">{proyeccionDeudas.totalDeudas}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pago mensual total</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {proyeccionDeudas.pagoMensualTotal.toFixed(2)} €
                  </p>
                </div>
              </div>
            </div>

            {proyeccionDeudas.proximaATerminar && (
              <div className="bg-green-500/10 border-2 border-green-500/30 p-4 rounded-lg">
                <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  🎯 Próximo crédito a terminar
                </p>
                <div className="space-y-1">
                  <p className="text-lg font-bold">{proyeccionDeudas.proximaATerminar.nombre}</p>
                  <p className="text-sm">
                    En <span className="font-bold">{proyeccionDeudas.proximaATerminar.cuotasRestantes} meses</span> liberarás{' '}
                    <span className="font-bold text-green-700 dark:text-green-400">{proyeccionDeudas.proximaATerminar.cantidad.toFixed(2)} €/mes</span>
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card p-4 rounded-lg space-y-3 border border-border">
              <h4 className="font-semibold text-sm">Calendario de liberación</h4>
              {proyeccionDeudas.todasLasDeudas.map((deuda, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{deuda.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {deuda.cuotasRestantes} meses restantes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{deuda.cuotaMensual.toFixed(2)} €/mes</p>
                    <p className="text-xs text-green-600">+{deuda.dineroQueSeLibera.toFixed(2)} € al terminar</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-100 border-2 border-blue-300 p-4 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">💡 Estrategia recomendada</p>
              <ul className="text-sm space-y-1 text-blue-800">
                <li>• Cuando termines un crédito, NO adquieras nuevos gastos</li>
                <li>• Destina ese dinero a ahorrar o pagar otras deudas</li>
                <li>• Al final liberarás {proyeccionDeudas.pagoMensualTotal.toFixed(2)}€/mes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugerencias */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">
          Recomendaciones Personalizadas
        </h2>
        {analisis.sugerencias.map((sugerencia, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {getTipoIcon(sugerencia.tipo)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTipoBadgeClass(sugerencia.tipo)}>
                      {sugerencia.tipo}
                    </Badge>
                    {sugerencia.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {sugerencia.categoria}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium mb-1">{sugerencia.mensaje}</p>
                  <p className="text-sm text-muted-foreground">{sugerencia.accion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FinancialAnalysis;
