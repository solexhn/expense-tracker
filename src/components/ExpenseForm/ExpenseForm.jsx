import React, { useState } from 'react';
import { saveGastoVariable } from '../../utils/storage';
import './ExpenseForm.css';

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
    <div className="expense-form">
      <h2>Añadir Gasto Variable</h2>
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
              placeholder="Ej: Supermercado, Gasolina"
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
            <label>Categoría</label>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              placeholder="Ej: alimentación, ocio"
            />
          </div>
        </div>

        <button type="submit">Añadir Gasto</button>
      </form>
    </div>
  );
};

export default ExpenseForm;