import React, { useState, useMemo } from 'react';
import { getGastosFijos } from '../../utils/storage';
import { formatearMoneda, calcularDiaRealCobro } from '../../utils/calculations';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiCreditCard } from 'react-icons/fi';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CalendarView = () => {
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date();
    return { mes: hoy.getMonth(), año: hoy.getFullYear() };
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  // Obtener gastos fijos y mapearlos por día
  const cobrosPorDia = useMemo(() => {
    const gastosFijos = getGastosFijos().filter(g => g.estado === 'activo');
    const mapa = {};

    gastosFijos.forEach(gasto => {
      const diaReal = calcularDiaRealCobro(gasto.diaDelMes, mesActual.año, mesActual.mes + 1);
      if (!mapa[diaReal]) {
        mapa[diaReal] = [];
      }
      mapa[diaReal].push(gasto);
    });

    return mapa;
  }, [mesActual]);

  // Calcular días del mes
  const diasDelMes = useMemo(() => {
    const primerDia = new Date(mesActual.año, mesActual.mes, 1);
    const ultimoDia = new Date(mesActual.año, mesActual.mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();

    // Día de la semana del primer día (0 = domingo, ajustar para lunes = 0)
    let diaInicio = primerDia.getDay() - 1;
    if (diaInicio < 0) diaInicio = 6;

    const dias = [];

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < diaInicio; i++) {
      dias.push(null);
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(dia);
    }

    return dias;
  }, [mesActual]);

  // Total de cobros del mes
  const totalMes = useMemo(() => {
    return Object.values(cobrosPorDia).flat().reduce((sum, g) => sum + parseFloat(g.cantidad), 0);
  }, [cobrosPorDia]);

  const cambiarMes = (direccion) => {
    setMesActual(prev => {
      let nuevoMes = prev.mes + direccion;
      let nuevoAño = prev.año;

      if (nuevoMes > 11) {
        nuevoMes = 0;
        nuevoAño++;
      } else if (nuevoMes < 0) {
        nuevoMes = 11;
        nuevoAño--;
      }

      return { mes: nuevoMes, año: nuevoAño };
    });
    setDiaSeleccionado(null);
  };

  const hoy = new Date();
  const esHoy = (dia) => {
    return dia === hoy.getDate() &&
           mesActual.mes === hoy.getMonth() &&
           mesActual.año === hoy.getFullYear();
  };

  const cobrosDiaSeleccionado = diaSeleccionado ? cobrosPorDia[diaSeleccionado] || [] : [];

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <h3 className="calendar-title">
          <span className="section-title__icon">
            <FiCalendar style={{ width: '1rem', height: '1rem' }} />
          </span>
          Calendario de Cobros
        </h3>
        <div className="calendar-summary">
          <span className="calendar-summary__label">Total del mes:</span>
          <span className="calendar-summary__value">{formatearMoneda(totalMes)}</span>
        </div>
      </div>

      {/* Navegación del mes */}
      <div className="calendar-nav">
        <button className="calendar-nav__btn" onClick={() => cambiarMes(-1)}>
          <FiChevronLeft />
        </button>
        <span className="calendar-nav__month">
          {MESES[mesActual.mes]} {mesActual.año}
        </span>
        <button className="calendar-nav__btn" onClick={() => cambiarMes(1)}>
          <FiChevronRight />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="calendar-weekdays">
        {DIAS_SEMANA.map(dia => (
          <div key={dia} className="calendar-weekday">{dia}</div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="calendar-grid">
        {diasDelMes.map((dia, index) => {
          if (dia === null) {
            return <div key={`empty-${index}`} className="calendar-day calendar-day--empty" />;
          }

          const cobros = cobrosPorDia[dia] || [];
          const tieneCobros = cobros.length > 0;
          const totalDia = cobros.reduce((sum, g) => sum + parseFloat(g.cantidad), 0);

          return (
            <button
              key={dia}
              className={`calendar-day ${esHoy(dia) ? 'calendar-day--today' : ''} ${tieneCobros ? 'calendar-day--has-payment' : ''} ${diaSeleccionado === dia ? 'calendar-day--selected' : ''}`}
              onClick={() => setDiaSeleccionado(dia === diaSeleccionado ? null : dia)}
            >
              <span className="calendar-day__number">{dia}</span>
              {tieneCobros && (
                <div className="calendar-day__indicator">
                  <span className="calendar-day__dot" />
                  <span className="calendar-day__amount">{formatearMoneda(totalDia)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detalle del día seleccionado */}
      {diaSeleccionado && cobrosDiaSeleccionado.length > 0 && (
        <div className="calendar-detail">
          <h4 className="calendar-detail__title">
            Cobros del {diaSeleccionado} de {MESES[mesActual.mes]}
          </h4>
          <div className="calendar-detail__list">
            {cobrosDiaSeleccionado.map(cobro => (
              <div key={cobro.id} className="calendar-detail__item">
                <div className="calendar-detail__icon">
                  <FiCreditCard />
                </div>
                <div className="calendar-detail__info">
                  <span className="calendar-detail__name">{cobro.nombre}</span>
                  <span className="calendar-detail__category">{cobro.categoria}</span>
                </div>
                <span className="calendar-detail__amount">
                  {formatearMoneda(cobro.cantidad)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="calendar-legend">
        <div className="calendar-legend__item">
          <span className="calendar-legend__dot calendar-legend__dot--today" />
          <span>Hoy</span>
        </div>
        <div className="calendar-legend__item">
          <span className="calendar-legend__dot calendar-legend__dot--payment" />
          <span>Día de cobro</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
