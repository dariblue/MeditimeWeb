// ─────────────────────────────────────────────────────
// perfil-api.js — Centraliza TODOS los fetch del perfil
// API_URL apunta a la dirección de producción api.dariblue.dev
// ─────────────────────────────────────────────────────
export const API_URL = "https://api.dariblue.dev";

export function getSession() {
    return JSON.parse(localStorage.getItem("meditime_session") || "null");
}

export function updateSession(updatedData) {
    const session = getSession();
    if (!session) return;
    localStorage.setItem("meditime_session", JSON.stringify({ ...session, ...updatedData }));
}

// ── GET /Usuarios/{id} ──
export async function fetchUserData() {
    const session = getSession();
    if (!session) return null;
    const res = await fetch(`${API_URL}/Usuarios/${session.userId}`, {
        headers: { "Authorization": `Bearer ${session.token}` }
    });
    if (!res.ok) throw new Error("Error al cargar datos del usuario");
    return await res.json();
}

// ── GET /Usuarios/buscar?email= ──
export async function buscarResponsable(email) {
    const res = await fetch(`${API_URL}/Usuarios/buscar?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(await res.text() || 'Error al buscar');
    return await res.json();
}

// ── PUT /Usuarios/{id} — Datos personales ──
export async function actualizarDatosPersonales(id, datos) {
    const res = await fetch(`${API_URL}/Usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error(await res.text() || "Error al actualizar datos");
    return await res.json();
}

// ── POST /Usuarios/cambiar-password ──
export async function cambiarPassword(id, passwordActual, passwordNuevo) {
    const res = await fetch(`${API_URL}/Usuarios/cambiar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, passwordActual, passwordNuevo })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al cambiar contraseña");
    return data;
}

// ── PUT /Usuarios/{id}/notificaciones ──
export async function guardarNotificaciones(id, config) {
    const res = await fetch(`${API_URL}/Usuarios/${id}/notificaciones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error(await res.text() || "Error al guardar notificaciones");
    return await res.json();
}

// ── PUT /Usuarios/{id}/preferencias ──
export async function guardarPreferencias(id, prefs) {
    const res = await fetch(`${API_URL}/Usuarios/${id}/preferencias`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs)
    });
    if (!res.ok) throw new Error(await res.text() || "Error al guardar preferencias");
    return await res.json();
}

// ── PUT /Usuarios/{id}/avatar ──
export async function actualizarAvatar(id, avatarBase64) {
    const res = await fetch(`${API_URL}/Usuarios/${id}/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarBase64 })
    });
    if (!res.ok) throw new Error(await res.text() || "Error al actualizar avatar");
    return await res.json();
}

// ── DELETE /Usuarios/{id} ──
export async function eliminarCuenta(id) {
    const res = await fetch(`${API_URL}/Usuarios/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error(await res.text() || "Error al eliminar cuenta");
    return await res.json();
}

// ── GET /Usuarios/{id}/sesiones ──
export async function obtenerSesiones(id) {
    const res = await fetch(`${API_URL}/Usuarios/${id}/sesiones`);
    if (!res.ok) throw new Error(await res.text() || "Error al obtener sesiones");
    return await res.json();
}

// ── DELETE /Usuarios/{id}/sesiones ──
export async function eliminarSesiones(id) {
    const res = await fetch(`${API_URL}/Usuarios/${id}/sesiones`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error(await res.text() || "Error al cerrar sesiones");
    return await res.json();
}

// ── POST api/PacienteCuidador — Crear vínculo ──
export async function asignarResponsableAPI(idPaciente, idCuidador) {
    const session = getSession();
    const res = await fetch(`${API_URL}/api/PacienteCuidador`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ idPaciente, idCuidador })
    });
    if (!res.ok) throw new Error(await res.text() || 'Error al asignar responsable');
}

// ── POST /Usuarios/registro — Registrar responsable ──
export async function registrarResponsableAPI(nombre, email, password) {
    const res = await fetch(`${API_URL}/Usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, contrasena: password, rol: 'Responsable', esResponsable: true })
    });
    if (!res.ok) throw new Error(await res.text() || 'Error al registrar responsable');
}

// ── DELETE api/PacienteCuidador — Eliminar vínculo ──
export async function eliminarResponsableAPI(idPaciente, idCuidador) {
    const session = getSession();
    const res = await fetch(`${API_URL}/api/PacienteCuidador`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ idPaciente, idCuidador })
    });
    if (!res.ok) throw new Error(await res.text() || 'Error al eliminar responsable');
}
