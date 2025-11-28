import React, { useState } from 'react';
import { saveGastoFijo } from '../../utils/storage';
import './RecurringExpenseForm.css';

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
    <div className="recurring-expense-form">
      <h2>Añadir Gasto Fijo/Recurrente</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Netflix, Luz, Crédito coche"
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Día del mes *</label>
            <input
              type="number"
              name="diaDelMes"
              value={formData.diaDelMes}
              onChange={handleChange}
              min="1"
              max="31"
              placeholder="1-31"
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo *</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange}>
              <option value="suscripcion">Suscripción</option>
              <option value="credito">Crédito</option>
              <option value="servicio">Servicio</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              placeholder="Ej: entretenimiento, hogar"
            />
          </div>
        </div>

        {esCredito && (
          <div className="form-row credito-fields">
            <div className="form-group">
              <label>Cuotas Restantes</label>
              <input
                type="number"
                name="cuotasRestantes"
                value={formData.cuotasRestantes}
                onChange={handleChange}
                min="0"
                placeholder="Ej: 18"
              />
            </div>

            <div className="form-group">
              <label>Cuotas Totales</label>
              <input
                type="number"
                name="cuotasTotales"
                value={formData.cuotasTotales}
                onChange={handleChange}
                min="0"
                placeholder="Ej: 24"
              />
            </div>

            <div className="form-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <button type="submit">Añadir Gasto Fijo</button>
      </form>
    </div>
  );
};

export default RecurringExpenseForm;