import React, { useState, useEffect } from 'react';
import { getGastosVariables, deleteGastoVariable, getConfig } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Calendar } from 'lucide-react';

const ExpenseList = ({ updateTrigger, onListChange }) => {
  const [gastos, setGastos] = useState([]);
  const [gastosMes, setGastosMes] = useState([]);

  useEffect(() => {
    cargarGastos();
  }, [updateTrigger]);

  const cargarGastos = () => {
    const config = getConfig();
    const todosGastos = getGastosVariables();
    
    // Filtrar solo los del mes actual
    const gastosMesActual = todosGastos.filter(g => 
      g.fecha.startsWith(config.mesActual)
    );
    
    // Ordenar por fecha descendente (más recientes primero)
    gastosMesActual.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    setGastos(todosGastos);
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Gastos Variables del Mes
        </h2>
        <Badge variant="secondary" className="text-base">
          {gastosMes.length}
        </Badge>
      </div>
      
      {gastosMes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No hay gastos variables este mes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {gastosMes.map(gasto => (
            <Card key={gasto.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatearFecha(gasto.fecha)}</span>
                    </div>
                    
                    <h3 className="font-semibold text-lg">{gasto.concepto}</h3>
                    
                    {gasto.categoria && (
                      <Badge variant="outline" className="mt-1">
                        {gasto.categoria}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold">
                      {formatearMoneda(gasto.cantidad)}
                    </p>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminar(gasto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;