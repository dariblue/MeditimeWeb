import { hideMessage, showMessage, closeModals, mostrarMensajeGlobal } from './perfil-ui.js';
import { cambiarPassword, eliminarCuenta, obtenerSesiones, eliminarSesiones, getSession } from './perfil-api.js';

export async function handleCambiarPasswordSubmit(e, userData) {
    e.preventDefault();
    hideMessage("password-error");
    hideMessage("password-success");

    const passwordActual = document.getElementById("password-actual").value;
    const passwordNuevo = document.getElementById("password-nuevo").value;
    const passwordConfirmar = document.getElementById("password-confirmar").value;

    if (passwordNuevo !== passwordConfirmar) {
        return showMessage("password-error", "Las contraseñas no coinciden");
    }
    if (passwordNuevo.length < 6) {
        return showMessage("password-error", "La nueva contraseña debe tener al menos 6 caracteres");
    }

    try {
        await cambiarPassword(userData.iD_Usuario, passwordActual, passwordNuevo);
        e.target.reset();
        mostrarMensajeGlobal("Contraseña actualizada correctamente", "success");
    } catch (error) {
        console.error("Error:", error);
        mostrarMensajeGlobal(error.message || "Error al cambiar contraseña", "error");
    }
}

export function togglePasswordVisibility() {
    const input = this.parentElement.querySelector("input");
    const icon = this.querySelector("i");
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

export function updatePasswordStrength() {
    const strengthBar = document.querySelector(".strength-bar");
    const strengthText = document.querySelector(".strength-text");
    if (!strengthBar || !strengthText) return;
    const password = this.value;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    strengthBar.style.width = `${strength}%`;
    strengthText.textContent = strength <= 25 ? "Débil" : strength <= 50 ? "Regular" : strength <= 75 ? "Buena" : "Excelente";
}

export async function handleDeleteAccount(userData) {
    const password = document.getElementById("confirm-delete-password").value;
    if (!password) return mostrarMensajeGlobal("Por favor, ingrese su contraseña", "error");

    try {
        await eliminarCuenta(userData.iD_Usuario);
        localStorage.removeItem("meditime_session");
        window.location.href = "/index.html";
    } catch (error) {
        console.error("Error:", error);
        mostrarMensajeGlobal("Error al eliminar cuenta: " + error.message, "error");
    }
}

export async function handleViewSessions(userData) {
    const sessionsModal = document.getElementById("sessions-modal");
    const sessionsList = sessionsModal?.querySelector(".sessions-list");
    if (!sessionsList) return;

    sessionsList.innerHTML = '<div class="loading"><i class="fas fa-circle-notch fa-spin"></i> Cargando sesiones...</div>';
    sessionsModal.classList.add("active");

    try {
        const sesiones = await obtenerSesiones(userData.iD_Usuario);

        if (!sesiones.length) {
            sessionsList.innerHTML = '<p style="text-align:center; padding:20px;">No hay sesiones activas.</p>';
            return;
        }

        const session = getSession();
        sessionsList.innerHTML = sesiones.map(s => {
            const fecha = new Date(s.fechaInicio);
            const fechaStr = fecha.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
            const esCurrent = session && session.token === s.tokenSesion;
            const dispositivo = s.dispositivo || "Desconocido";
            // Extraer info del User-Agent
            let icono = "fa-globe";
            let nombre = dispositivo;
            if (dispositivo.includes("Mobile") || dispositivo.includes("iPhone") || dispositivo.includes("Android")) icono = "fa-mobile-alt";
            else if (dispositivo.includes("iPad") || dispositivo.includes("Tablet")) icono = "fa-tablet-alt";
            else if (dispositivo.includes("Windows") || dispositivo.includes("Mac") || dispositivo.includes("Linux")) icono = "fa-laptop";
            // Acortar User-Agent para mostrar
            if (nombre.length > 60) nombre = nombre.substring(0, 60) + "…";

            return `
                <div class="session-item ${esCurrent ? 'current' : ''}">
                    <div class="session-info">
                        <div class="session-device">
                            <i class="fas ${icono}"></i>
                            <div>
                                <h4>${nombre}</h4>
                                <p>IP: ${s.direccionIP || "Desconocida"}</p>
                                ${esCurrent ? '<span class="session-current">Sesión actual</span>' : ''}
                            </div>
                        </div>
                        <div class="session-time">
                            <p>Inicio: ${fechaStr}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error:", error);
        sessionsList.innerHTML = '<p class="error-message" style="text-align:center; padding:20px;">Error al cargar sesiones.</p>';
    }
}

export async function handleCloseAllSessions(userData) {
    try {
        await eliminarSesiones(userData.iD_Usuario);
        closeModals();
        mostrarMensajeGlobal("Todas las sesiones han sido cerradas", "success");
        setTimeout(() => {
            localStorage.removeItem("meditime_session");
            window.location.href = "login.html";
        }, 1500);
    } catch (error) {
        console.error("Error:", error);
        mostrarMensajeGlobal("Error al cerrar sesiones: " + error.message, "error");
    }
}

export function handleExportData(userData) {
    const dataToExport = {
        usuario: {
            nombre: userData.nombre,
            apellidos: userData.apellidos,
            email: userData.email,
            telefono: userData.telefono,
            fecha_Nacimiento: userData.fecha_Nacimiento,
            domicilio: userData.domicilio,
        },
        preferencias: userData.preferencias,
        configuracionNotificaciones: userData.configuracionNotificaciones,
        medicamentos: [],
        fecha: new Date().toISOString(),
    };
    const jsonData = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meditime_datos_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
