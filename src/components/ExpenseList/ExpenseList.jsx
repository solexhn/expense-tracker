import React, { useState, useEffect } from 'react';
import { getGastosVariables, deleteGastoVariable, getConfig } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import './ExpenseList.css';

const ExpenseList = ({ updateTrigger, onListChange }) => {
  const [gastos, setGastos] = useState([]);
  const [gastosMes, setGastosMes] = useState([]);

  useEffect(() => {
    cargarGastos();
  }, [updateTrigger]);

  const cargarGastos = () => {
    const config = getConfig();
    const todosGastos = getGastosVariables();
    
    // Filtrar solo los del mes actual
    const gastosMesActual = todosGastos.filter(g => 
      g.fecha.startsWith(config.mesActual)
    );
    
    // Ordenar por fecha descendente (más recientes primero)
    gastosMesActual.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    setGastos(todosGastos);
    setGastosMes(gastosMesActual);
  };

  const eliminar = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este gasto?')) {
      deleteGastoVariable(id);
      cargarGastos();
      if (onListChange) onListChange();
    }
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="expense-list">
      <h2>Gastos Variables del Mes ({gastosMes.length})</h2>
      
      {gastosMes.length === 0 ? (
        <p className="empty-message">No hay gastos variables este mes</p>
      ) : (
        <div className="gastos-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastosMes.map(gasto => (
                <tr key={gasto.id}>
                  <td>{formatearFecha(gasto.fecha)}</td>
                  <td className="concepto">{gasto.concepto}</td>
                  <td className="categoria">{gasto.categoria || '-'}</td>
                  <td className="cantidad">{formatearMoneda(gasto.cantidad)}</td>
                  <td>
                    <button 
                      onClick={() => eliminar(gasto.id)}
                      className="btn-delete"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;