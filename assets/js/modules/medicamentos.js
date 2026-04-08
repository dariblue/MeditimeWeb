// ─────────────────────────────────────────────────────────────
// medicamentos.js  –  Capa de datos para API v2.0
// Modelo: idMedicamento, idUsuarioPaciente, nombre, dosis,
//         fechaInicio, frecuenciaHoras, fechaFin,
//         stockActual, umbralAlerta, activo
// ─────────────────────────────────────────────────────────────

const API_URL = 'https://api.dariblue.dev';

// ── helpers ──────────────────────────────────────────────────
function getSession() {
  const session = window.auth?.getCurrentUser();
  if (!session) throw new Error('No hay sesión activa');
  return session;
}

function authHeaders(session) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.token}`
  };
}

// ── GET medicamentos del paciente ────────────────────────────
export async function getMedicamentos() {
  const session = getSession();

  const response = await fetch(
    `${API_URL}/api/Medicamentos/paciente/${session.userId}`,
    { headers: authHeaders(session) }
  );

  if (!response.ok) {
    throw new Error('Error al obtener los medicamentos');
  }

  return response.json();
}

// ── POST crear medicamento ───────────────────────────────────
export async function saveMedicamento(medicamento) {
  const session = getSession();

  const body = {
    idUsuarioPaciente: session.userId,
    nombre:           medicamento.nombre,
    dosis:            medicamento.dosis,
    fechaInicio:      medicamento.fechaInicio,
    frecuenciaHoras:  Number(medicamento.frecuenciaHoras),
    fechaFin:         medicamento.fechaFin || null,
    stockActual:      Number(medicamento.stockActual) || 0,
    umbralAlerta:     Number(medicamento.umbralAlerta) || 0,
    activo:           medicamento.activo !== undefined ? medicamento.activo : true
  };

  const response = await fetch(`${API_URL}/api/Medicamentos`, {
    method: 'POST',
    headers: authHeaders(session),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || 'Error al guardar el medicamento');
  }

  return response.json();
}

// ── PUT actualizar medicamento ───────────────────────────────
export async function updateMedicamento(medicamento) {
  const session = getSession();

  const body = {
    idUsuarioPaciente: session.userId,
    nombre:           medicamento.nombre,
    dosis:            medicamento.dosis,
    fechaInicio:      medicamento.fechaInicio,
    frecuenciaHoras:  Number(medicamento.frecuenciaHoras),
    fechaFin:         medicamento.fechaFin || null,
    stockActual:      Number(medicamento.stockActual) || 0,
    umbralAlerta:     Number(medicamento.umbralAlerta) || 0,
    activo:           medicamento.activo !== undefined ? medicamento.activo : true
  };

  const response = await fetch(
    `${API_URL}/api/Medicamentos/${medicamento.idMedicamento}`,
    {
      method: 'PUT',
      headers: authHeaders(session),
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || 'Error al actualizar el medicamento');
  }

  return response.json();
}

// ── saveOrUpdate (decide según si tiene id) ──────────────────
export async function saveOrUpdateMedicamento(medicamento) {
  if (medicamento.idMedicamento) {
    return updateMedicamento(medicamento);
  }
  return saveMedicamento(medicamento);
}

// ── DELETE medicamento ───────────────────────────────────────
export async function deleteMedicamento(id) {
  const session = getSession();

  const response = await fetch(`${API_URL}/api/Medicamentos/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.token}` }
  });

  if (!response.ok) {
    throw new Error('Error al eliminar el medicamento');
  }

  return true;
}

// ── GET historial de tomas del paciente ──────────────────────
export async function getHistorialTomas() {
  const session = getSession();

  const response = await fetch(
    `${API_URL}/api/HistorialTomas/paciente/${session.userId}`,
    { headers: authHeaders(session) }
  );

  if (!response.ok) {
    throw new Error('Error al obtener el historial de tomas');
  }

  return response.json();
}

// ── POST registrar una toma ──────────────────────────────────
export async function registrarToma({ idMedicamento, fechaHoraToma, estado }) {
  const session = getSession();

  const body = {
    idMedicamento,
    idUsuarioAccion: session.userId,
    fechaHoraToma,
    estado              // "Tomado" o "Pasado"
  };

  const response = await fetch(`${API_URL}/api/HistorialTomas`, {
    method: 'POST',
    headers: authHeaders(session),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || 'Error al registrar la toma');
  }

  return response.json();
}
