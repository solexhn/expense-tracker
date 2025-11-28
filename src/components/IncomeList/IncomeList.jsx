import React, { useState, useEffect } from 'react';
import { getIngresos, deleteIngreso, getConfig } from '../../utils/storage';
import { formatearMoneda } from '../../utils/calculations';
import './IncomeList.css';

const IncomeList = ({ updateTrigger, onListChange }) => {
  const [ingresos, setIngresos] = useState([]);
  const [ingresosMes, setIngresosMes] = useState([]);

  useEffect(() => {
    cargarIngresos();
  }, [updateTrigger]);

  const cargarIngresos = () => {
    const config = getConfig();
    const todosIngresos = getIngresos();
    
    // Filtrar solo los del mes actual
    const ingresosMesActual = todosIngresos.filter(i => 
      i.fecha.startsWith(config.mesActual)
    );
    
    // Ordenar por fecha descendente
    ingresosMesActual.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    setIngresos(todosIngresos);
    setIngresosMes(ingresosMesActual);
  };

  const eliminar = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este ingreso?')) {
      deleteIngreso(id);
      cargarIngresos();
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
    <div className="income-list">
      <h2>Ingresos del Mes ({ingresosMes.length})</h2>
      
      {ingresosMes.length === 0 ? (
        <p className="empty-message">No hay ingresos adicionales este mes</p>
      ) : (
        <div className="ingresos-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresosMes.map(ingreso => (
                <tr key={ingreso.id}>
                  <td>{formatearFecha(ingreso.fecha)}</td>
                  <td className="concepto">{ingreso.concepto}</td>
                  <td className="tipo">{ingreso.tipo}</td>
                  <td className="cantidad">{formatearMoneda(ingreso.cantidad)}</td>
                  <td>
                    <button 
                      onClick={() => eliminar(ingreso.id)}
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

export default IncomeList;