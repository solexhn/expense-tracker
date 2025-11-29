import React, { useState, useEffect } from 'react';
import { getIngresos, deleteIngreso, getConfig } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Calendar } from 'lucide-react';

const IncomeList = ({ updateTrigger, onListChange }) => {
  const [ingresos, setIngresos] = useState([]);
  const [ingresosMes, setIngresosMes] = useState([]);

  useEffect(() => {
    cargarIngresos();
  }, [updateTrigger]);

  const cargarIngresos = () => {
    const config = getConfig();
    const todosIngresos = getIngresos();
    
    // Filtrar solo los del mes actual
    const ingresosMesActual = todosIngresos.filter(i => 
      i.fecha.startsWith(config.mesActual)
    );
    
    // Ordenar por fecha descendente
    ingresosMesActual.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    setIngresos(todosIngresos);
    setIngresosMes(ingresosMesActual);
  };

  const eliminar = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este ingreso?')) {
      deleteIngreso(id);
      cargarIngresos();
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
          Ingresos del Mes
        </h2>
        <Badge variant="secondary" className="text-base">
          {ingresosMes.length}
        </Badge>
      </div>
      
      {ingresosMes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No hay ingresos adicionales este mes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ingresosMes.map(ingreso => (
            <Card key={ingreso.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatearFecha(ingreso.fecha)}</span>
                    </div>
                    
                    <h3 className="font-semibold text-lg">{ingreso.concepto}</h3>
                    
                    <Badge variant="outline" className="mt-1">
                      {ingreso.tipo}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-green-600">
                      {formatearMoneda(ingreso.cantidad)}
                    </p>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminar(ingreso.id)}
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

export default IncomeList;