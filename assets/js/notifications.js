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
  function sendTestNotification() {
    if (Notification.permission === "granted") {
        new Notification("MEDITIME - Notificación de prueba", {
            body: "Esta es una notificación de prueba. Las notificaciones push funcionan correctamente.",
            icon: "/assets/img/icons/icon-192.png",
            badge: "/assets/img/icons/icon-72.png"
        });
    } else {
        alert("Debes conceder permisos de notificación primero.");
    }
  }

  // Exponer funciones para uso en la UI (ej. Perfil > Notificaciones)
  window.medicationNotifications = {
    requestPermission: requestNotificationPermission,
    disableNotifications: disableNotifications,
    sendTestNotification: sendTestNotification
  };
  
  // Asignar evento al botón de prueba si existe
  const testBtn = document.getElementById("test-notification");
  if (testBtn) {
      testBtn.addEventListener("click", () => {
          window.medicationNotifications.sendTestNotification();
      });
  }

  // Asignar evento al botón de activar notificaciones si existe
  const enableBtn = document.getElementById("enable-notifications");
  if (enableBtn) {
      enableBtn.addEventListener("click", async () => {
          const session = JSON.parse(localStorage.getItem("meditime_session") || "{}");
          const userId = session.userId || 0;
          
          if (!userId) {
              alert("Debes iniciar sesión para activar las notificaciones.");
              return;
          }

          enableBtn.textContent = "Activando...";
          enableBtn.disabled = true;

          const success = await window.medicationNotifications.requestPermission(userId);
          
          if (success) {
              enableBtn.textContent = "¡Activadas!";
              enableBtn.style.backgroundColor = "#10b981"; // Verde éxito
              enableBtn.style.borderColor = "#10b981";
          } else {
              enableBtn.textContent = "Permitir Alertas";
              enableBtn.disabled = false;
          }
      });
  }
});

