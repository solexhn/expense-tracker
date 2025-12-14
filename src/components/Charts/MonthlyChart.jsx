import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatearMoneda, calcularTotalGastosVariablesDeducidos } from '../../utils/calculations';
import { getGastosVariables } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui-simple/Card';

const MonthlyChart = ({ resumen }) => {
  let data;

  if (resumen.isFundMode) {
    // MODO FONDO: Mostrar gastos fijos + gastos variables deducidos + disponible
    const gastosVariables = getGastosVariables();
    const totalGastosVariablesDeducidos = calcularTotalGastosVariablesDeducidos(gastosVariables);

    data = [
      { name: 'Gastos Fijos', value: resumen.totalGastosFijos, color: '#f59e0b' },
      { name: 'Gastos Variables', value: totalGastosVariablesDeducidos, color: '#3b82f6' },
      { name: 'Disponible', value: resumen.disponibleReal > 0 ? resumen.disponibleReal : 0, color: '#10b981' }
    ];
  } else {
    // MODO HISTÓRICO: Mantener lógica existente
    data = [
      { name: 'Gastos Fijos', value: resumen.totalGastosFijos, color: '#f59e0b' },
      { name: 'Gastos Variables', value: resumen.totalGastosVariables, color: '#3b82f6' },
      { name: 'Saldo Restante', value: resumen.saldoRestante > 0 ? resumen.saldoRestante : 0, color: '#10b981' }
    ];
  }

  // Filtrar valores que sean 0
  const dataFiltrada = data.filter(item => item.value > 0);

  // detectar layout responsivo (breakpoint sm ~ 640px)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-card-foreground mb-1">{payload[0].name}</p>
          <p className="text-muted-foreground text-lg">{formatearMoneda(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{resumen.isFundMode ? 'Distribución del Fondo' : 'Distribución Mensual'}</CardTitle>
      </CardHeader>
      <CardContent>
        {dataFiltrada.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
            <PieChart>
              <Pie
                data={dataFiltrada}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={!isMobile ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                outerRadius={isMobile ? 60 : 80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataFiltrada.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout={isMobile ? 'horizontal' : 'vertical'}
                verticalAlign={isMobile ? 'bottom' : 'middle'}
                align={isMobile ? 'center' : 'right'}
                wrapperStyle={isMobile ? { paddingTop: '12px' } : { right: 0 }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-10">No hay datos para mostrar</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyChart;