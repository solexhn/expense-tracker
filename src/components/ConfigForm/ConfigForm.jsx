import React, { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../../utils/storage';
import './ConfigForm.css';

const ConfigForm = ({ onConfigUpdate }) => {
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
    <div className="config-form">
      <h2>Configuración</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="income">Ingreso Base Mensual (€)</label>
          <input
            type="number"
            id="income"
            value={incomeBase}
            onChange={(e) => setIncomeBase(e.target.value)}
            step="0.01"
            required
          />
        </div>
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
};

export default ConfigForm;