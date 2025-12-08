import { useState } from 'react';
import { saveGastoFijo } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

const RecurringExpenseForm = ({ onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: '',
    diaDelMes: '',
    tipo: 'suscripcion',
    categoria: '',
    cuotasRestantes: '',
    cuotasTotales: '',
    fechaInicio: ''
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
      nombre: formData.nombre,
      cantidad: parseFloat(formData.cantidad),
      diaDelMes: parseInt(formData.diaDelMes),
      tipo: formData.tipo,
      estado: 'activo',
      categoria: formData.categoria,
      cuotasRestantes: formData.cuotasRestantes ? parseInt(formData.cuotasRestantes) : null,
      cuotasTotales: formData.cuotasTotales ? parseInt(formData.cuotasTotales) : null,
      fechaInicio: formData.fechaInicio || null
    };

    saveGastoFijo(nuevoGasto);
    
    // Limpiar formulario
    setFormData({
      nombre: '',
      cantidad: '',
      diaDelMes: '',
      tipo: 'suscripcion',
      categoria: '',
      cuotasRestantes: '',
      cuotasTotales: '',
      fechaInicio: ''
    });

    if (onExpenseAdded) onExpenseAdded();
  };

  const esCredito = formData.tipo === 'credito';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir Gasto Fijo/Recurrente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Netflix, Luz, Crédito coche"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diaDelMes">Día del mes *</Label>
              <Input
                type="number"
                id="diaDelMes"
                name="diaDelMes"
                value={formData.diaDelMes}
                onChange={handleChange}
                min="1"
                max="31"
                placeholder="1-31"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Si indicas día 31 y el mes tiene menos días, el cobro se realizará el último día del mes.</p>
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
                <option value="suscripcion">Suscripción</option>
                <option value="credito">Crédito</option>
                <option value="servicio">Servicio</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                type="text"
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Ej: entretenimiento, hogar"
              />
            </div>
          </div>

          {esCredito && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="cuotasRestantes">Cuotas Restantes</Label>
                <Input
                  type="number"
                  id="cuotasRestantes"
                  name="cuotasRestantes"
                  value={formData.cuotasRestantes}
                  onChange={handleChange}
                  min="0"
                  placeholder="Ej: 18"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuotasTotales">Cuotas Totales</Label>
                <Input
                  type="number"
                  id="cuotasTotales"
                  name="cuotasTotales"
                  value={formData.cuotasTotales}
                  onChange={handleChange}
                  min="0"
                  placeholder="Ej: 24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <Button type="submit">Añadir Gasto Fijo</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecurringExpenseForm;