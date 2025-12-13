import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { RefreshCw, X } from 'lucide-react';

/**
 * Banner que aparece cuando hay una nueva versión de la app disponible
 * Permite al usuario actualizar inmediatamente sin tener que cerrar y reabrir
 */
const UpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Escuchar eventos del service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        // Listener para cuando hay una actualización esperando
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              setShowBanner(true);
              setRegistration(reg);
            }
          });
        });

        // Verificar si ya hay una actualización esperando
        if (reg.waiting) {
          setShowBanner(true);
          setRegistration(reg);
        }
      });

      // Listener alternativo usando el mensaje del serviceWorkerRegistration
      const onUpdate = (reg) => {
        setShowBanner(true);
        setRegistration(reg);
      };

      // Guardar callback para posible uso externo
      window.onSWUpdate = onUpdate;
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Enviar mensaje al service worker para que se active inmediatamente
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Recargar la página cuando el nuevo SW tome control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
      <div className="w-full lg:max-w-7xl lg:mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Nueva versión disponible</p>
            <p className="text-xs text-white/90">Toca actualizar para ver las últimas mejoras</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            className="bg-white text-green-600 hover:bg-white/90 font-semibold"
          >
            Actualizar
          </Button>
          <Button
            onClick={handleDismiss}
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;
