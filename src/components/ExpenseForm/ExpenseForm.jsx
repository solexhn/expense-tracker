import { useState } from 'react';
import { saveGastoVariable } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

const ExpenseForm = ({ onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    cantidad: '',
    categoria: ''
  });

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

    saveGastoVariable(nuevoGasto);

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
              />
            </div>
          </div>

          <Button type="submit">Añadir Gasto</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;