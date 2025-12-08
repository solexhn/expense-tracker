import React, { useState, useEffect } from 'react';
import { getGastosFijos, updateGastoFijo, deleteGastoFijo } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, CheckCircle2, Pause, XCircle, Calendar } from 'lucide-react';

const RecurringExpenseList = ({ updateTrigger, onListChange }) => {
  const [gastos, setGastos] = useState([]);

  useEffect(() => {
    cargarGastos();
  }, [updateTrigger]);

  const cargarGastos = () => {
    const gastosCargados = getGastosFijos();
    setGastos(gastosCargados);
  };

  const cambiarEstado = (id, nuevoEstado) => {
    updateGastoFijo(id, { estado: nuevoEstado });
    cargarGastos();
    if (onListChange) onListChange();
  };

  const eliminar = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este gasto?')) {
      deleteGastoFijo(id);
      cargarGastos();
      if (onListChange) onListChange();
    }
  };

  // Configuración de estados con iconos y colores
  const estadoConfig = {
    activo: {
      icon: CheckCircle2,
      badgeClass: 'bg-green-100 text-green-800 border-green-200',
      label: 'Activo'
    },
    pausado: {
      icon: Pause,
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      label: 'Pausado'
    },
    finalizado: {
      icon: XCircle,
      badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
      label: 'Finalizado'
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Gastos Fijos
        </h2>
        <Badge variant="secondary" className="text-base">
          {gastos.length}
        </Badge>
      </div>
      
      {gastos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No hay gastos fijos registrados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {gastos.map(gasto => {
            const config = estadoConfig[gasto.estado] || estadoConfig.activo;
            const IconComponent = config.icon;
            
            return (
              <Card key={gasto.id} className="relative py-2 px-3">
                <CardHeader className="py-2 px-0">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">{gasto.nombre}</CardTitle>
                    <Badge className={`${config.badgeClass} text-xs px-2 py-0.5`}>
                      <IconComponent className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 py-2 px-0">
                  {/* Cantidad principal */}
                  <p className="text-lg font-semibold">
                    {formatearMoneda(gasto.cantidad)}
                  </p>
                  
                  {/* Información del gasto */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Día {gasto.diaDelMes} de cada mes</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tipo:</span>
                      <Badge variant="outline" className="text-xs">
                        {gasto.tipo}
                      </Badge>
                    </div>
                    
                    {gasto.categoria && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Categoría:</span>
                        <Badge variant="outline" className="text-xs">
                          {gasto.categoria}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Cuotas si es crédito */}
                    {gasto.tipo === 'credito' && gasto.cuotasRestantes !== null && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Cuotas:</span>
                          <span className="font-semibold">
                            {gasto.cuotasRestantes} / {gasto.cuotasTotales}
                          </span>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all"
                            style={{ 
                              width: `${((gasto.cuotasTotales - gasto.cuotasRestantes) / gasto.cuotasTotales) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-2">
                    <select 
                      value={gasto.estado} 
                      onChange={(e) => cambiarEstado(gasto.id, e.target.value)}
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="activo">Activo</option>
                      <option value="pausado">Pausado</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => eliminar(gasto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecurringExpenseList;