import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui-simple/Card';
import { Badge } from '../ui-simple/Badge';
import { Button } from '../ui-simple/Button';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiTarget,
  FiPieChart,
  FiCreditCard,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiZap,
  FiAward
} from 'react-icons/fi';
import {
  analizarDistribucionFinanciera,
  calcularProyeccionConEstrategia,
  simularPagoExtra,
  calcularPronosticoFinDeMes
} from '../../utils/financialAnalysis';
import {
  getConfig,
  getGastosFijos,
  getGastosVariables,
  getIngresos,
  getSobres
} from '../../utils/storage';

// Importar nuevos componentes
import EnvelopeBudgeting from '../EnvelopeBudgeting/EnvelopeBudgeting';
import SavingsGoals from '../SavingsGoals/SavingsGoals';

// ============ SUGERENCIAS INTELIGENTES ============

const generarSugerenciasInteligentes = (todosGastosFijos, config) => {
  const sugerencias = [];
  const activos = todosGastosFijos.filter(g => g.estado === 'activo');
  const finalizados = todosGastosFijos.filter(g => g.estado === 'finalizado');
  const incomeBase = config.incomeBase || 0;

  // 1. Microsoft OneDrive redundante si hay Microsoft 365
  const tiene365 = activos.find(g => g.nombre.toLowerCase().includes('microsoft 365') || g.nombre.toLowerCase().includes('microsoft365'));
  const tieneOneDrive = activos.find(g => g.nombre.toLowerCase().includes('onedrive'));
  if (tiene365 && tieneOneDrive) {
    sugerencias.push({
      tipo: 'redundancia',
      prioridad: 1,
      icono: '💸',
      titulo: 'OneDrive separado es redundante',
      descripcion: `Microsoft 365 (${tiene365.cantidad}€/mes) ya incluye 1TB de OneDrive. Tienes además "Microsoft OneDrive" como suscripción independiente (${tieneOneDrive.cantidad}€/mes).`,
      accion: `Cancela Microsoft OneDrive. Ahorro: ${tieneOneDrive.cantidad}€/mes → ${(tieneOneDrive.cantidad * 12).toFixed(2)}€/año.`,
      ahorroMensual: tieneOneDrive.cantidad,
    });
  }

  // 2. Múltiples servicios de almacenamiento en la nube
  const almacenamiento = activos.filter(g =>
    g.categoria === 'Almacenamiento' ||
    g.nombre.toLowerCase().includes('google one') ||
    g.nombre.toLowerCase().includes('amazon photos') ||
    g.nombre.toLowerCase().includes('onedrive')
  );
  if (almacenamiento.length >= 3) {
    const totalAlmacenamiento = almacenamiento.reduce((sum, g) => sum + g.cantidad, 0);
    const minimo = Math.min(...almacenamiento.map(g => g.cantidad));
    sugerencias.push({
      tipo: 'redundancia',
      prioridad: 2,
      icono: '☁️',
      titulo: `${almacenamiento.length} servicios de almacenamiento activos`,
      descripcion: `Tienes: ${almacenamiento.map(g => `${g.nombre} (${g.cantidad}€/mes)`).join(' · ')}. Total: ${totalAlmacenamiento.toFixed(2)}€/mes.`,
      accion: 'Elige una plataforma principal. Microsoft 365 incluye OneDrive, y Amazon Photos puede estar cubierto por Amazon Prime. Podrías reducir esto a 1 servicio.',
      ahorroMensual: totalAlmacenamiento - minimo,
    });
  }

  // 3. Amazon Photos (posiblemente incluido en Prime)
  const amazonPhotos = activos.find(g => g.nombre.toLowerCase().includes('amazon photos'));
  if (amazonPhotos && !tiene365) {
    sugerencias.push({
      tipo: 'atencion',
      prioridad: 3,
      icono: '📦',
      titulo: 'Amazon Photos podría ser gratuito',
      descripcion: `Pagas ${amazonPhotos.cantidad}€/mes por Amazon Photos de forma independiente.`,
      accion: 'Verifica si tienes Amazon Prime: en ese caso, Amazon Photos ya está incluido sin coste adicional. Potencial ahorro de ' + amazonPhotos.cantidad + '€/mes.',
      ahorroMensual: amazonPhotos.cantidad,
    });
  }

  // 4. Resumen entretenimiento
  const entretenimiento = activos.filter(g => g.categoria === 'Entretenimiento');
  if (entretenimiento.length >= 2) {
    const totalEntretenimiento = entretenimiento.reduce((sum, g) => sum + g.cantidad, 0);
    const porcentajeNomina = incomeBase > 0 ? (totalEntretenimiento / incomeBase) * 100 : 0;
    sugerencias.push({
      tipo: porcentajeNomina > 5 ? 'atencion' : 'positivo',
      prioridad: 4,
      icono: '🎮',
      titulo: `Entretenimiento: ${totalEntretenimiento.toFixed(2)}€/mes (${porcentajeNomina.toFixed(1)}% de nómina)`,
      descripcion: `${entretenimiento.length} suscripciones activas: ${entretenimiento.map(g => g.nombre).join(', ')}.`,
      accion: porcentajeNomina > 5
        ? '¿Usas todas activamente? Considera rotar servicios (p.ej. pausar uno 3 meses y reactivar otro).'
        : 'Porcentaje dentro de lo razonable. Sigue monitorizando si añades nuevas suscripciones.',
      ahorroMensual: null,
    });
  }

  // 5. Celebrar deudas liquidadas
  const creditosLiquidados = finalizados.filter(g => g.tipo === 'credito' && g.cuotasRestantes === 0);
  if (creditosLiquidados.length > 0) {
    const flujoLiberado = creditosLiquidados.reduce((sum, g) => sum + g.cantidad, 0);
    sugerencias.push({
      tipo: 'positivo',
      prioridad: 5,
      icono: '🎉',
      titulo: `${creditosLiquidados.length} deudas eliminadas`,
      descripcion: `Deudas cerradas: ${creditosLiquidados.map(g => g.nombre).join(', ')}.`,
      accion: `Has liberado ${flujoLiberado.toFixed(2)}€/mes en flujo de caja que antes iban a intereses. Eso son ${(flujoLiberado * 12).toFixed(2)}€ más al año en tu bolsillo.`,
      ahorroMensual: flujoLiberado,
    });
  }

  // 6. Ratio deuda/ingreso actual
  const deudas = activos.filter(g => g.tipo === 'credito');
  if (deudas.length > 0 && incomeBase > 0) {
    const totalDeudas = deudas.reduce((sum, g) => sum + g.cantidad, 0);
    const ratioDeuda = (totalDeudas / incomeBase) * 100;
    if (ratioDeuda < 20) {
      sugerencias.push({
        tipo: 'positivo',
        prioridad: 6,
        icono: '✅',
        titulo: `Ratio deuda/ingreso saludable: ${ratioDeuda.toFixed(1)}%`,
        descripcion: `Tu cuota mensual de deuda (${totalDeudas.toFixed(2)}€) representa el ${ratioDeuda.toFixed(1)}% de tu nómina (${incomeBase.toFixed(2)}€).`,
        accion: 'El umbral de riesgo se sitúa en el 30-35%. Estás muy por debajo, lo que te da margen real de maniobra y capacidad de ahorro.',
        ahorroMensual: null,
      });
    } else if (ratioDeuda > 30) {
      sugerencias.push({
        tipo: 'atencion',
        prioridad: 1,
        icono: '⚠️',
        titulo: `Ratio deuda/ingreso elevado: ${ratioDeuda.toFixed(1)}%`,
        descripcion: `Tu cuota mensual de deuda (${totalDeudas.toFixed(2)}€) representa el ${ratioDeuda.toFixed(1)}% de tu nómina.`,
        accion: 'Prioriza eliminar deudas antes de adquirir nuevos compromisos. Considera aplicar la estrategia avalanche para reducir intereses.',
        ahorroMensual: null,
      });
    }
  }

  // 7. Detectar suscripciones de trabajo duplicadas (IA)
  const susIA = activos.filter(g =>
    g.nombre.toLowerCase().includes('claude') ||
    g.nombre.toLowerCase().includes('chatgpt') ||
    g.nombre.toLowerCase().includes('openai')
  );
  if (susIA.length >= 2) {
    const totalIA = susIA.reduce((sum, g) => sum + g.cantidad, 0);
    sugerencias.push({
      tipo: 'redundancia',
      prioridad: 2,
      icono: '🤖',
      titulo: `${susIA.length} asistentes IA activos`,
      descripcion: `Tienes: ${susIA.map(g => `${g.nombre} (${g.cantidad}€/mes)`).join(' · ')}. Total: ${totalIA.toFixed(2)}€/mes.`,
      accion: '¿Usas ambos de forma regular? Si uno cubre el 90% de tus necesidades, considera cancelar el otro.',
      ahorroMensual: Math.min(...susIA.map(g => g.cantidad)),
    });
  }

  return sugerencias.sort((a, b) => a.prioridad - b.prioridad);
};

/**
 * Componente de Análisis Financiero Mejorado
 *
 * Incluye:
 * - Sistema de sobres (envelope budgeting) - PRIORIDAD 1
 * - Metas de ahorro motivadoras - PRIORIDAD 2
 * - Proyección de deudas con snowball/avalanche - PRIORIDAD 3
 * - Alertas en tiempo real y pronóstico - PRIORIDAD 4
 * - Sugerencias inteligentes automáticas - PRIORIDAD 5
 */
const FinancialAnalysis = ({ updateTrigger }) => {
  const [analisis, setAnalisis] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [proyeccionDeudas, setProyeccionDeudas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sobresData, setSobresData] = useState(null);
  const [pronostico, setPronostico] = useState(null);

  // Estados para mejoras de deuda
  const [estrategiaDeuda, setEstrategiaDeuda] = useState('snowball');
  const [pagoExtraSimulado, setPagoExtraSimulado] = useState('');
  const [simulacionActiva, setSimulacionActiva] = useState(null);

  // Sección activa (tabs internos)
  const [seccionActiva, setSeccionActiva] = useState('sobres');
  const [sugerenciasInteligentes, setSugerenciasInteligentes] = useState([]);

  const cargarAnalisis = useCallback(() => {
    try {
      setLoading(true);

      const config = getConfig();
      const todosGastosFijos = getGastosFijos();
      const gastosFijos = todosGastosFijos.filter((g) => g.estado === 'activo');

      // Generar sugerencias inteligentes con todos los gastos (activos + finalizados)
      setSugerenciasInteligentes(generarSugerenciasInteligentes(todosGastosFijos, config));

      // Calcular proyección de deudas con estrategia seleccionada
      const proyeccion = calcularProyeccionConEstrategia(gastosFijos, estrategiaDeuda);
      setProyeccionDeudas(proyeccion);

      // Cargar datos de sobres
      const sobres = getSobres();
      setSobresData(sobres);

      // Usar gastos deducidos del fondo
      const gastosVariables = getGastosVariables().filter((g) =>
        g.deductedFromFund === true
      );

      const ingresosTotales = parseFloat(config.fondoDisponible || 0);

      // Calcular pronóstico de fin de mes
      const hoy = new Date();
      const diaActual = hoy.getDate();
      const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();

      // Estimar fondo inicial del mes (aproximación)
      const totalGastadoEsteMes = gastosVariables
        .filter(g => g.fecha && g.fecha.startsWith(hoy.toISOString().slice(0, 7)))
        .reduce((sum, g) => sum + parseFloat(g.cantidad), 0);

      const fondoInicialEstimado = ingresosTotales + totalGastadoEsteMes;

      if (fondoInicialEstimado > 0 && diaActual > 1) {
        const pronosticoCalculado = calcularPronosticoFinDeMes(
          fondoInicialEstimado,
          ingresosTotales,
          diaActual,
          diasEnMes
        );
        setPronostico(pronosticoCalculado);
      }

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
  }, [estrategiaDeuda]);

  // Manejar simulación de pago extra
  const handleSimulacion = useCallback(() => {
    if (!pagoExtraSimulado || parseFloat(pagoExtraSimulado) <= 0) {
      setSimulacionActiva(null);
      return;
    }

    const gastosFijos = getGastosFijos().filter((g) => g.estado === 'activo');
    const resultado = simularPagoExtra(gastosFijos, parseFloat(pagoExtraSimulado), estrategiaDeuda);
    setSimulacionActiva(resultado.simulacion);
  }, [pagoExtraSimulado, estrategiaDeuda]);

  // Construir lista de meses disponibles para selección
  const construirMesesDisponibles = () => {
    const config = getConfig();
    const mesesSet = new Set();
    mesesSet.add(config.mesActual || config.mesReferencia);

    getGastosVariables().forEach(g => {
      if (g.fecha) mesesSet.add(g.fecha.slice(0, 7));
    });

    getIngresos().forEach(i => {
      if (i.fecha) mesesSet.add(i.fecha.slice(0, 7));
    });

    return Array.from(mesesSet).filter(Boolean).sort().reverse();
  };

  const formatMesLabel = (mes) => {
    try {
      const [y, m] = mes.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } catch (err) {
      return mes;
    }
  };

  useEffect(() => {
    cargarAnalisis();
  }, [cargarAnalisis, updateTrigger]);

  // Callback cuando se actualizan los sobres
  const handleSobresUpdate = (nuevosSobres) => {
    setSobresData(nuevosSobres);
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'exito':
        return <FiCheckCircle className="h-5 w-5 text-green-600" />;
      case 'advertencia':
        return <FiAlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'critico':
        return <FiAlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <FiInfo className="h-5 w-5 text-blue-600" />;
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

  if (loading) {
    return (
      <div className="w-full lg:mx-auto px-4 py-6">
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
      <div className="w-full lg:mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FiInfo className="h-12 w-12 mx-auto text-muted-foreground" />
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

  const disponibleParaGastar = analisis.presupuestoDisponible.disponibleParaGastar;
  const alertaCritica = disponibleParaGastar < 100;

  return (
    <div className="w-full px-4 py-6 space-y-6 overflow-x-clip">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FiPieChart className="h-6 w-6" />
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

      {/* ALERTA CRÍTICA: Disponible < 100 EUR */}
      {alertaCritica && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full shrink-0">
                <FiAlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                  ¡Tu disponible está por debajo de 100 EUR!
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-3">
                  Solo tienes <strong>{disponibleParaGastar.toFixed(2)} EUR</strong> disponibles para gastar.
                  Es momento de tomar acción inmediata.
                </p>
                <div className="bg-red-100 dark:bg-red-800/50 p-3 rounded-lg">
                  <p className="font-semibold text-red-900 dark:text-red-100 mb-2">Acciones inmediatas:</p>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    <li>• Revisa los sobres de Ocio - ¿puedes mover dinero a necesidades?</li>
                    <li>• Pospón cualquier gasto no esencial esta semana</li>
                    <li>• Busca ingresos extra urgentes si es posible</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PRONÓSTICO DE FIN DE MES */}
      {pronostico && (
        <Card className={`border-2 ${
          pronostico.nivelAlerta === 'critico' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
          pronostico.nivelAlerta === 'advertencia' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
          'border-green-500 bg-green-50 dark:bg-green-900/10'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {pronostico.nivelAlerta === 'critico' ? (
                <FiTrendingDown className="h-6 w-6 text-red-600" />
              ) : pronostico.nivelAlerta === 'advertencia' ? (
                <FiAlertTriangle className="h-6 w-6 text-yellow-600" />
              ) : (
                <FiTrendingUp className="h-6 w-6 text-green-600" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  pronostico.nivelAlerta === 'critico' ? 'text-red-900 dark:text-red-100' :
                  pronostico.nivelAlerta === 'advertencia' ? 'text-yellow-900 dark:text-yellow-100' :
                  'text-green-900 dark:text-green-100'
                }`}>
                  Pronóstico de Fin de Mes
                </h3>
                <p className={`text-sm mt-1 ${
                  pronostico.nivelAlerta === 'critico' ? 'text-red-700 dark:text-red-300' :
                  pronostico.nivelAlerta === 'advertencia' ? 'text-yellow-700 dark:text-yellow-300' :
                  'text-green-700 dark:text-green-300'
                }`}>
                  {pronostico.mensaje}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                  <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <span className="text-muted-foreground block">Gastado</span>
                    <span className="font-bold">{pronostico.gastadoHastaAhora.toFixed(2)} EUR</span>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <span className="text-muted-foreground block">Promedio/día</span>
                    <span className="font-bold">{pronostico.promedioDiario.toFixed(2)} EUR</span>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <span className="text-muted-foreground block">Días restantes</span>
                    <span className="font-bold">{pronostico.diasRestantes}</span>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <span className="text-muted-foreground block">Proyección</span>
                    <span className={`font-bold ${
                      pronostico.fondoProyectadoFinMes < 0 ? 'text-red-600' :
                      pronostico.fondoProyectadoFinMes < 100 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {pronostico.fondoProyectadoFinMes.toFixed(2)} EUR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NAVEGACIÓN DE SECCIONES */}
      <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
        <Button
          variant={seccionActiva === 'sobres' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSeccionActiva('sobres')}
          className="flex-1 md:flex-none"
        >
          <FiTarget className="h-4 w-4 mr-2" />
          Sobres
        </Button>
        <Button
          variant={seccionActiva === 'metas' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSeccionActiva('metas')}
          className="flex-1 md:flex-none"
        >
          <FiAward className="h-4 w-4 mr-2" />
          Metas
        </Button>
        <Button
          variant={seccionActiva === 'deudas' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSeccionActiva('deudas')}
          className="flex-1 md:flex-none"
        >
          <FiCreditCard className="h-4 w-4 mr-2" />
          Deudas
        </Button>
        <Button
          variant={seccionActiva === 'analisis' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSeccionActiva('analisis')}
          className="flex-1 md:flex-none"
        >
          <FiPieChart className="h-4 w-4 mr-2" />
          50/30/20
        </Button>
        <Button
          variant={seccionActiva === 'sugerencias' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSeccionActiva('sugerencias')}
          className="flex-1 md:flex-none relative"
        >
          <FiZap className="h-4 w-4 mr-2" />
          Sugerencias
          {sugerenciasInteligentes.filter(s => s.tipo === 'redundancia' || s.tipo === 'atencion').length > 0 && (
            <span className="ml-1.5 bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
              {sugerenciasInteligentes.filter(s => s.tipo === 'redundancia' || s.tipo === 'atencion').length}
            </span>
          )}
        </Button>
      </div>

      {/* SECCIÓN: SISTEMA DE SOBRES */}
      {seccionActiva === 'sobres' && (
        <EnvelopeBudgeting onSobresUpdate={handleSobresUpdate} />
      )}

      {/* SECCIÓN: METAS DE AHORRO */}
      {seccionActiva === 'metas' && (
        <SavingsGoals
          fondoDisponible={analisis.presupuestoDisponible.disponibleAhora}
          sobresData={sobresData}
        />
      )}

      {/* SECCIÓN: PROYECCIÓN DE DEUDAS MEJORADA */}
      {seccionActiva === 'deudas' && proyeccionDeudas && (
        <div className="space-y-4">
          {!proyeccionDeudas.tieneDeudas ? (
            <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🎉</span>
                  <div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                      ¡No tienes deudas activas!
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      Aprovecha para aumentar tu fondo de emergencia y metas de ahorro.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header de deudas con toggle de estrategia */}
              <Card className="border-2 border-orange-500/20 bg-orange-500/5">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <FiCreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      <CardTitle className="text-orange-900 dark:text-orange-100">
                        Plan de Salida de Deudas
                      </CardTitle>
                    </div>
                    {/* Toggle de estrategia */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm whitespace-nowrap">Estrategia:</Label>
                      <select
                        value={estrategiaDeuda}
                        onChange={(e) => setEstrategiaDeuda(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      >
                        <option value="snowball">Snowball (motivación)</option>
                        <option value="avalanche">Avalanche (ahorro)</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Explicación de la estrategia */}
                  <div className={`p-3 rounded-lg ${
                    estrategiaDeuda === 'snowball'
                      ? 'bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700'
                      : 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
                  }`}>
                    <p className={`text-sm font-medium ${
                      estrategiaDeuda === 'snowball'
                        ? 'text-purple-900 dark:text-purple-100'
                        : 'text-blue-900 dark:text-blue-100'
                    }`}>
                      {estrategiaDeuda === 'snowball'
                        ? '⚡ Snowball: Paga primero las deudas más pequeñas para ganar impulso motivacional'
                        : '💰 Avalanche: Paga primero las deudas con mayor interés para ahorrar más dinero'
                      }
                    </p>
                  </div>

                  {/* Resumen */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Total deudas</p>
                      <p className="text-2xl font-bold">{proyeccionDeudas.totalDeudas}</p>
                    </div>
                    <div className="bg-card p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Pago mensual</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {proyeccionDeudas.pagoMensualTotal.toFixed(2)} EUR
                      </p>
                    </div>
                    <div className="bg-card p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Meses restantes</p>
                      <p className="text-2xl font-bold">{proyeccionDeudas.mesesHastaLibertad}</p>
                    </div>
                    <div className="bg-card p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Libertad en</p>
                      <p className="text-lg font-bold">
                        {new Date(new Date().setMonth(new Date().getMonth() + proyeccionDeudas.mesesHastaLibertad))
                          .toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Próxima a terminar destacada */}
                  {proyeccionDeudas.proximaATerminar && (
                    <div className="bg-green-500/10 border-2 border-green-500/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FiZap className="h-5 w-5 text-green-600" />
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          ¡Tu siguiente victoria!
                        </p>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <p className="text-lg font-bold">{proyeccionDeudas.proximaATerminar.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            Termina en {proyeccionDeudas.proximaATerminar.cuotasRestantes} meses
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Al terminar liberarás</p>
                          <p className="text-2xl font-bold text-green-600">
                            +{proyeccionDeudas.proximaATerminar.cantidad.toFixed(2)} EUR/mes
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Simulador de pago extra */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FiDollarSign className="h-5 w-5" />
                    Simulador de Pago Extra
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    ¿Qué pasaría si pudieras pagar un poco más cada mes?
                  </p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Label>Pago extra mensual (EUR)</Label>
                      <Input
                        type="number"
                        step="10"
                        min="0"
                        placeholder="50"
                        value={pagoExtraSimulado}
                        onChange={(e) => setPagoExtraSimulado(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleSimulacion}>
                        Simular
                      </Button>
                    </div>
                  </div>

                  {/* Resultado de la simulación */}
                  {simulacionActiva && (
                    <div className="bg-green-100 dark:bg-green-900/20 border-2 border-green-500 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🚀</span>
                        <p className="font-bold text-green-900 dark:text-green-100">
                          {simulacionActiva.mensaje}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Sin pago extra</span>
                          <span className="font-bold">{simulacionActiva.mesesOriginales} meses</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Con pago extra</span>
                          <span className="font-bold text-green-600">{simulacionActiva.mesesConExtra} meses</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Tiempo ahorrado</span>
                          <span className="font-bold text-green-600">{simulacionActiva.mesesAhorrados} meses</span>
                        </div>
                      </div>
                      {simulacionActiva.interesAhorradoEstimado > 0 && (
                        <p className="text-sm mt-2 text-green-700 dark:text-green-300">
                          Intereses ahorrados estimados: ~{simulacionActiva.interesAhorradoEstimado.toFixed(2)} EUR
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista ordenada de deudas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FiCalendar className="h-5 w-5" />
                    Orden de Pago ({proyeccionDeudas.estrategiaNombre})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {proyeccionDeudas.ordenDePago.map((deuda, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          deuda.esLaSiguiente
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                            : 'bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            deuda.esLaSiguiente
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {deuda.posicion}
                          </div>
                          <div>
                            <p className="font-medium">{deuda.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {deuda.cuotasRestantes} cuotas restantes
                              {deuda.tasaInteres && ` • ${deuda.tasaInteres}% TAE`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{deuda.cuotaMensual.toFixed(2)} EUR/mes</p>
                          <p className="text-xs text-green-600">
                            Libera +{deuda.dineroQueSeLibera.toFixed(2)} EUR
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Consejo estratégico */}
              <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FiInfo className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Estrategia recomendada
                      </p>
                      <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• Cuando termines "{proyeccionDeudas.proximaATerminar?.nombre}", NO gastes ese dinero</li>
                        <li>• Destina los {proyeccionDeudas.proximaATerminar?.cantidad.toFixed(2)} EUR extra a la siguiente deuda</li>
                        <li>• Este "efecto bola de nieve" acelera tu libertad financiera</li>
                        <li>• Al final liberarás {proyeccionDeudas.pagoMensualTotal.toFixed(2)} EUR/mes para ahorro e inversión</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* SECCIÓN: SUGERENCIAS INTELIGENTES */}
      {seccionActiva === 'sugerencias' && (
        <div className="space-y-4">
          {/* Header con resumen de ahorro potencial */}
          {(() => {
            const ahorroTotal = sugerenciasInteligentes.reduce((sum, s) => sum + (s.ahorroMensual || 0), 0);
            const accionables = sugerenciasInteligentes.filter(s => s.tipo === 'redundancia' || s.tipo === 'atencion');
            return (
              <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                      <FiZap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">
                        Sugerencias Inteligentes
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Análisis automático de optimización financiera · {sugerenciasInteligentes.length} hallazgos
                      </p>
                    </div>
                  </div>
                  {ahorroTotal > 0 && accionables.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white/70 dark:bg-black/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Ahorro potencial mensual</p>
                        <p className="text-2xl font-bold text-green-600">{ahorroTotal.toFixed(2)} EUR</p>
                      </div>
                      <div className="bg-white/70 dark:bg-black/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Ahorro potencial anual</p>
                        <p className="text-2xl font-bold text-green-600">{(ahorroTotal * 12).toFixed(2)} EUR</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Tarjetas de sugerencias */}
          {sugerenciasInteligentes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <FiCheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="font-semibold text-lg">Todo en orden</p>
                  <p className="text-sm text-muted-foreground">No se detectan redundancias ni puntos de mejora en este momento.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sugerenciasInteligentes.map((sug, index) => {
              const borderColor = sug.tipo === 'positivo'
                ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                : sug.tipo === 'redundancia'
                ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10'
                : sug.tipo === 'atencion'
                ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10'
                : 'border-blue-200 bg-blue-50 dark:bg-blue-900/10';

              const labelColor = sug.tipo === 'positivo'
                ? 'bg-green-100 text-green-800 border-green-200'
                : sug.tipo === 'redundancia'
                ? 'bg-orange-100 text-orange-800 border-orange-200'
                : sug.tipo === 'atencion'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                : 'bg-blue-100 text-blue-800 border-blue-200';

              const labelText = sug.tipo === 'positivo' ? 'Buenas noticias'
                : sug.tipo === 'redundancia' ? 'Redundancia detectada'
                : sug.tipo === 'atencion' ? 'Atención'
                : 'Sugerencia';

              return (
                <Card key={index} className={`border ${borderColor}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{sug.icono}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`text-xs border ${labelColor}`}>
                            {labelText}
                          </Badge>
                          {sug.ahorroMensual != null && (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                              Ahorro: {sug.ahorroMensual.toFixed(2)} EUR/mes
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold mb-1">{sug.titulo}</p>
                        <p className="text-sm text-muted-foreground mb-2">{sug.descripcion}</p>
                        <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 border border-border/50">
                          <p className="text-sm font-medium">
                            <span className="text-muted-foreground mr-1">Accion:</span>
                            {sug.accion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* SECCIÓN: ANÁLISIS 50/30/20 */}
      {seccionActiva === 'analisis' && (
        <div className="space-y-6">
          {/* Tu Presupuesto Este Mes */}
          <Card className="border-2 border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FiPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-blue-900 dark:text-blue-100">Tu Presupuesto Este Mes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-4 rounded-lg border-2 border-green-500/30">
                  <p className="text-sm text-muted-foreground mb-1">Disponible ahora</p>
                  <p className={`text-4xl font-bold ${analisis.presupuestoDisponible.disponibleAhora >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {analisis.presupuestoDisponible.disponibleAhora.toFixed(2)} EUR
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ingresos - Gastos fijos - Ya gastado
                  </p>
                </div>

                <div className="bg-card p-4 rounded-lg border-2 border-blue-500/30">
                  <p className="text-sm text-muted-foreground mb-1">Puedes gastar (con ahorro)</p>
                  <p className={`text-4xl font-bold ${analisis.presupuestoDisponible.disponibleParaGastar >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {analisis.presupuestoDisponible.disponibleParaGastar.toFixed(2)} EUR
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Reservando {analisis.presupuestoDisponible.ahorroRecomendado.toFixed(2)} EUR para ahorro (10%)
                  </p>
                </div>
              </div>

              {/* Presupuestos por categoría */}
              <div className="bg-card p-4 rounded-lg space-y-3 border border-border">
                <h4 className="font-semibold text-sm">Presupuestos Sugeridos vs Gastado</h4>

                {/* Necesidades */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Necesidades</span>
                    <span className={analisis.presupuestoDisponible.excedioPresupuestoNecesidades ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400'}>
                      {analisis.presupuestoDisponible.gastadoNecesidades.toFixed(2)} EUR / {analisis.presupuestoDisponible.presupuestoNecesidades.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${analisis.presupuestoDisponible.excedioPresupuestoNecesidades ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((analisis.presupuestoDisponible.gastadoNecesidades / analisis.presupuestoDisponible.presupuestoNecesidades) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Ocio */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ocio/Deseos</span>
                    <span className={analisis.presupuestoDisponible.excedioPresupuestoOcio ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400'}>
                      {analisis.presupuestoDisponible.gastadoOcio.toFixed(2)} EUR / {analisis.presupuestoDisponible.presupuestoOcio.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${analisis.presupuestoDisponible.excedioPresupuestoOcio ? 'bg-red-500' : 'bg-purple-500'}`}
                      style={{ width: `${Math.min((analisis.presupuestoDisponible.gastadoOcio / analisis.presupuestoDisponible.presupuestoOcio) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    {analisis.ingresosMensuales.toFixed(2)} EUR
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gastos Fijos (obligatorios)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analisis.presupuestoDisponible.gastosFijos.toFixed(2)} EUR
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
                    {analisis.restante.toFixed(2)} EUR
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
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">
                      ¡Alerta de Sobregasto!
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
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
                  <FiTarget className="h-3 w-3 mr-1" />
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
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(analisis.desglose.necesidades.porcentaje, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-24 text-right">
                    {analisis.desglose.necesidades.total.toFixed(2)} EUR
                  </span>
                </div>
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
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all"
                      style={{ width: `${Math.min(analisis.desglose.deseos.porcentaje, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-24 text-right">
                    {analisis.desglose.deseos.total.toFixed(2)} EUR
                  </span>
                </div>
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
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all"
                        style={{ width: `${Math.min(analisis.desglose.deudas.porcentaje, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-24 text-right">
                      {analisis.desglose.deudas.total.toFixed(2)} EUR
                    </span>
                  </div>
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
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${Math.min(analisis.desglose.ahorro.porcentaje, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-24 text-right">
                    {analisis.desglose.ahorro.total.toFixed(2)} EUR
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

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
      )}
    </div>
  );
};

export default FinancialAnalysis;
