import React, { useState, useEffect } from 'react';
import { getGastosVariables, updateGastoVariable, deleteGastoVariable, getConfig } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Trash2, Calendar, Pencil, X, Check } from 'lucide-react';

const ExpenseList = ({ updateTrigger, onListChange }) => {
  const [gastosMes, setGastosMes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState({});

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

  const iniciarEdicion = (gasto) => {
    setEditandoId(gasto.id);
    setFormEdicion({
      fecha: gasto.fecha,
      concepto: gasto.concepto,
      cantidad: gasto.cantidad,
      categoria: gasto.categoria || ''
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormEdicion({});
  };

  const guardarEdicion = (id) => {
    const datosActualizados = {
      ...formEdicion,
      cantidad: parseFloat(formEdicion.cantidad)
    };

    updateGastoVariable(id, datosActualizados);
    setEditandoId(null);
    setFormEdicion({});
    cargarGastos();
    if (onListChange) onListChange();
  };

  const handleChangeEdicion = (e) => {
    const { name, value } = e.target;
    setFormEdicion(prev => ({
      ...prev,
      [name]: value
    }));
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
              {gastosMes.map(gasto => {
                const estaEditando = editandoId === gasto.id;

                return (
                  <div key={gasto.id} className={`py-2 px-4 ${estaEditando ? 'bg-muted/30' : ''}`}>
                    {estaEditando ? (
                      /* MODO EDICIÓN */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-fecha-${gasto.id}`} className="text-xs">Fecha</Label>
                            <Input
                              id={`edit-fecha-${gasto.id}`}
                              name="fecha"
                              type="date"
                              value={formEdicion.fecha}
                              onChange={handleChangeEdicion}
                              className="h-8 text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-cantidad-${gasto.id}`} className="text-xs">Cantidad (€)</Label>
                            <Input
                              id={`edit-cantidad-${gasto.id}`}
                              name="cantidad"
                              type="number"
                              step="0.01"
                              value={formEdicion.cantidad}
                              onChange={handleChangeEdicion}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-concepto-${gasto.id}`} className="text-xs">Concepto</Label>
                          <Input
                            id={`edit-concepto-${gasto.id}`}
                            name="concepto"
                            value={formEdicion.concepto}
                            onChange={handleChangeEdicion}
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-categoria-${gasto.id}`} className="text-xs">Categoría</Label>
                          <Input
                            id={`edit-categoria-${gasto.id}`}
                            name="categoria"
                            value={formEdicion.categoria}
                            onChange={handleChangeEdicion}
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => guardarEdicion(gasto.id)}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelarEdicion}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* MODO VISUALIZACIÓN */
                      <div className="flex items-center justify-between gap-3">
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

                        <div className="flex items-center gap-2 ml-3">
                          <p className="font-semibold text-sm">{formatearMoneda(gasto.cantidad)}</p>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => iniciarEdicion(gasto)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => eliminar(gasto.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ExpenseList;