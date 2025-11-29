import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Target,
  PieChart,
} from 'lucide-react';
import { analizarDistribucionFinanciera } from '../../utils/financialAnalysis';
import { getConfig, getGastosFijos, getGastosVariables, getIngresos } from '../../utils/storage';
import { calcularTotalIngresos } from '../../utils/calculations';

/**
 * Componente de Análisis Financiero
 *
 * Muestra un análisis completo de la distribución financiera personal
 * basado en el modelo 50/30/20 (Necesidades/Deseos/Ahorro)
 */
const FinancialAnalysis = ({ updateTrigger }) => {
  const [analisis, setAnalisis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAnalisis();
  }, [updateTrigger]);

  const cargarAnalisis = () => {
    try {
      setLoading(true);

      // Obtener datos del storage
      const config = getConfig();
      const gastosFijos = getGastosFijos().filter((g) => g.estado === 'activo');
      const gastosVariables = getGastosVariables().filter((g) =>
        g.fecha.startsWith(config.mesActual)
      );
      const ingresosAdicionales = getIngresos().filter((i) =>
        i.fecha.startsWith(config.mesActual)
      );

      // Calcular ingresos totales
      const ingresosTotales = parseFloat(config.incomeBase || 0) + calcularTotalIngresos(ingresosAdicionales, config.mesActual);

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
  };

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
      <div className="flex items-center gap-2">
        <PieChart className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">Análisis Financiero</h1>
      </div>

      {/* Resumen general */}
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
              <p className="text-sm text-muted-foreground">Total Gastado</p>
              <p className="text-2xl font-bold">
                {analisis.totalGastos.toFixed(2)} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Restante</p>
              <p
                className={`text-2xl font-bold ${
                  analisis.restante >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {analisis.restante.toFixed(2)} €
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
        </CardContent>
      </Card>

      {/* Predicción mensual */}
      {analisis.prediccion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predicción del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{analisis.prediccion.mensaje}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Gastado hasta ahora</p>
                <p className="text-xl font-bold">
                  {analisis.prediccion.totalActual.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gasto proyectado</p>
                <p className="text-xl font-bold">
                  {analisis.prediccion.gastoProyectado.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio diario</p>
                <p className="text-xl font-bold">
                  {analisis.prediccion.promedioDiario.toFixed(2)} €
                </p>
              </div>
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
