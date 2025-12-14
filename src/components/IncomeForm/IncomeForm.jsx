import { useState } from 'react';
import { saveIngreso } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui-simple/Card';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import { Button } from '../ui-simple/Button';

const IncomeForm = ({ onIncomeAdded }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    cantidad: '',
    tipo: 'puntual'
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

    const nuevoIngreso = {
      fecha: formData.fecha,
      concepto: formData.concepto,
      cantidad: parseFloat(formData.cantidad),
      tipo: formData.tipo
    };

    saveIngreso(nuevoIngreso);

    // Limpiar formulario (mantener fecha actual)
    setFormData({
      fecha: new Date().toISOString().slice(0, 10),
      concepto: '',
      cantidad: '',
      tipo: 'puntual'
    });

    if (onIncomeAdded) onIncomeAdded();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir Ingreso</CardTitle>
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
                placeholder="Ej: Gasolina compa, Venta móvil"
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
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="puntual">Puntual</option>
                <option value="recurrente">Recurrente</option>
              </select>
            </div>
          </div>

          <Button type="submit">Añadir Ingreso</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default IncomeForm;