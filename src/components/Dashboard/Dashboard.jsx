import { useState, useEffect } from 'react';
import {
  getConfig,
  getGastosFijos,
  getGastosVariables,
  getIngresos
} from '../../utils/storage';
import { obtenerResumenMes, formatearMoneda } from '../../utils/calculations';
import MonthlyChart from '../Charts/MonthlyChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet } from 'lucide-react';

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Resumen del Mes</h1>
        <p className="text-muted-foreground">{mesActual}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatearMoneda(resumen.totalIngresos)}
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

      <MonthlyChart resumen={resumen} />
    </div>
  );
};

export default Dashboard;