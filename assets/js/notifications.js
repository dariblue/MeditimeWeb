// Sistema de notificaciones (UI y Permisos) para MEDITIME
document.addEventListener("DOMContentLoaded", async () => {
  // Verificar si el navegador soporta notificaciones
  const notificationsSupported = "Notification" in window;

  // Intentar inicializar el PushManager
  if (window.pushManagerInstance) {
      await window.pushManagerInstance.init();
  }

  // Configuración de notificaciones local (fallback/UI settings)
  const configuracionNotificaciones = {
    anticipacion: 5,
    sonido: true,
  };

  // Función exportada para solicitar permiso (ej: desde un botón en Perfil)
  async function requestNotificationPermission(userId) {
    if (!notificationsSupported) {
      console.warn("Las notificaciones no son soportadas por este navegador.");
      alert("Tu navegador no soporta notificaciones.");
      return false;
    }

    try {
        if (window.pushManagerInstance) {
            const subscription = await window.pushManagerInstance.subscribe(userId);
            if (subscription) {
                console.log("Suscripción Push completada con éxito.");
                alert("¡Notificaciones activadas correctamente!");
                return true;
            } else {
                console.warn("No se pudo obtener la suscripción Push.");
                alert("No se pudieron activar las notificaciones. Verifica los permisos.");
                return false;
            }
        } else {
            // Fallback si no hay pushManager
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
    } catch (error) {
      console.error("Error al solicitar permiso de notificaciones:", error);
      return false;
    }
  }
  
  async function disableNotifications(userId) {
      if (window.pushManagerInstance) {
          const success = await window.pushManagerInstance.unsubscribe(userId);
          if (success) {
              alert("Notificaciones desactivadas correctamente.");
          } else {
              alert("Hubo un problema al desactivar las notificaciones.");
          }
      }
  }

  // Notificación local de prueba
  async function sendTestNotification() {
    if (Notification.permission === "granted") {
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification("MEDITIME - Notificación de prueba", {
                    body: "Esta es una notificación de prueba. Las notificaciones push funcionan correctamente.",
                    icon: "/assets/img/icons/icon-192.png",
                    badge: "/assets/img/icons/icon-72.png",
                    vibrate: [200, 100, 200]
                });
            } else {
                new Notification("MEDITIME - Notificación de prueba", {
                    body: "Esta es una notificación de prueba. Las notificaciones push funcionan correctamente.",
                    icon: "/assets/img/icons/icon-192.png"
                });
            }
        } catch (error) {
            console.error("Error al enviar notificación de prueba:", error);
            alert("Error al mostrar la notificación: " + error.message);
        }
    } else {
        alert("Debes conceder permisos de notificación primero.");
    }
  }

  // Función para comprobar y solicitar automáticamente (se llama desde inicio.js y recordatorios.js)
  async function checkAndPrompt(userId) {
      if (!userId) return;

      const cacheKey = `meditime_alerts_${userId}`;
      const dismissKey = `meditime_alerts_dismissed_${userId}`;
      const status = localStorage.getItem(cacheKey);

      // Si ya está configurado, verificar la suscripción real silenciosamente
      if (status === 'configured') {
          if ('serviceWorker' in navigator && window.pushManagerInstance) {
              try {
                  const reg = await navigator.serviceWorker.ready;
                  const sub = await reg.pushManager.getSubscription();
                  if (sub) {
                      return; // Todo correcto, suscripción activa
                  }
                  // Se desuscribió — no borrar la config, simplemente intentar re-suscribir
                  // en silencio sin molestar al usuario
                  try {
                      const newSub = await window.pushManagerInstance.subscribe(userId);
                      if (newSub) return;
                  } catch (e) { /* silencioso */ }
              } catch (e) {
                  return; // Error de SW, no molestar
              }
          } else {
              return;
          }
      }

      // Comprobar si el usuario ya rechazó recientemente (cooldown 24h)
      const dismissed = localStorage.getItem(dismissKey);
      if (dismissed) {
          const dismissedAt = parseInt(dismissed, 10);
          const horasPasadas = (Date.now() - dismissedAt) / (1000 * 60 * 60);
          if (horasPasadas < 24) return; // No preguntar en 24h
      }

      // Si el navegador ya denegó los permisos, no insistir
      if (Notification.permission === 'denied') {
          console.warn("Permisos denegados previamente.");
          return;
      }

      // Si ya tiene permiso granted pero no suscripción, intentar suscribir silenciosamente
      if (Notification.permission === 'granted' && window.pushManagerInstance) {
          try {
              const sub = await window.pushManagerInstance.subscribe(userId);
              if (sub) {
                  localStorage.setItem(cacheKey, 'configured');
                  return;
              }
          } catch (e) { /* silencioso */ }
      }

      // Preguntar amigablemente antes de lanzar el prompt del navegador
      const wantsAlerts = confirm("¡Hola! Para que no olvides tus tomas, MediTime necesita enviarte recordatorios. ¿Deseas activar las notificaciones push ahora?");
      
      if (wantsAlerts) {
          const success = await requestNotificationPermission(userId);
          if (success) {
              localStorage.setItem(cacheKey, 'configured');
              localStorage.removeItem(dismissKey);
          } else {
              // Suscripción falló pero no es culpa del usuario, guardar cooldown corto
              localStorage.setItem(dismissKey, String(Date.now()));
          }
      } else {
          // Usuario rechazó el prompt — no molestar en 24h
          localStorage.setItem(dismissKey, String(Date.now()));
      }
  }

  // Exponer funciones para uso en la UI
  window.medicationNotifications = {
    requestPermission: requestNotificationPermission,
    disableNotifications: disableNotifications,
    sendTestNotification: sendTestNotification,
    checkAndPrompt: checkAndPrompt
  };
});

