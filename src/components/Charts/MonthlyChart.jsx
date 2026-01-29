import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatearMoneda, calcularTotalGastosVariablesDeducidos } from '../../utils/calculations';
import { getGastosVariables } from '../../utils/storage';
import { FiPieChart } from 'react-icons/fi';

const MonthlyChart = ({ resumen }) => {
  let data;
  let total = 0;

  if (resumen.isFundMode) {
    const gastosVariables = getGastosVariables();
    const totalGastosVariablesDeducidos = calcularTotalGastosVariablesDeducidos(gastosVariables);

    data = [
      { name: 'Gastos Fijos', value: resumen.totalGastosFijos, color: '#f97316' },
      { name: 'Gastos Variables', value: totalGastosVariablesDeducidos, color: '#3b82f6' },
      { name: 'Disponible', value: resumen.disponibleReal > 0 ? resumen.disponibleReal : 0, color: '#10b981' }
    ];
    total = resumen.fondoDisponible || 0;
  } else {
    data = [
      { name: 'Gastos Fijos', value: resumen.totalGastosFijos, color: '#f97316' },
      { name: 'Gastos Variables', value: resumen.totalGastosVariables, color: '#3b82f6' },
      { name: 'Saldo Restante', value: resumen.saldoRestante > 0 ? resumen.saldoRestante : 0, color: '#10b981' }
    ];
    total = resumen.totalIngresos || 0;
  }

  const dataFiltrada = data.filter(item => item.value > 0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const percent = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {payload[0].name}
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: payload[0].payload.color }}>
            {formatearMoneda(payload[0].value)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {percent}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend item
  const LegendItem = ({ item }) => {
    const percent = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.625rem',
        marginBottom: '0.5rem',
        transition: 'all 0.15s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '0.75rem',
            height: '0.75rem',
            borderRadius: '0.25rem',
            background: item.color
          }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {item.name}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: item.color }}>
            {formatearMoneda(item.value)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            ({percent}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '0.5rem',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)'
          }}>
            <FiPieChart style={{ width: '1rem', height: '1rem' }} />
          </span>
          {resumen.isFundMode ? 'Distribución del Fondo' : 'Distribución Mensual'}
        </h3>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {dataFiltrada.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: '2rem'
          }}>
            {/* Chart */}
            <div style={{ flex: isMobile ? 'none' : '0 0 auto', width: isMobile ? '100%' : 'auto' }}>
              <ResponsiveContainer width={isMobile ? '100%' : 200} height={200}>
                <PieChart>
                  <Pie
                    data={dataFiltrada}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {dataFiltrada.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div style={{ flex: 1, width: '100%' }}>
              {data.map((item, index) => (
                <LegendItem key={index} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--text-muted)'
          }}>
            <FiPieChart style={{ width: '3rem', height: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p>No hay datos para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyChart;