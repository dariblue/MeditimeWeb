import { fetchUserData, buscarResponsable, asignarResponsableAPI, registrarResponsableAPI, eliminarResponsableAPI } from './perfil-api.js';
import { changeTab, closeModals, fillUserForms, actualizarStatusCard, cargarResponsables, mostrarResponsableExistente, mostrarFormularioRegistroResponsable, cancelarBusqueda, cerrarModalResponsable, mostrarMensajeGlobal } from './perfil-ui.js';
import { handleDatosPersonalesSubmit, handleAvatarChange } from './perfil-datos.js';
import { handleCambiarPasswordSubmit, togglePasswordVisibility, updatePasswordStrength, handleDeleteAccount, handleViewSessions, handleCloseAllSessions, handleExportData } from './perfil-seguridad.js';
import { handleNotificacionesSubmit, handlePreferenciasSubmit, setupNotificationPermission, fillNotificacionesForms, fillPreferenciasForms, applyPreferences } from './perfil-config.js';

let userData = {};
let responsablesAsignados = [];
let cuidadoresAsignados = [];

document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {
    setupEvents();
    setupNotificationPermission();
    loadUserData();
}

function setupEvents() {
    // Cambio de pestañas
    document.querySelectorAll(".perfil-menu-item").forEach((item) => {
        item.addEventListener("click", () => {
            const tab = item.getAttribute("data-tab");
            if (tab) changeTab(tab);
        });
    });

    // Formularios
    const datosPersonalesForm = document.getElementById("datos-personales-form");
    if (datosPersonalesForm) datosPersonalesForm.addEventListener("submit", (e) => handleDatosPersonalesSubmit(e, userData, (d) => { userData = d; }));

    const cambiarPasswordForm = document.getElementById("cambiar-password-form");
    if (cambiarPasswordForm) cambiarPasswordForm.addEventListener("submit", (e) => handleCambiarPasswordSubmit(e, userData));

    const notificacionesForm = document.getElementById("notificaciones-form");
    if (notificacionesForm) notificacionesForm.addEventListener("submit", (e) => handleNotificacionesSubmit(e, userData));

    const preferenciasForm = document.getElementById("preferencias-form");
    if (preferenciasForm) preferenciasForm.addEventListener("submit", (e) => handlePreferenciasSubmit(e, userData));

    // Avatar
    const changeAvatarBtn = document.getElementById("change-avatar-btn");
    const avatarUpload = document.getElementById("avatar-upload");
    if (changeAvatarBtn && avatarUpload) {
        changeAvatarBtn.addEventListener("click", () => avatarUpload.click());
        avatarUpload.addEventListener("change", (e) => handleAvatarChange(e, userData));
    }

    // Contraseña
    document.querySelectorAll(".toggle-password").forEach(btn => btn.addEventListener("click", togglePasswordVisibility));
    const passwordNuevo = document.getElementById("password-nuevo");
    if (passwordNuevo) passwordNuevo.addEventListener("input", updatePasswordStrength);

    // Eliminar cuenta
    const deleteAccountBtn = document.getElementById("delete-account-btn");
    const confirmDeleteModal = document.getElementById("confirm-delete-modal");
    if (deleteAccountBtn) deleteAccountBtn.addEventListener("click", () => confirmDeleteModal.classList.add("active"));
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeModals);
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", () => handleDeleteAccount(userData));

    // Modales
    document.querySelectorAll(".close-modal").forEach(btn => btn.addEventListener("click", closeModals));
    const sessionsModal = document.getElementById("sessions-modal");
    window.addEventListener("click", (event) => {
        if (event.target === confirmDeleteModal || event.target === sessionsModal) closeModals();
    });

    // Sesiones — cargar desde API al abrir modal
    const viewSessionsBtn = document.getElementById("view-sessions-btn");
    if (viewSessionsBtn) viewSessionsBtn.addEventListener("click", () => handleViewSessions(userData));
    const closeSessionsModalBtn = document.getElementById("close-sessions-modal-btn");
    if (closeSessionsModalBtn) closeSessionsModalBtn.addEventListener("click", closeModals);
    const closeAllSessionsBtn = document.getElementById("close-all-sessions-btn");
    if (closeAllSessionsBtn) closeAllSessionsBtn.addEventListener("click", () => handleCloseAllSessions(userData));
    const exportDataBtn = document.getElementById("export-data-btn");
    if (exportDataBtn) exportDataBtn.addEventListener("click", () => handleExportData(userData));
}

async function loadUserData() {
    try {
        const session = JSON.parse(localStorage.getItem("meditime_session") || "null");
        if (!session) {
            window.location.href = "login.html";
            return;
        }

        const data = await fetchUserData();

        userData = {
            iD_Usuario: data.idUsuario,
            nombre: data.nombre || "",
            apellidos: data.apellidos || "",
            email: data.email || "",
            telefono: data.telefono || null,
            fecha_Nacimiento: data.fechaNacimiento || "",
            domicilio: data.domicilio || "",
            avatarBase64: data.avatarBase64 || null,
            rolBackend: data.rol || "Usuario",
            esResponsable: !!data.esResponsable,
            rol: data.esResponsable ? "responsable" : "no_responsable",
            preferencias: data.preferencias || null,
            configuracionNotificaciones: data.configuracionNotificaciones || null
        };

        const vinculados = Array.isArray(data.cuidadores) ? data.cuidadores : [];

        responsablesAsignados = vinculados
            .filter(u => (u.rol || "").trim().toLowerCase() === "responsable")
            .map(u => ({ id: u.idUsuario, nombre: `${u.nombre} ${u.apellidos || ""}`.trim(), email: u.email, rol: u.rol }));

        cuidadoresAsignados = vinculados
            .filter(u => (u.rol || "").trim().toLowerCase() === "cuidador")
            .map(u => ({ id: u.idUsuario, nombre: `${u.nombre} ${u.apellidos || ""}`.trim(), email: u.email, rol: u.rol }));

        fillUserForms(userData);
        fillNotificacionesForms(userData);
        fillPreferenciasForms(userData);
        if (userData.preferencias) applyPreferences(userData);

        // Cargar avatar si existe
        if (userData.avatarBase64) {
            const avatarPreview = document.getElementById("avatar-preview");
            if (avatarPreview) avatarPreview.src = userData.avatarBase64;
        }

        initResponsablesSeccion();
    } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
    }
}

function initResponsablesSeccion() {
    const btnAgregar = document.getElementById('btnAgregarResponsable');
    if (btnAgregar) {
        const nuevoBoton = btnAgregar.cloneNode(true);
        btnAgregar.parentNode.replaceChild(nuevoBoton, btnAgregar);
        nuevoBoton.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('modalAgregarResponsable').style.display = 'flex';
            document.getElementById('buscarResponsableEmail').value = '';
            document.getElementById('resultadoBusquedaResponsable').innerHTML = '';
        });
    }

    const btnBuscar = document.getElementById('btnBuscarResponsable');
    if (btnBuscar) btnBuscar.addEventListener('click', onBuscarResponsable);

    const inputBuscar = document.getElementById('buscarResponsableEmail');
    if (inputBuscar) {
        inputBuscar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); onBuscarResponsable(); }
        });
    }

    actualizarStatusCard(userData);
    cargarResponsables(userData, responsablesAsignados, onEliminarResponsable);
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function onBuscarResponsable() {
    const email = document.getElementById('buscarResponsableEmail').value.trim().toLowerCase();
    const resultadoDiv = document.getElementById('resultadoBusquedaResponsable');
    const btn = document.getElementById('btnBuscarResponsable');

    if (!email) { resultadoDiv.innerHTML = '<p class="error-message">Ingresa un email</p>'; return; }
    if (!validarEmail(email)) { resultadoDiv.innerHTML = '<p class="error-message">Email inválido</p>'; return; }
    if (responsablesAsignados.some(r => r.email.toLowerCase() === email)) {
        resultadoDiv.innerHTML = '<p class="error-message">Este responsable ya está asignado</p>'; return;
    }

    btn.disabled = true;
    btn.textContent = 'Buscando...';

    try {
        const data = await buscarResponsable(email);
        if (data.existe && data.usuario) {
            mostrarResponsableExistente({
                id: data.usuario.id,
                nombre: data.usuario.nombre,
                email: data.usuario.email,
                rol: data.usuario.rol
            }, onAsignarResponsable);
        } else {
            mostrarFormularioRegistroResponsable(email, onRegistrarYAsignarResponsable, cancelarBusqueda);
        }
    } catch (error) {
        console.error(error);
        resultadoDiv.innerHTML = '<p class="error-message">Error al conectar con el servidor</p>';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Buscar';
    }
}

async function onAsignarResponsable(id, nombre, email) {
    try {
        await asignarResponsableAPI(userData.iD_Usuario, id);
        await loadUserData();
        cerrarModalResponsable();
        mostrarMensajeGlobal('Responsable asignado correctamente', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensajeGlobal('Error al asignar responsable: ' + error.message);
    }
}

async function onRegistrarYAsignarResponsable(email, event) {
    const nombre = document.getElementById('nuevoResponsableNombre').value.trim();
    const password = document.getElementById('nuevoResponsablePassword').value.trim();

    if (!nombre || !password || password.length < 6) {
        alert('Completa todos los campos correctamente (contraseña mínimo 6 caracteres)');
        return;
    }

    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
        await registrarResponsableAPI(nombre, email, password);
        const dataBuscar = await buscarResponsable(email);
        if (!dataBuscar.existe || !dataBuscar.usuario) throw new Error('No se encontró al responsable recién registrado');

        await asignarResponsableAPI(userData.iD_Usuario, dataBuscar.usuario.id);
        await loadUserData();
        cerrarModalResponsable();
        mostrarMensajeGlobal('Responsable registrado y asignado correctamente', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensajeGlobal('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function onEliminarResponsable(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este responsable?')) return;
    try {
        await eliminarResponsableAPI(userData.iD_Usuario, id);
        await loadUserData();
        mostrarMensajeGlobal('Responsable eliminado correctamente', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensajeGlobal('Error al eliminar responsable: ' + error.message);
    }
}

window.cancelarBusqueda = cancelarBusqueda;
window.cerrarModalResponsable = cerrarModalResponsable;
