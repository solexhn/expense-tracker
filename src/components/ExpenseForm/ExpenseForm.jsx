import { useState, useEffect } from 'react';
import { saveGastoVariable, getConfig, getGastosVariables, getGastosFijos } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '../ui-simple/Card';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import { Button } from '../ui-simple/Button';

const ExpenseForm = ({ onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    cantidad: '',
    categoria: ''
  });

  const [fondoActual, setFondoActual] = useState(0);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  useEffect(() => {
    const config = getConfig();
    setFondoActual(parseFloat(config.fondoDisponible || 0));

    // Obtener categorías existentes
    const gastosVariables = getGastosVariables();
    const gastosFijos = getGastosFijos();

    // Extraer categorías únicas y contar frecuencia
    const categoriaMap = new Map();

    gastosVariables.forEach(g => {
      if (g.categoria) {
        const count = categoriaMap.get(g.categoria) || 0;
        categoriaMap.set(g.categoria, count + 1);
      }
    });

    gastosFijos.forEach(g => {
      if (g.categoria) {
        const count = categoriaMap.get(g.categoria) || 0;
        categoriaMap.set(g.categoria, count + 1);
      }
    });

    // Ordenar por frecuencia (más usadas primero)
    const categoriasOrdenadas = Array.from(categoriaMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([categoria]) => categoria);

    setCategoriasDisponibles(categoriasOrdenadas);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nuevoGasto = {
      fecha: formData.fecha,
      concepto: formData.concepto,
      cantidad: parseFloat(formData.cantidad),
      categoria: formData.categoria
    };

    const resultado = saveGastoVariable(nuevoGasto);

    // Actualizar el fondo actual mostrado
    if (resultado && resultado.fondoRestante !== undefined) {
      setFondoActual(resultado.fondoRestante);
    }

    // Limpiar formulario (mantener fecha actual)
    setFormData({
      fecha: new Date().toISOString().slice(0, 10),
      concepto: '',
      cantidad: '',
      categoria: ''
    });

    if (onExpenseAdded) onExpenseAdded();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir Gasto Variable</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                type="text"
                id="concepto"
                name="concepto"
                value={formData.concepto}
                onChange={handleChange}
                placeholder="Ej: Supermercado, Gasolina"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad (€) *</Label>
              <Input
                type="number"
                id="cantidad"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                type="text"
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Ej: alimentación, ocio"
                list="categorias-sugeridas"
                autoComplete="off"
              />
              <datalist id="categorias-sugeridas">
                {categoriasDisponibles.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>
              {categoriasDisponibles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  💡 Sugerencias: {categoriasDisponibles.slice(0, 3).join(', ')}
                  {categoriasDisponibles.length > 3 && '...'}
                </p>
              )}
            </div>
          </div>

          {/* Preview del fondo después de este gasto */}
          {formData.cantidad && parseFloat(formData.cantidad) > 0 && (
            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fondo actual:</span>
                <span className="font-medium">{formatearMoneda(fondoActual)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Después de este gasto:</span>
                <span className={`font-bold ${
                  (fondoActual - parseFloat(formData.cantidad)) < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatearMoneda(fondoActual - parseFloat(formData.cantidad))}
                </span>
              </div>
              {(fondoActual - parseFloat(formData.cantidad)) < 0 && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  ⚠️ Este gasto dejará tu fondo en negativo
                </p>
              )}
            </div>
          )}

          <Button type="submit">Añadir Gasto</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;