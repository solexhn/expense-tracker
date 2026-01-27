import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui-simple/Card';
import { Button } from '../ui-simple/Button';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import {
  FiTarget,
  FiPlus,
  FiTrash2,
  FiTrendingUp,
  FiCalendar,
  FiAward,
  FiDollarSign
} from 'react-icons/fi';
import {
  getMetasAhorro,
  saveMetaAhorro,
  updateMetaAhorro,
  deleteMetaAhorro,
  aportarAMeta,
  calcularEstadisticasMeta
} from '../../utils/storage';

/**
 * SavingsGoals - Metas de Ahorro Motivadoras
 *
 * Permite crear y seguir metas de ahorro con:
 * - Visualización de progreso (barra y porcentaje)
 * - Cálculo de aporte mensual necesario
 * - Hitos motivadores (25%, 50%, 75%, 100%)
 * - Sugerencias de movimiento de fondos
 */
const SavingsGoals = ({ fondoDisponible = 0, sobresData = null }) => {
  const [metas, setMetas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [metaEditando, setMetaEditando] = useState(null);
  const [mostrarAporte, setMostrarAporte] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    objetivo: '',
    fechaLimite: '',
    icono: '🎯',
    color: 'blue'
  });
  const [montoAporte, setMontoAporte] = useState('');

  // Iconos disponibles para metas
  const ICONOS = ['🎯', '🏖️', '🚗', '🏠', '💍', '📱', '🎓', '🎁', '✈️', '💻', '🏥', '👶'];

  // Colores para las barras de progreso
  const COLORES = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    emerald: 'bg-emerald-500'
  };

  const cargarMetas = useCallback(() => {
    const metasGuardadas = getMetasAhorro();
    setMetas(metasGuardadas);
  }, []);

  useEffect(() => {
    cargarMetas();
  }, [cargarMetas]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.objetivo) return;

    if (metaEditando) {
      updateMetaAhorro(metaEditando, {
        nombre: formData.nombre,
        objetivo: parseFloat(formData.objetivo),
        fechaLimite: formData.fechaLimite || null,
        icono: formData.icono,
        color: formData.color
      });
    } else {
      saveMetaAhorro({
        nombre: formData.nombre,
        objetivo: parseFloat(formData.objetivo),
        fechaLimite: formData.fechaLimite || null,
        icono: formData.icono,
        color: formData.color,
        progreso: 0
      });
    }

    setFormData({ nombre: '', objetivo: '', fechaLimite: '', icono: '🎯', color: 'blue' });
    setMostrarFormulario(false);
    setMetaEditando(null);
    cargarMetas();
  };

  const handleEliminar = (id) => {
    if (!window.confirm('¿Eliminar esta meta? Esta acción no se puede deshacer.')) return;
    deleteMetaAhorro(id);
    cargarMetas();
  };

  const handleAportar = (metaId) => {
    if (!montoAporte || parseFloat(montoAporte) <= 0) return;

    aportarAMeta(metaId, parseFloat(montoAporte), 'Aporte manual');
    setMontoAporte('');
    setMostrarAporte(null);
    cargarMetas();
  };

  const editarMeta = (meta) => {
    setFormData({
      nombre: meta.nombre,
      objetivo: meta.objetivo.toString(),
      fechaLimite: meta.fechaLimite || '',
      icono: meta.icono,
      color: meta.color
    });
    setMetaEditando(meta.id);
    setMostrarFormulario(true);
  };

  // Calcular sugerencias de sobrantes de sobres
  const calcularSugerencias = () => {
    if (!sobresData || !sobresData.sobres) return [];

    const sugerencias = [];
    sobresData.sobres.forEach(sobre => {
      const disponible = sobre.asignado - sobre.gastado;
      if (disponible > 10 && sobre.tipo !== 'ahorro') {
        sugerencias.push({
          sobre: sobre.nombre,
          disponible,
          mensaje: `Tienes ${disponible.toFixed(2)} EUR disponibles en "${sobre.nombre}"`
        });
      }
    });

    return sugerencias;
  };

  const sugerencias = calcularSugerencias();

  // Ordenar metas: incompletas primero, luego por progreso descendente
  const metasOrdenadas = [...metas].sort((a, b) => {
    const statsA = calcularEstadisticasMeta(a);
    const statsB = calcularEstadisticasMeta(b);

    if (statsA.completada !== statsB.completada) {
      return statsA.completada ? 1 : -1;
    }

    return statsB.porcentaje - statsA.porcentaje;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiAward className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-emerald-900 dark:text-emerald-100">
                Mis Metas de Ahorro
              </CardTitle>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setFormData({ nombre: '', objetivo: '', fechaLimite: '', icono: '🎯', color: 'blue' });
                setMetaEditando(null);
                setMostrarFormulario(!mostrarFormulario);
              }}
            >
              <FiPlus className="h-4 w-4 mr-1" />
              Nueva meta
            </Button>
          </div>
        </CardHeader>

        {/* Formulario de nueva meta */}
        {mostrarFormulario && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-card rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de la meta</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Fondo de emergencia, Vacaciones..."
                    required
                  />
                </div>
                <div>
                  <Label>Objetivo (EUR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.objetivo}
                    onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                    placeholder="1000.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha límite (opcional)</Label>
                  <Input
                    type="month"
                    value={formData.fechaLimite}
                    onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {Object.keys(COLORES).map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full ${COLORES[color]} ${
                          formData.color === color ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''
                        }`}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Icono</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ICONOS.map(icono => (
                    <button
                      key={icono}
                      type="button"
                      className={`text-2xl p-2 rounded hover:bg-muted ${
                        formData.icono === icono ? 'bg-muted ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setFormData({ ...formData, icono })}
                    >
                      {icono}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setMetaEditando(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {metaEditando ? 'Guardar cambios' : 'Crear meta'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Sugerencias de fondos disponibles */}
      {sugerencias.length > 0 && metas.length > 0 && (
        <Card className="border-blue-500/30 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <FiTrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Tienes fondos disponibles en tus sobres
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {sugerencias.slice(0, 2).map(s => s.mensaje).join('. ')}
                  {sugerencias.length > 2 && ` y ${sugerencias.length - 2} más...`}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Considera mover ese dinero a tus metas de ahorro.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de metas */}
      {metas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FiTarget className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aún no tienes metas de ahorro
              </h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera meta y empieza a construir tu futuro financiero.
              </p>
              <Button onClick={() => setMostrarFormulario(true)}>
                <FiPlus className="h-4 w-4 mr-2" />
                Crear mi primera meta
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metasOrdenadas.map((meta) => {
            const stats = calcularEstadisticasMeta(meta);

            return (
              <Card
                key={meta.id}
                className={`relative overflow-hidden transition-all ${
                  stats.completada
                    ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/10'
                    : ''
                }`}
              >
                {/* Barra de progreso superior */}
                <div
                  className={`absolute top-0 left-0 h-1.5 ${COLORES[meta.color] || 'bg-blue-500'} transition-all`}
                  style={{ width: `${stats.porcentaje}%` }}
                />

                <CardContent className="pt-6">
                  {/* Header de la meta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meta.icono}</span>
                      <div>
                        <h4 className="font-bold text-lg">{meta.nombre}</h4>
                        {meta.fechaLimite && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FiCalendar className="h-3 w-3" />
                            <span>
                              {new Date(meta.fechaLimite + '-01').toLocaleDateString('es-ES', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => editarMeta(meta)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                        title="Editar meta"
                      >
                        <FiTarget className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(meta.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Eliminar meta"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progreso visual */}
                  <div className="space-y-3">
                    {/* Números principales */}
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-2xl font-bold">{meta.progreso.toFixed(2)}</span>
                        <span className="text-muted-foreground ml-1">EUR</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">de </span>
                        <span className="font-semibold">{meta.objetivo.toFixed(2)} EUR</span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="relative">
                      <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${COLORES[meta.color] || 'bg-blue-500'} transition-all duration-500`}
                          style={{ width: `${stats.porcentaje}%` }}
                        />
                      </div>
                      {/* Porcentaje sobre la barra */}
                      <span
                        className={`absolute top-0 text-xs font-bold ${
                          stats.porcentaje > 50 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}
                        style={{
                          left: `${Math.min(Math.max(stats.porcentaje, 5), 95)}%`,
                          transform: 'translateX(-50%)',
                          lineHeight: '16px'
                        }}
                      >
                        {stats.porcentaje.toFixed(0)}%
                      </span>
                    </div>

                    {/* Hito alcanzado */}
                    {stats.ultimoHito && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${
                        stats.completada
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        <FiAward className="h-5 w-5" />
                        <span className="font-medium">{stats.ultimoHito.mensaje}</span>
                      </div>
                    )}

                    {/* Info adicional */}
                    {!stats.completada && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-muted rounded">
                          <span className="text-muted-foreground block">Restante</span>
                          <span className="font-semibold">{stats.restante.toFixed(2)} EUR</span>
                        </div>
                        {stats.aporteMensualNecesario && (
                          <div className="p-2 bg-muted rounded">
                            <span className="text-muted-foreground block">Mensual sugerido</span>
                            <span className="font-semibold">{stats.aporteMensualNecesario.toFixed(2)} EUR</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botón de aporte */}
                    {!stats.completada && (
                      <>
                        {mostrarAporte === meta.id ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="Cantidad a aportar"
                              value={montoAporte}
                              onChange={(e) => setMontoAporte(e.target.value)}
                              className="flex-1"
                            />
                            <Button size="sm" onClick={() => handleAportar(meta.id)}>
                              <FiDollarSign className="h-4 w-4 mr-1" />
                              Aportar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMostrarAporte(null);
                                setMontoAporte('');
                              }}
                            >
                              X
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setMostrarAporte(meta.id)}
                          >
                            <FiPlus className="h-4 w-4 mr-2" />
                            Hacer un aporte
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mensaje motivador cuando hay metas completadas */}
      {metas.some(m => calcularEstadisticasMeta(m).completada) && (
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100">
                  ¡Tienes metas cumplidas!
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Cada meta completada demuestra que puedes lograrlo. ¡Sigue así!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SavingsGoals;
