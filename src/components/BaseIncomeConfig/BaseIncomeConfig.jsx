import { useState, useEffect } from 'react';
import { getConfig, saveConfig, registrarNomina } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui-simple/Card';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import { Button } from '../ui-simple/Button';

const BaseIncomeConfig = ({ onConfigUpdate }) => {
  const [incomeBase, setIncomeBase] = useState(0);
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [fondoDisponible, setFondoDisponible] = useState(0);
  const [ultimaNomina, setUltimaNomina] = useState(null);

  useEffect(() => {
    const config = getConfig();
    setIncomeBase(config.incomeBase);
    setFondoDisponible(config.fondoDisponible || 0);
    setUltimaNomina(config.ultimaNomina || null);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const mesActual = new Date().toISOString().slice(0, 7);
    saveConfig({ incomeBase: parseFloat(incomeBase), mesActual });
    if (onConfigUpdate) onConfigUpdate();
  };

  const handleRegistrarNomina = (e) => {
    e.preventDefault();
    if (!cantidad) return;
    const nuevo = registrarNomina(cantidad, fecha);
    setFondoDisponible(nuevo.fondoDisponible);
    setUltimaNomina(nuevo.ultimaNomina);
    if (onConfigUpdate) onConfigUpdate();
    setCantidad('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingreso Base / Registrar Nómina</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Cantidad (€)</Label>
            <Input
              type="number"
              id="income"
              value={incomeBase}
              onChange={(e) => setIncomeBase(e.target.value)}
              step="0.01"
              required
              placeholder="Ej: 2000"
            />
          </div>
          <Button type="submit">Guardar Ingreso Base</Button>
        </form>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-semibold">Registrar Nueva Nómina</h3>
          <form onSubmit={handleRegistrarNomina} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="col-span-1 md:col-span-1">
              <Label htmlFor="cantidadNomina">Cantidad (€)</Label>
              <Input type="number" id="cantidadNomina" value={cantidad} onChange={(e) => setCantidad(e.target.value)} step="0.01" placeholder="Ej: 1348.25" />
            </div>

            <div className="col-span-1 md:col-span-1">
              <Label htmlFor="fechaNomina">Fecha</Label>
              <Input type="date" id="fechaNomina" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            <div className="col-span-1 md:col-span-1">
              <Button type="submit">➕ Añadir Nómina al Fondo</Button>
            </div>
          </form>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Fondo actual: <strong>{fondoDisponible}€</strong></p>
            <p>Última nómina: <strong>{ultimaNomina || '—'}</strong></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BaseIncomeConfig;