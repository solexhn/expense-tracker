import {
  getConfig,
  getGastosFijos,
  getGastosVariables,
  getIngresos,
  saveConfig
} from '../../utils/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Upload } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <CardTitle>Backup de Datos</CardTitle>
        <CardDescription>
          Descarga una copia de seguridad de todos tus datos o restaura un backup anterior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Datos
              </CardTitle>
              <CardDescription>
                Descarga todos tus datos en un archivo JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportarDatos} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Descargar Backup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Datos
              </CardTitle>
              <CardDescription>
                Restaura datos desde un archivo de backup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <label htmlFor="file-upload">
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar Archivo
                  </span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={importarDatos}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-destructive">⚠️ Sobrescribirá tus datos actuales</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default Backup;