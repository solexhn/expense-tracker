import { useState, useEffect } from 'react';
import { getConfig, saveConfig, registrarNomina, establecerSaldoInicial } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui-simple/Card';
import { Input } from '../ui-simple/Input';
import { Label } from '../ui-simple/Label';
import { Button } from '../ui-simple/Button';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';

const BaseIncomeConfig = ({ onConfigUpdate }) => {
  const [incomeBase, setIncomeBase] = useState(0);
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [fondoDisponible, setFondoDisponible] = useState(0);
  const [ultimaNomina, setUltimaNomina] = useState(null);

  // Estado para ajuste de saldo
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [saldoNuevo, setSaldoNuevo] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [ajusteExitoso, setAjusteExitoso] = useState(false);

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

  const handleAjustarSaldo = (e) => {
    e.preventDefault();
    if (!saldoNuevo) return;

    const config = establecerSaldoInicial(
      saldoNuevo,
      motivoAjuste || 'Ajuste manual'
    );

    setFondoDisponible(config.fondoDisponible);
    setAjusteExitoso(true);
    setSaldoNuevo('');
    setMotivoAjuste('');

    // Ocultar mensaje de éxito después de 3 segundos
    setTimeout(() => {
      setAjusteExitoso(false);
      setMostrarAjuste(false);
    }, 3000);

    if (onConfigUpdate) onConfigUpdate();
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
            <p>Fondo actual: <strong>{fondoDisponible.toFixed(2)}€</strong></p>
            <p>Última nómina: <strong>{ultimaNomina || '—'}</strong></p>
          </div>
        </div>

        {/* Sección de ajuste de saldo */}
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FiAlertCircle className="text-orange-500" />
              Ajustar Saldo Inicial
            </h3>
            <button
              type="button"
              onClick={() => setMostrarAjuste(!mostrarAjuste)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {mostrarAjuste ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {mostrarAjuste && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                ¿Empezando de nuevo o tu saldo no coincide? Establece aquí tu saldo real actual.
                <br />
                <span className="text-xs opacity-75">
                  Esto NO borra tus gastos recurrentes ni deudas configuradas.
                </span>
              </p>

              {ajusteExitoso ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <FiCheck />
                  <span>¡Saldo actualizado correctamente!</span>
                </div>
              ) : (
                <form onSubmit={handleAjustarSaldo} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="saldoNuevo">Saldo actual real (€) *</Label>
                      <Input
                        type="number"
                        id="saldoNuevo"
                        value={saldoNuevo}
                        onChange={(e) => setSaldoNuevo(e.target.value)}
                        step="0.01"
                        placeholder="Ej: 523.45"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="motivoAjuste">Motivo (opcional)</Label>
                      <Input
                        type="text"
                        id="motivoAjuste"
                        value={motivoAjuste}
                        onChange={(e) => setMotivoAjuste(e.target.value)}
                        placeholder="Ej: Inicio febrero 2026"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      Establecer como saldo inicial
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Saldo anterior: {fondoDisponible.toFixed(2)}€
                    </span>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BaseIncomeConfig;