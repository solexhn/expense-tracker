import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui-simple/Card';
import { Button } from '../ui-simple/Button';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import {
  FiAlertCircle,
  FiCheck,
  FiArrowRight,
  FiPlus,
  FiEdit2,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';
import {
  saveSobres,
  sincronizarSobresConFondo,
  establecerAsignacionSobre,
  transferirEntreSobres,
  crearSobre,
  eliminarSobre,
  getConfig
} from '../../utils/storage';

/**
 * EnvelopeBudgeting - Sistema de Presupuesto por Sobres
 *
 * Implementa el método YNAB/Zero-based budgeting:
 * - Cada euro debe tener un "trabajo" asignado
 * - Visualización clara de asignado vs gastado
 * - Transferencias fáciles entre sobres
 * - Banner prominente si hay dinero sin asignar
 */
const EnvelopeBudgeting = ({ onSobresUpdate }) => {
  const [sobresData, setSobresData] = useState(null);
  const [fondoDisponible, setFondoDisponible] = useState(0);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sobreEditando, setSobreEditando] = useState(null);
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);
  const [transferencia, setTransferencia] = useState({ desde: '', hacia: '', cantidad: '' });
  const [mostrarNuevoSobre, setMostrarNuevoSobre] = useState(false);
  const [nuevoSobre, setNuevoSobre] = useState({ nombre: '', color: 'gray', tipo: 'variable' });

  // Colores disponibles para sobres
  const COLORES = [
    { id: 'blue', clase: 'bg-blue-500', borde: 'border-blue-500' },
    { id: 'green', clase: 'bg-green-500', borde: 'border-green-500' },
    { id: 'purple', clase: 'bg-purple-500', borde: 'border-purple-500' },
    { id: 'yellow', clase: 'bg-yellow-500', borde: 'border-yellow-500' },
    { id: 'red', clase: 'bg-red-500', borde: 'border-red-500' },
    { id: 'emerald', clase: 'bg-emerald-500', borde: 'border-emerald-500' },
    { id: 'orange', clase: 'bg-orange-500', borde: 'border-orange-500' },
    { id: 'pink', clase: 'bg-pink-500', borde: 'border-pink-500' },
    { id: 'gray', clase: 'bg-gray-500', borde: 'border-gray-500' }
  ];

  const getColorClase = (colorId) => {
    return COLORES.find(c => c.id === colorId)?.clase || 'bg-gray-500';
  };

  const getBordeClase = (colorId) => {
    return COLORES.find(c => c.id === colorId)?.borde || 'border-gray-500';
  };

  // Cargar datos inicial
  const cargarDatos = useCallback(() => {
    const config = getConfig();
    setFondoDisponible(config.fondoDisponible || 0);

    // Sincronizar sobres con el fondo actual
    const datos = sincronizarSobresConFondo();
    setSobresData(datos);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Actualizar asignación de un sobre
  const handleAsignacionChange = (sobreId, valor) => {
    const nuevoMonto = parseFloat(valor) || 0;
    const datosActualizados = establecerAsignacionSobre(sobreId, nuevoMonto);
    setSobresData(datosActualizados);
    onSobresUpdate && onSobresUpdate(datosActualizados);
  };

  // Realizar transferencia entre sobres
  const handleTransferencia = () => {
    if (!transferencia.desde || !transferencia.hacia || !transferencia.cantidad) return;
    if (transferencia.desde === transferencia.hacia) return;

    const datosActualizados = transferirEntreSobres(
      transferencia.desde,
      transferencia.hacia,
      parseFloat(transferencia.cantidad)
    );

    setSobresData(datosActualizados);
    setMostrarTransferencia(false);
    setTransferencia({ desde: '', hacia: '', cantidad: '' });
    onSobresUpdate && onSobresUpdate(datosActualizados);
  };

  // Crear nuevo sobre
  const handleCrearSobre = () => {
    if (!nuevoSobre.nombre.trim()) return;

    const datosActualizados = crearSobre(nuevoSobre);
    setSobresData(datosActualizados);
    setMostrarNuevoSobre(false);
    setNuevoSobre({ nombre: '', color: 'gray', tipo: 'variable' });
    onSobresUpdate && onSobresUpdate(datosActualizados);
  };

  // Eliminar sobre personalizado
  const handleEliminarSobre = (sobreId) => {
    if (!sobreId.startsWith('custom_')) return;
    if (!window.confirm('¿Eliminar este sobre? El dinero asignado volverá al pool sin asignar.')) return;

    const datosActualizados = eliminarSobre(sobreId);
    setSobresData(datosActualizados);
    onSobresUpdate && onSobresUpdate(datosActualizados);
  };

  // Auto-asignar distribución sugerida (50/30/20 adaptada)
  const autoAsignar = () => {
    if (!sobresData) return;

    const totalDisponible = fondoDisponible;
    const nuevossobres = [...sobresData.sobres];

    // Distribución sugerida
    const distribucion = {
      necesidades: 0.50,
      alimentacion: 0.15,
      transporte: 0.10,
      ocio: 0.10,
      ahorro_emergencia: 0.10,
      pago_extra_deudas: 0.05,
      otros: 0
    };

    let totalAsignado = 0;

    nuevossobres.forEach(sobre => {
      const porcentaje = distribucion[sobre.id] || 0;
      sobre.asignado = Math.round(totalDisponible * porcentaje * 100) / 100;
      totalAsignado += sobre.asignado;
    });

    const datosActualizados = {
      ...sobresData,
      sobres: nuevossobres,
      dineroSinAsignar: Math.max(0, totalDisponible - totalAsignado)
    };

    saveSobres(datosActualizados);
    setSobresData(datosActualizados);
    onSobresUpdate && onSobresUpdate(datosActualizados);
  };

  if (!sobresData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Cargando sistema de sobres...</p>
        </CardContent>
      </Card>
    );
  }

  const totalAsignado = sobresData.sobres.reduce((sum, s) => sum + s.asignado, 0);
  const porcentajeAsignado = fondoDisponible > 0 ? (totalAsignado / fondoDisponible) * 100 : 0;
  const hayDineroSinAsignar = sobresData.dineroSinAsignar > 0.01;

  return (
    <div className="space-y-4">
      {/* BANNER PRINCIPAL: Dinero sin asignar */}
      {hayDineroSinAsignar && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-200 dark:bg-red-800 rounded-full">
                  <FiAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100">
                    ¡Tienes {sobresData.dineroSinAsignar.toFixed(2)} EUR sin asignar!
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    Dale un trabajo a cada euro. El dinero sin propósito se gasta sin control.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setModoEdicion(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <FiEdit2 className="mr-2 h-4 w-4" />
                Asignar ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HEADER: Resumen de asignación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {porcentajeAsignado >= 100 ? '🎯' : porcentajeAsignado >= 50 ? '📊' : '⚠️'}
              </span>
              <CardTitle>Sistema de Sobres</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoAsignar}
                title="Distribución sugerida 50/30/20"
              >
                <FiRefreshCw className="h-4 w-4 mr-1" />
                Auto
              </Button>
              <Button
                variant={modoEdicion ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModoEdicion(!modoEdicion)}
              >
                {modoEdicion ? <FiCheck className="h-4 w-4 mr-1" /> : <FiEdit2 className="h-4 w-4 mr-1" />}
                {modoEdicion ? 'Listo' : 'Editar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de progreso total */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Fondo disponible: <strong>{fondoDisponible.toFixed(2)} EUR</strong></span>
              <span className={porcentajeAsignado >= 100 ? 'text-green-600 font-bold' : 'text-orange-600'}>
                {porcentajeAsignado.toFixed(0)}% asignado
              </span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  porcentajeAsignado >= 100 ? 'bg-green-500' : porcentajeAsignado >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(porcentajeAsignado, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Asignado: {totalAsignado.toFixed(2)} EUR</span>
              <span className={hayDineroSinAsignar ? 'text-red-500 font-bold' : 'text-green-600'}>
                Sin asignar: {sobresData.dineroSinAsignar.toFixed(2)} EUR
              </span>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarTransferencia(!mostrarTransferencia)}
            >
              <FiArrowRight className="h-4 w-4 mr-1" />
              Transferir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarNuevoSobre(!mostrarNuevoSobre)}
            >
              <FiPlus className="h-4 w-4 mr-1" />
              Nuevo sobre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de transferencia */}
      {mostrarTransferencia && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">Transferir entre sobres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Desde</Label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={transferencia.desde}
                  onChange={(e) => setTransferencia({ ...transferencia, desde: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {sobresData.sobres.filter(s => s.asignado > s.gastado).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({(s.asignado - s.gastado).toFixed(2)} EUR disp.)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Hacia</Label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={transferencia.hacia}
                  onChange={(e) => setTransferencia({ ...transferencia, hacia: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {sobresData.sobres.filter(s => s.id !== transferencia.desde).map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Cantidad (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transferencia.cantidad}
                  onChange={(e) => setTransferencia({ ...transferencia, cantidad: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setMostrarTransferencia(false)}>
                Cancelar
              </Button>
              <Button onClick={handleTransferencia}>
                <FiArrowRight className="mr-2 h-4 w-4" />
                Transferir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de nuevo sobre */}
      {mostrarNuevoSobre && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="text-lg">Crear nuevo sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Nombre del sobre</Label>
                <Input
                  value={nuevoSobre.nombre}
                  onChange={(e) => setNuevoSobre({ ...nuevoSobre, nombre: e.target.value })}
                  placeholder="Ej: Vacaciones, Regalo, etc."
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {COLORES.map(color => (
                    <button
                      key={color.id}
                      className={`w-8 h-8 rounded-full ${color.clase} ${
                        nuevoSobre.color === color.id ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''
                      }`}
                      onClick={() => setNuevoSobre({ ...nuevoSobre, color: color.id })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Tipo</Label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={nuevoSobre.tipo}
                  onChange={(e) => setNuevoSobre({ ...nuevoSobre, tipo: e.target.value })}
                >
                  <option value="variable">Variable (gastos del día a día)</option>
                  <option value="fijo">Fijo (gastos obligatorios)</option>
                  <option value="ahorro">Ahorro (metas y emergencias)</option>
                  <option value="deuda">Deuda (pagos extra a créditos)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMostrarNuevoSobre(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCrearSobre}>
                  <FiPlus className="mr-2 h-4 w-4" />
                  Crear sobre
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRID DE SOBRES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sobresData.sobres.map((sobre) => {
          const disponible = sobre.asignado - sobre.gastado;
          const porcentajeUsado = sobre.asignado > 0 ? (sobre.gastado / sobre.asignado) * 100 : 0;
          const excedido = sobre.gastado > sobre.asignado;

          return (
            <Card
              key={sobre.id}
              className={`relative overflow-hidden transition-all ${
                excedido ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900/10' :
                porcentajeUsado > 80 ? 'border-2 border-yellow-500' :
                `border-l-4 ${getBordeClase(sobre.color)}`
              }`}
            >
              {/* Indicador visual de estado */}
              <div
                className={`absolute top-0 left-0 h-1 transition-all ${
                  excedido ? 'bg-red-500' : getColorClase(sobre.color)
                }`}
                style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
              />

              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{sobre.nombre}</h4>
                  {sobre.id.startsWith('custom_') && (
                    <button
                      onClick={() => handleEliminarSobre(sobre.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Eliminar sobre"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Modo edición: input para asignación */}
                {modoEdicion ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Asignar (EUR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sobreEditando === sobre.id ? undefined : sobre.asignado}
                      onFocus={() => setSobreEditando(sobre.id)}
                      onBlur={() => setSobreEditando(null)}
                      onChange={(e) => handleAsignacionChange(sobre.id, e.target.value)}
                      className="text-lg font-bold"
                    />
                  </div>
                ) : (
                  <>
                    {/* Vista normal */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Asignado</span>
                        <span className="text-xl font-bold">{sobre.asignado.toFixed(2)} EUR</span>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Gastado</span>
                        <span className={`font-medium ${excedido ? 'text-red-600' : ''}`}>
                          {sobre.gastado.toFixed(2)} EUR
                        </span>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            excedido ? 'bg-red-500' :
                            porcentajeUsado > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
                        />
                      </div>

                      {/* Disponible */}
                      <div className={`text-center py-2 rounded-lg ${
                        excedido ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        disponible < 10 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        <span className="text-sm font-medium">
                          {excedido ? (
                            <>Excedido por {Math.abs(disponible).toFixed(2)} EUR!</>
                          ) : (
                            <>Disponible: {disponible.toFixed(2)} EUR</>
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MENSAJE MOTIVADOR */}
      {porcentajeAsignado >= 100 && !hayDineroSinAsignar && (
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
              <FiCheck className="h-8 w-8" />
              <div>
                <h3 className="font-bold text-lg">
                  ¡Excelente! Cada euro tiene un propósito
                </h3>
                <p className="text-sm">
                  Tu presupuesto está completamente asignado. Ahora solo sigue el plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnvelopeBudgeting;
