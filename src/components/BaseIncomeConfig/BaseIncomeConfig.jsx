import { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

const BaseIncomeConfig = ({ onConfigUpdate }) => {
  const [incomeBase, setIncomeBase] = useState(0);

  useEffect(() => {
    const config = getConfig();
    setIncomeBase(config.incomeBase);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const mesActual = new Date().toISOString().slice(0, 7);
    saveConfig({ incomeBase: parseFloat(incomeBase), mesActual });
    if (onConfigUpdate) onConfigUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingreso Base Mensual</CardTitle>
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
      </CardContent>
    </Card>
  );
};

export default BaseIncomeConfig;