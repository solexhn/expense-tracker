import React, { useState, useEffect } from 'react';
import { getGastosVariables, deleteGastoVariable, getConfig } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Calendar } from 'lucide-react';

const ExpenseList = ({ updateTrigger, onListChange }) => {
  const [gastosMes, setGastosMes] = useState([]);

  useEffect(() => {
    cargarGastos();
  }, [updateTrigger]);

  const cargarGastos = () => {
    const config = getConfig();
    const todosGastos = getGastosVariables();

    // Usar mesReferencia o mesActual para filtrar
    const mesParaFiltrar = config.mesReferencia || config.mesActual;

    // Filtrar solo los del mes actual
    const gastosMesActual = todosGastos.filter(g =>
      g.fecha.startsWith(mesParaFiltrar)
    );

    // Ordenar por fecha descendente (más recientes primero)
    gastosMesActual.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // mantener solo la lista del mes para render
    setGastosMes(gastosMesActual);
  };

  const eliminar = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este gasto?')) {
      deleteGastoVariable(id);
      cargarGastos();
      if (onListChange) onListChange();
    }
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Gastos Variables</h2>
            <Badge variant="secondary" className="text-sm">{gastosMes.length}</Badge>
          </div>
        </CardHeader>

        {gastosMes.length === 0 ? (
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-center text-muted-foreground">No hay gastos variables este mes</p>
          </CardContent>
        ) : (
          <CardContent className="pt-2 pb-2 px-0">
            <div className="divide-y">
              {gastosMes.map(gasto => (
                <div key={gasto.id} className="flex items-center justify-between py-2 px-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatearFecha(gasto.fecha)}</span>
                    </div>
                    <p className="truncate font-medium text-sm mt-1">{gasto.concepto}</p>
                    {gasto.categoria && (
                      <Badge variant="outline" className="mt-1 text-xs">{gasto.categoria}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-3">
                    <p className="font-semibold text-sm">{formatearMoneda(gasto.cantidad)}</p>
                    <Button variant="destructive" size="icon" onClick={() => eliminar(gasto.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ExpenseList;