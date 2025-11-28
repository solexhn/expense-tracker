import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatearMoneda } from '../../utils/calculations';
import './MonthlyChart.css';

const MonthlyChart = ({ resumen }) => {
  const data = [
    { name: 'Gastos Fijos', value: resumen.totalGastosFijos, color: '#f59e0b' },
    { name: 'Gastos Variables', value: resumen.totalGastosVariables, color: '#3b82f6' },
    { name: 'Saldo Restante', value: resumen.saldoRestante > 0 ? resumen.saldoRestante : 0, color: '#10b981' }
  ];

  // Filtrar valores que sean 0
  const dataFiltrada = data.filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{payload[0].name}</p>
          <p className="value">{formatearMoneda(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="monthly-chart">
      <h2>Distribución Mensual</h2>
      {dataFiltrada.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataFiltrada}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataFiltrada.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="no-data">No hay datos para mostrar</p>
      )}
    </div>
  );
};

export default MonthlyChart;