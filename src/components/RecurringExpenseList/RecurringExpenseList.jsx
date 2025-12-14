import React, { useState, useEffect } from 'react';
import { getGastosFijos, updateGastoFijo, deleteGastoFijo } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardHeader, CardTitle, CardContent } from '../ui-simple/Card';
import { Button } from '../ui-simple/Button';
import { Badge } from '../ui-simple/Badge';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import { FiTrash2, FiCheckCircle, FiPause, FiXCircle, FiCalendar, FiEdit2, FiX, FiCheck } from 'react-icons/fi';

const RecurringExpenseList = ({ updateTrigger, onListChange }) => {
  const [gastos, setGastos] = useState([]);
  const [editandoId, setFiEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState({});

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

  const iniciarEdicion = (gasto) => {
    setFiEditandoId(gasto.id);
    setFormEdicion({
      nombre: gasto.nombre,
      cantidad: gasto.cantidad,
      diaDelMes: gasto.diaDelMes,
      tipo: gasto.tipo,
      categoria: gasto.categoria || '',
      cuotasRestantes: gasto.cuotasRestantes || '',
      cuotasTotales: gasto.cuotasTotales || '',
      fechaInicio: gasto.fechaInicio || ''
    });
  };

  const cancelarEdicion = () => {
    setFiEditandoId(null);
    setFormEdicion({});
  };

  const guardarEdicion = (id) => {
    const datosActualizados = {
      ...formEdicion,
      cantidad: parseFloat(formEdicion.cantidad),
      diaDelMes: parseInt(formEdicion.diaDelMes),
      cuotasRestantes: formEdicion.cuotasRestantes ? parseInt(formEdicion.cuotasRestantes) : null,
      cuotasTotales: formEdicion.cuotasTotales ? parseInt(formEdicion.cuotasTotales) : null
    };

    updateGastoFijo(id, datosActualizados);
    setFiEditandoId(null);
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

  // Configuración de estados con iconos y colores
  const estadoConfig = {
    activo: {
      icon: FiCheckCircle,
      badgeClass: 'bg-green-100 text-green-800 border-green-200',
      label: 'Activo'
    },
    pausado: {
      icon: FiPause,
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      label: 'Pausado'
    },
    finalizado: {
      icon: FiXCircle,
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
            const estaFiEditando = editandoId === gasto.id;

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
                  {estaFiEditando ? (
                    /* MODO EDICIÓN */
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-nombre-${gasto.id}`} className="text-xs">Nombre</Label>
                        <Input
                          id={`edit-nombre-${gasto.id}`}
                          name="nombre"
                          value={formEdicion.nombre}
                          onChange={handleChangeEdicion}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
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

                        <div className="space-y-2">
                          <Label htmlFor={`edit-dia-${gasto.id}`} className="text-xs">Día del mes</Label>
                          <Input
                            id={`edit-dia-${gasto.id}`}
                            name="diaDelMes"
                            type="number"
                            min="1"
                            max="31"
                            value={formEdicion.diaDelMes}
                            onChange={handleChangeEdicion}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-tipo-${gasto.id}`} className="text-xs">Tipo</Label>
                        <select
                          id={`edit-tipo-${gasto.id}`}
                          name="tipo"
                          value={formEdicion.tipo}
                          onChange={handleChangeEdicion}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="suscripcion">Suscripción</option>
                          <option value="credito">Crédito</option>
                          <option value="servicio">Servicio</option>
                          <option value="otro">Otro</option>
                        </select>
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

                      {formEdicion.tipo === 'credito' && (
                        <div className="space-y-2 p-2 bg-muted rounded">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor={`edit-cuotas-rest-${gasto.id}`} className="text-xs">Cuotas Rest.</Label>
                              <Input
                                id={`edit-cuotas-rest-${gasto.id}`}
                                name="cuotasRestantes"
                                type="number"
                                value={formEdicion.cuotasRestantes}
                                onChange={handleChangeEdicion}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`edit-cuotas-tot-${gasto.id}`} className="text-xs">Cuotas Tot.</Label>
                              <Input
                                id={`edit-cuotas-tot-${gasto.id}`}
                                name="cuotasTotales"
                                type="number"
                                value={formEdicion.cuotasTotales}
                                onChange={handleChangeEdicion}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => guardarEdicion(gasto.id)}
                          className="flex-1"
                        >
                          <FiCheck className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelarEdicion}
                        >
                          <FiX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* MODO VISUALIZACIÓN */
                    <>

                  {/* Cantidad principal */}
                  <p className="text-lg font-semibold">
                    {formatearMoneda(gasto.cantidad)}
                  </p>
                  
                  {/* FiInformación del gasto */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="h-4 w-4" />
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
                      variant="outline"
                      size="icon"
                      onClick={() => iniciarEdicion(gasto)}
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => eliminar(gasto.id)}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                    </>
                  )}
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