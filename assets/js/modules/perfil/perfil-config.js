import { hideMessage, showMessage, mostrarMensajeGlobal } from './perfil-ui.js';
import { guardarNotificaciones, guardarPreferencias } from './perfil-api.js';

export async function handleNotificacionesSubmit(e, userData) {
    e.preventDefault();
    hideMessage("notificaciones-error");
    hideMessage("notificaciones-success");

    const config = {
        emailMedicamentos: document.getElementById("email-meds").checked,
        navegadorMedicamentos: document.getElementById("browser-meds").checked,
        tiempoAnticipacion: parseInt(document.getElementById("reminder-time").value),
        nuevasCaracteristicas: document.getElementById("features-updates").checked,
        consejos: document.getElementById("tips-updates").checked,
    };

    try {
        await guardarNotificaciones(userData.iD_Usuario, config);
        userData.configuracionNotificaciones = config;
        mostrarMensajeGlobal("Preferencias de notificaciones actualizadas correctamente", "success");
    } catch (error) {
        console.error("Error:", error);
        mostrarMensajeGlobal(error.message || "Error al actualizar preferencias", "error");
    }
}

export async function handlePreferenciasSubmit(e, userData) {
    e.preventDefault();
    hideMessage("preferencias-error");
    hideMessage("preferencias-success");

    const prefs = {
        tema: document.getElementById("theme").value,
        tamanoTexto: document.getElementById("font-size").value,
        vistaCalendario: document.getElementById("calendar-view").value,
        primerDiaSemana: parseInt(document.getElementById("first-day").value),
        idioma: document.getElementById("language").value,
        formatoHora: document.getElementById("time-format").value,
    };

    try {
        await guardarPreferencias(userData.iD_Usuario, prefs);
        userData.preferencias = prefs;
        applyPreferences(userData);
        mostrarMensajeGlobal("Preferencias actualizadas correctamente", "success");
    } catch (error) {
        console.error("Error:", error);
        mostrarMensajeGlobal(error.message || "Error al actualizar preferencias", "error");
    }
}

export function applyPreferences(userData) {
    if (!userData.preferencias) return;
    if (userData.preferencias.tema === "dark") {
        document.body.classList.add("dark-theme");
    } else {
        document.body.classList.remove("dark-theme");
    }
    document.body.classList.remove("text-small", "text-medium", "text-large");
    document.body.classList.add(`text-${userData.preferencias.tamanoTexto}`);
}

export function fillNotificacionesForms(userData) {
    if (!userData.configuracionNotificaciones) return;
    const c = userData.configuracionNotificaciones;
    const el = (id) => document.getElementById(id);
    if (el("email-meds")) el("email-meds").checked = c.emailMedicamentos;
    if (el("browser-meds")) el("browser-meds").checked = c.navegadorMedicamentos;
    if (el("reminder-time")) el("reminder-time").value = c.tiempoAnticipacion;
    if (el("features-updates")) el("features-updates").checked = c.nuevasCaracteristicas;
    if (el("tips-updates")) el("tips-updates").checked = c.consejos;
}

export function fillPreferenciasForms(userData) {
    if (!userData.preferencias) return;
    const p = userData.preferencias;
    const el = (id) => document.getElementById(id);
    if (el("theme")) el("theme").value = p.tema;
    if (el("font-size")) el("font-size").value = p.tamanoTexto;
    if (el("calendar-view")) el("calendar-view").value = p.vistaCalendario;
    if (el("first-day")) el("first-day").value = p.primerDiaSemana;
    if (el("language")) el("language").value = p.idioma;
    if (el("time-format")) el("time-format").value = p.formatoHora;
}

export function setupNotificationPermission() {
    const browserToggle = document.getElementById("browser-meds");
    if (browserToggle) {
        browserToggle.addEventListener("change", (e) => {
            if (e.target.checked && window.medicationNotifications) {
                window.medicationNotifications.requestPermission();
            }
        });
    }
}
