import React, { useState } from 'react';
import { saveIngreso } from '../../utils/storage';
import './IncomeForm.css';

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
    <div className="income-form">
      <h2>Añadir Ingreso</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha *</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Concepto *</label>
            <input
              type="text"
              name="concepto"
              value={formData.concepto}
              onChange={handleChange}
              placeholder="Ej: Gasolina compa, Venta móvil"
              required
            />
          </div>

          <div className="form-group">
            <label>Cantidad (€) *</label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo *</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange}>
              <option value="puntual">Puntual</option>
              <option value="recurrente">Recurrente</option>
            </select>
          </div>
        </div>

        <button type="submit">Añadir Ingreso</button>
      </form>
    </div>
  );
};

export default IncomeForm;