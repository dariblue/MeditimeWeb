// ─────────────────────────────────────────────────────────────
// roles.js  –  Módulo centralizado de gestión de roles
//
// Lógica:
//   - esResponsable === true  → puede gestionar todo + pacientes a cargo
//   - esResponsable === false → vista solo lectura (tiene responsables)
// ─────────────────────────────────────────────────────────────

const API_URL = 'https://api.dariblue.dev';

// ── Clave de sessionStorage para el paciente activo ─────────
const ACTIVE_PACIENTE_KEY = 'meditime_active_paciente';

// ── helpers ──────────────────────────────────────────────────
function getSession() {
  const raw = localStorage.getItem('meditime_session');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function authHeaders() {
  const session = getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.token || ''}`
  };
}

// ── ¿El usuario actual es responsable de sí mismo? ──────────
export function isResponsable() {
  const session = getSession();
  return session?.esResponsable === true;
}

// ── ¿Puede editar? (solo responsables pueden) ───────────────
export function canEdit() {
  return isResponsable();
}

// ── Obtener pacientes a cargo del cuidador actual ───────────
export async function getPacientesACargo() {
  const session = getSession();
  if (!session) return [];

  try {
    const res = await fetch(
      `${API_URL}/api/PacienteCuidador/cuidador/${session.userId}`,
      { headers: authHeaders() }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error al obtener pacientes a cargo:', err);
    return [];
  }
}

// ── Obtener/establecer paciente activo ───────────────────────
export function getActivePacienteId() {
  const stored = sessionStorage.getItem(ACTIVE_PACIENTE_KEY);
  if (stored) return parseInt(stored, 10);

  // Por defecto, el propio usuario
  const session = getSession();
  return session?.userId || null;
}

export function setActivePaciente(id) {
  sessionStorage.setItem(ACTIVE_PACIENTE_KEY, String(id));
}

export function resetActivePaciente() {
  sessionStorage.removeItem(ACTIVE_PACIENTE_KEY);
}

// ── Comprobar si estamos viendo datos de otro paciente ───────
export function isViewingOtherPatient() {
  const session = getSession();
  const activeId = getActivePacienteId();
  return session && activeId && activeId !== session.userId;
}

// ── Info del usuario actual ─────────────────────────────────
export function getCurrentUserId() {
  const session = getSession();
  return session?.userId || null;
}

export function getCurrentUserName() {
  const session = getSession();
  return session?.nombre || 'Usuario';
}
