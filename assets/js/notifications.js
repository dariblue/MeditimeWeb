// Sistema de notificaciones para MEDITIME
document.addEventListener("DOMContentLoaded", () => {
  // Verificar si el navegador soporta notificaciones
  const notificationsSupported = "Notification" in window;

  // Estado de la aplicación
  let notificationsEnabled = false;

  // Configuración de notificaciones
  const configuracionNotificaciones = {
    anticipacion: 5, // Minutos de anticipación para notificar
    sonido: true,
  };

  // Solicitar permiso para notificaciones
  async function requestNotificationPermission() {
    if (!notificationsSupported) {
      console.warn("Las notificaciones no son soportadas por este navegador.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        notificationsEnabled = true;
        console.log("Permiso de notificaciones concedido.");
      } else {
        notificationsEnabled = false;
        console.warn("Permiso de notificaciones denegado.");
      }
    } catch (error) {
      console.error("Error al solicitar permiso de notificaciones:", error);
    }
  }

  // Enviar una notificación
  function sendNotification(titulo, mensaje) {
    if (!notificationsEnabled) {
      console.warn("No se pueden enviar notificaciones. Permiso no concedido.");
      return;
    }

    console.log(`Enviando notificación: ${titulo} - ${mensaje}`);

    const notificationOptions = {
      body: mensaje,
      icon: "/assets/img/notificacion.png",
      requireInteraction: true, // Mantener la notificación visible hasta que el usuario interactúe
    };

    const notification = new Notification(titulo, notificationOptions);

    // Reproducir sonido si está habilitado
    // if (configuracionNotificaciones.sonido) {
    //   playNotificationSound();
    // }

    // Manejar clic en la notificación
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  // Reproducir sonido de notificación
  function playNotificationSound() {
    const audio = new Audio("/notification-sound.mp3");
    audio.volume = 0.7;
    audio.play().catch((error) => {
      console.error("Error al reproducir sonido:", error);
    });
  }

  // Probar notificaciones
  function sendTestNotification() {
    sendNotification(
      "MEDITIME - Notificación de prueba",
      "Esta es una notificación de prueba. Las notificaciones de medicamentos funcionan correctamente."
    );
  }

  // Iniciar servicio de notificaciones
  function startNotificationService() {
    if (!notificationsEnabled) {
      console.warn("No se puede iniciar el servicio de notificaciones. Permiso no concedido.");
      return;
    }

    console.log("Servicio de notificaciones iniciado.");

    let lastCheckedMinute = null;

    setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();

      if (currentMinute !== lastCheckedMinute) {
        lastCheckedMinute = currentMinute;
        checkMedicamentosParaNotificar();
      }
    }, 10000); // Verificar cada 10 segundos si ha cambiado el minuto
  }

  function checkMedicamentosParaNotificar() {
    const now = new Date();
    const medicamentosHoy = getMedicamentosPorDia(now);

    medicamentosHoy.forEach((medicamento) => {
      const [hours, minutes] = medicamento.hora.split(":");
      const medicamentoTime = new Date();
      medicamentoTime.setHours(Number(hours), Number(minutes), 0, 0);

      if (now >= medicamentoTime && now <= new Date(medicamentoTime.getTime() + 60000)) {
        sendNotification(
          `¡Hora de tomar ${medicamento.nombre}!`,
          `Dosis: ${medicamento.dosis}.`
        );
      }
    });
  }

  // Exponer funciones para uso externo
  window.medicationNotifications = {
    requestPermission: requestNotificationPermission,
    sendTestNotification: sendTestNotification,
    startNotificationService: startNotificationService,
  };

  // Solicitar permiso al cargar la página
  requestNotificationPermission();
});

document.getElementById("test-notification").addEventListener("click", () => {
  if (window.medicationNotifications) {
    window.medicationNotifications.sendTestNotification();
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "MEDITIME - Notificación";
  const options = {
    body: data.body || "Tienes un recordatorio pendiente.",
    icon: "/assets/img/notificacion.png",
    badge: "/placeholder.svg?height=32&width=32",
    tag: data.tag || "meditime-notification",
    requireInteraction: true,
    actions: [
      { action: "completar", title: "Completar" },
      { action: "posponer", title: "Posponer 15 min" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "completar") {
    // Lógica para completar el medicamento
    console.log("Medicamento completado");
  } else if (event.action === "posponer") {
    // Lógica para posponer la notificación
    console.log("Notificación pospuesta");
  } else {
    // Abrir la aplicación si el usuario hace clic en la notificación
    event.waitUntil(clients.openWindow("/"));
  }
});
