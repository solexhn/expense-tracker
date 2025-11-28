import React, { useState, useEffect } from 'react';
import { 
  getConfig, 
  getGastosFijos, 
  getGastosVariables, 
  getIngresos 
} from '../../utils/storage';
import { obtenerResumenMes, formatearMoneda } from '../../utils/calculations';
import MonthlyChart from '../Charts/MonthlyChart';
import './Dashboard.css';

const Dashboard = () => {
  const [resumen, setResumen] = useState({
    totalIngresos: 0,
    totalGastosFijos: 0,
    totalGastosVariables: 0,
    totalGastos: 0,
    saldoRestante: 0
  });

  const [mesActual, setMesActual] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    const config = getConfig();
    const gastosFijos = getGastosFijos();
    const gastosVariables = getGastosVariables();
    const ingresos = getIngresos();

    const resumenCalculado = obtenerResumenMes(config, gastosFijos, gastosVariables, ingresos);
    setResumen(resumenCalculado);
    setMesActual(config.mesActual);
  };

  return (
    <div className="dashboard">
      <h1>Resumen del Mes</h1>
      <p className="mes-actual">{mesActual}</p>

      <div className="resumen-cards">
        <div className="card ingresos">
          <h3>Ingresos Totales</h3>
          <p className="cantidad">{formatearMoneda(resumen.totalIngresos)}</p>
        </div>

        <div className="card gastos-fijos">
          <h3>Gastos Fijos</h3>
          <p className="cantidad">{formatearMoneda(resumen.totalGastosFijos)}</p>
        </div>

        <div className="card gastos-variables">
          <h3>Gastos Variables</h3>
          <p className="cantidad">{formatearMoneda(resumen.totalGastosVariables)}</p>
        </div>

        <div className="card gastos-totales">
          <h3>Gastos Totales</h3>
          <p className="cantidad">{formatearMoneda(resumen.totalGastos)}</p>
        </div>

        <div className={`card saldo ${resumen.saldoRestante < 0 ? 'negativo' : 'positivo'}`}>
          <h3>Saldo Restante</h3>
          <p className="cantidad">{formatearMoneda(resumen.saldoRestante)}</p>
        </div>
      </div>

      <MonthlyChart resumen={resumen} />
    </div>
  );
};

export default Dashboard;