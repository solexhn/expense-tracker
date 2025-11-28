import React from 'react';
import { 
  getConfig, 
  getGastosFijos, 
  getGastosVariables, 
  getIngresos,
  saveConfig,
  saveGastoFijo,
  saveGastoVariable,
  saveIngreso
} from '../../utils/storage';
import './Backup.css';

const Backup = ({ onDataRestored }) => {
  
  const exportarDatos = () => {
    const datos = {
      version: '1.0',
      fecha: new Date().toISOString(),
      config: getConfig(),
      gastosFijos: getGastosFijos(),
      gastosVariables: getGastosVariables(),
      ingresos: getIngresos()
    };

    const dataStr = JSON.stringify(datos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-gastos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importarDatos = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const datos = JSON.parse(e.target.result);
        
        // Validar que tenga la estructura correcta
        if (!datos.config || !datos.gastosFijos || !datos.gastosVariables || !datos.ingresos) {
          alert('El archivo no tiene el formato correcto');
          return;
        }

        // Confirmar antes de sobrescribir
        const confirmar = window.confirm(
          '⚠️ IMPORTANTE: Esto SOBRESCRIBIRÁ todos tus datos actuales.\n\n' +
          '¿Estás seguro de que quieres continuar?'
        );
        
        if (!confirmar) return;

        // Limpiar localStorage
        localStorage.clear();

        // Restaurar configuración
        saveConfig(datos.config);

        // Restaurar gastos fijos
        datos.gastosFijos.forEach(gasto => {
          localStorage.setItem('gastosFijos', JSON.stringify(datos.gastosFijos));
        });

        // Restaurar gastos variables
        localStorage.setItem('gastosVariables', JSON.stringify(datos.gastosVariables));

        // Restaurar ingresos
        localStorage.setItem('ingresos', JSON.stringify(datos.ingresos));

        alert('✅ Datos restaurados correctamente');
        
        if (onDataRestored) onDataRestored();
        
        // Recargar la página para refrescar todo
        window.location.reload();

      } catch (error) {
        console.error('Error al importar:', error);
        alert('❌ Error al leer el archivo. Asegúrate de que sea un backup válido.');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="backup-section">
      <h2>Backup de Datos</h2>
      <p className="backup-description">
        Descarga una copia de seguridad de todos tus datos o restaura un backup anterior.
      </p>
      
      <div className="backup-actions">
        <div className="backup-card">
          <h3>📥 Exportar Datos</h3>
          <p>Descarga todos tus datos en un archivo JSON.</p>
          <button onClick={exportarDatos} className="btn-export">
            Descargar Backup
          </button>
        </div>

        <div className="backup-card">
          <h3>📤 Importar Datos</h3>
          <p>Restaura datos desde un archivo de backup.</p>
          <label className="btn-import">
            Seleccionar Archivo
            <input 
              type="file" 
              accept=".json" 
              onChange={importarDatos}
              style={{ display: 'none' }}
            />
          </label>
          <p className="warning">⚠️ Sobrescribirá tus datos actuales</p>
        </div>
      </div>
    </div>
  );
};

export default Backup;