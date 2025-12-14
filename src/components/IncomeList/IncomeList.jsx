import React, { useState, useEffect } from 'react';
import { getIngresos, deleteIngreso, getConfig } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardHeader, CardContent } from '../ui-simple/Card';
import { Button } from '../ui-simple/Button';
import { Badge } from '../ui-simple/Badge';
import { FiTrash2, FiCalendar } from 'react-icons/fi';

const IncomeList = ({ updateTrigger, onListChange }) => {
  const [ingresosMes, setIngresosMes] = useState([]);

  useEffect(() => {
    cargarIngresos();
  }, [updateTrigger]);

  const cargarIngresos = () => {
    const config = getConfig();
    const todosIngresos = getIngresos();

    // Usar mesReferencia o mesActual para filtrar
    const mesParaFiltrar = config.mesReferencia || config.mesActual;

    // Filtrar solo los del mes actual
    const ingresosMesActual = todosIngresos.filter(i =>
      i.fecha.startsWith(mesParaFiltrar)
    );
    
    // Ordenar por fecha descendente
    ingresosMesActual.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // mantener solo la lista del mes en estado de render
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
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Ingresos</h2>
            <Badge variant="secondary" className="text-sm">{ingresosMes.length}</Badge>
          </div>
        </CardHeader>

        {ingresosMes.length === 0 ? (
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-center text-muted-foreground">No hay ingresos adicionales este mes</p>
          </CardContent>
        ) : (
          <CardContent className="pt-2 pb-2 px-0">
            <div className="divide-y">
              {ingresosMes.map(ingreso => (
                <div key={ingreso.id} className="flex items-center justify-between py-2 px-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FiCalendar className="h-4 w-4" />
                      <span>{formatearFecha(ingreso.fecha)}</span>
                    </div>
                    <p className="truncate font-medium text-sm mt-1">{ingreso.concepto}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{ingreso.tipo}</Badge>
                  </div>

                  <div className="flex items-center gap-3 ml-3">
                    <p className="font-semibold text-sm text-green-600">{formatearMoneda(ingreso.cantidad)}</p>
                    <Button variant="destructive" size="icon" onClick={() => eliminar(ingreso.id)}>
                      <FiTrash2 className="h-4 w-4" />
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

export default IncomeList;