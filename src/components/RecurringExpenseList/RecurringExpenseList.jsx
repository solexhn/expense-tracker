import React, { useState, useEffect } from 'react';
import { getGastosFijos, updateGastoFijo, deleteGastoFijo } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import './RecurringExpenseList.css';

const RecurringExpenseList = ({ updateTrigger, onListChange }) => {
  const [gastos, setGastos] = useState([]);

  useEffect(() => {
    cargarGastos();
  }, [updateTrigger]);

  const cargarGastos = () => {
    const gastosCargados = getGastosFijos();
    setGastos(gastosCargados);
  };

  const cambiarEstado = (id, nuevoEstado) => {
    updateGastoFijo(id, { estado: nuevoEstado });
    cargarGastos();
    if (onListChange) onListChange();
  };

  const eliminar = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este gasto?')) {
      deleteGastoFijo(id);
      cargarGastos();
      if (onListChange) onListChange();
    }
  };

  const getEstadoClass = (estado) => {
    switch(estado) {
      case 'activo': return 'estado-activo';
      case 'pausado': return 'estado-pausado';
      case 'finalizado': return 'estado-finalizado';
      default: return '';
    }
  };

  return (
    <div className="recurring-expense-list">
      <h2>Gastos Fijos ({gastos.length})</h2>
      
      {gastos.length === 0 ? (
        <p className="empty-message">No hay gastos fijos registrados</p>
      ) : (
        <div className="gastos-grid">
          {gastos.map(gasto => (
            <div key={gasto.id} className={`gasto-card ${getEstadoClass(gasto.estado)}`}>
              <div className="gasto-header">
                <h3>{gasto.nombre}</h3>
                <span className={`badge ${getEstadoClass(gasto.estado)}`}>
                  {gasto.estado}
                </span>
              </div>
              
              <div className="gasto-info">
                <p className="cantidad">{formatearMoneda(gasto.cantidad)}</p>
                <p className="detalle">Día {gasto.diaDelMes} de cada mes</p>
                <p className="detalle">Tipo: {gasto.tipo}</p>
                {gasto.categoria && <p className="detalle">Categoría: {gasto.categoria}</p>}
                
                {gasto.tipo === 'credito' && gasto.cuotasRestantes !== null && (
                  <p className="detalle cuotas">
                    Cuotas: {gasto.cuotasRestantes} / {gasto.cuotasTotales}
                  </p>
                )}
              </div>

              <div className="gasto-actions">
                <select 
                  value={gasto.estado} 
                  onChange={(e) => cambiarEstado(gasto.id, e.target.value)}
                  className="estado-select"
                >
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
                
                <button 
                  onClick={() => eliminar(gasto.id)}
                  className="btn-delete"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringExpenseList;