import React, { useState, useEffect } from 'react';
import { getConfig, getGastosFijos, getGastosVariables, getIngresos } from '../../utils/storage';
import { formatearMoneda, calcularDiaRealCobro } from '../../utils/calculations';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const Timeline = ({ updateTrigger }) => {
  const [eventos, setEventos] = useState([]);
  const [resumen, setResumen] = useState({
    totalIngresos: 0,
    totalGastosFijos: 0,
    totalGastosVariables: 0,
    balance: 0
  });

  useEffect(() => {
    cargarEventos();
  }, [updateTrigger]);

  const cargarEventos = () => {
    const config = getConfig();
    // Usar mesReferencia o mesActual para filtrar
    const mesActual = config.mesReferencia || config.mesActual;
    const año = parseInt(mesActual.split('-')[0]);
    const mes = parseInt(mesActual.split('-')[1]);

    // Obtener todos los datos
    const gastosFijos = getGastosFijos().filter(g => g.estado === 'activo');
    const gastosVariables = getGastosVariables().filter(g => g.fecha.startsWith(mesActual));
    const ingresos = getIngresos().filter(i => i.fecha.startsWith(mesActual));

    // Crear array de eventos con formato unificado
    const todosEventos = [];

    // Ingreso base (día 1 del mes por defecto)
    if (config.incomeBase > 0) {
      todosEventos.push({
        tipo: 'ingreso',
        concepto: 'Ingreso Base',
        cantidad: config.incomeBase,
        fecha: `${mesActual}-01`,
        categoria: 'Salario'
      });
    }

    // Ingresos adicionales
    ingresos.forEach(ingreso => {
      todosEventos.push({
        tipo: 'ingreso',
        concepto: ingreso.concepto,
        cantidad: ingreso.cantidad,
        fecha: ingreso.fecha,
        categoria: ingreso.tipo
      });
    });

    // Gastos fijos (usar su día del mes configurado)
    gastosFijos.forEach(gasto => {
      // Asegurar que el día no exceda los días del mes
      // Calcular día real de cobro (si día configurado > último día del mes,
      // usar el último día del mes)
      const dia = calcularDiaRealCobro(gasto.diaDelMes, año, mes);
      const diaFormateado = dia.toString().padStart(2, '0');

      todosEventos.push({
        tipo: 'gasto-fijo',
        concepto: gasto.nombre,
        cantidad: gasto.cantidad,
        fecha: `${mesActual}-${diaFormateado}`,
        categoria: gasto.categoria || gasto.tipo
      });
    });

    // Gastos variables
    gastosVariables.forEach(gasto => {
      todosEventos.push({
        tipo: 'gasto-variable',
        concepto: gasto.concepto,
        cantidad: gasto.cantidad,
        fecha: gasto.fecha,
        categoria: gasto.categoria || 'General'
      });
    });

    // Ordenar por fecha
    todosEventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Agrupar por día y calcular saldos acumulados
    const eventosPorDia = {};
    let saldoAcumulado = 0;

    todosEventos.forEach(evento => {
      const dia = evento.fecha;

      if (!eventosPorDia[dia]) {
        eventosPorDia[dia] = {
          fecha: dia,
          eventos: [],
          saldoDia: 0,
          saldoAcumulado: 0
        };
      }

      eventosPorDia[dia].eventos.push(evento);

      // Calcular saldo del día
      if (evento.tipo === 'ingreso') {
        eventosPorDia[dia].saldoDia += evento.cantidad;
        saldoAcumulado += evento.cantidad;
      } else {
        eventosPorDia[dia].saldoDia -= evento.cantidad;
        saldoAcumulado -= evento.cantidad;
      }

      eventosPorDia[dia].saldoAcumulado = saldoAcumulado;
    });

    // Convertir a array y ordenar
    const eventosArray = Object.values(eventosPorDia).sort((a, b) =>
      new Date(a.fecha) - new Date(b.fecha)
    );

    setEventos(eventosArray);

    // Calcular resumen
    const totalIngresos = todosEventos
      .filter(e => e.tipo === 'ingreso')
      .reduce((sum, e) => sum + e.cantidad, 0);

    const totalGastosFijos = todosEventos
      .filter(e => e.tipo === 'gasto-fijo')
      .reduce((sum, e) => sum + e.cantidad, 0);

    const totalGastosVariables = todosEventos
      .filter(e => e.tipo === 'gasto-variable')
      .reduce((sum, e) => sum + e.cantidad, 0);

    setResumen({
      totalIngresos,
      totalGastosFijos,
      totalGastosVariables,
      balance: totalIngresos - totalGastosFijos - totalGastosVariables
    });
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha + 'T00:00:00');
    const dia = date.getDate();
    const nombreDia = date.toLocaleDateString('es-ES', { weekday: 'short' });
    return `Día ${dia} (${nombreDia})`;
  };

  const getTipoIcon = (tipo) => {
    if (tipo === 'ingreso') {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    }
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  const getTipoColor = (tipo) => {
    if (tipo === 'ingreso') return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">Cronograma del Mes</h1>
      </div>

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-600">
                {formatearMoneda(resumen.totalIngresos)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastos Fijos</p>
              <p className="text-2xl font-bold text-red-600">
                {formatearMoneda(resumen.totalGastosFijos)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastos Variables</p>
              <p className="text-2xl font-bold text-red-600">
                {formatearMoneda(resumen.totalGastosVariables)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className={`text-2xl font-bold ${resumen.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatearMoneda(resumen.balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de eventos */}
      <div className="space-y-4">
        {eventos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No hay eventos registrados este mes
              </p>
            </CardContent>
          </Card>
        ) : (
          eventos.map((dia, index) => (
            <Card key={dia.fecha}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {formatearFecha(dia.fecha)}
                  </CardTitle>
                  <Badge
                    variant={dia.saldoDia >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {dia.saldoDia >= 0 ? '+' : ''}{formatearMoneda(dia.saldoDia)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Eventos del día */}
                <div className="space-y-2">
                  {dia.eventos.map((evento, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getTipoIcon(evento.tipo)}
                        <div className="flex-1">
                          <p className="font-medium">{evento.concepto}</p>
                          <p className="text-sm text-muted-foreground">
                            {evento.categoria}
                          </p>
                        </div>
                      </div>
                      <p className={`text-lg font-bold ${getTipoColor(evento.tipo)}`}>
                        {evento.tipo === 'ingreso' ? '+' : '-'}
                        {formatearMoneda(evento.cantidad)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Saldo acumulado */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Saldo acumulado:
                    </p>
                    <p className={`text-xl font-bold ${dia.saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatearMoneda(dia.saldoAcumulado)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;
