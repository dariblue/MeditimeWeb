// ─────────────────────────────────────────────────────────────
// inicio.js  –  Dashboard inteligente "Tomas de Hoy" (API v2.0)
//
// Motor de cálculo:
//   1. Fetch medicamentos activos + historial del paciente
//   2. Generar "tomas teóricas" de hoy (fechaInicio + frecuenciaHoras)
//   3. Match con historial (±60 min tolerancia)
//   4. Renderizar tarjetas + resumen + barra progreso
//   5. Acción "Confirmar" → POST /api/HistorialTomas
// ─────────────────────────────────────────────────────────────

import { getMedicamentos, getHistorialTomas, registrarToma } from './modules/medicamentos.js';
import { formatTime, isSameDay } from './modules/utils.js';

// ── constantes ──────────────────────────────────────────────
const TOLERANCIA_MS = 5 * 60 * 1000;   // ±5 minutos (umbral de toma)

// ── estado global ───────────────────────────────────────────
let medicamentos = [];
let historial    = [];
let tomasHoy     = [];     // { medicamento, horaTeórica: Date, estado, historialMatch }

// ── referencias DOM ─────────────────────────────────────────
const tomashoyContainer  = document.getElementById('tomas-hoy-container');
const noTomasDiv         = document.getElementById('no-tomas');
const barraProgreso      = document.getElementById('barra-progreso');
const textoProgreso      = document.getElementById('texto-progreso');
const pendientesEl       = document.getElementById('tomas-pendientes');
const atrasadasEl        = document.getElementById('tomas-atrasadas');
const completadasEl      = document.getElementById('tomas-completadas');

// ═══════════════════════════════════════════════════════════
//  1. MOTOR DE CÁLCULO DE TOMAS TEÓRICAS
// ═══════════════════════════════════════════════════════════

/**
 * Para un medicamento, genera todas las horas de toma
 * que caen en el día de hoy.
 *
 * @param {Object} med  – Medicamento de la API
 * @returns {Date[]}    – Array de Date con las horas teóricas de hoy
 */
function calcularTomasDelDia(med) {
  const hoy    = new Date();
  const inicio = new Date(med.fechaInicio);
  const fin    = med.fechaFin ? new Date(med.fechaFin) : null;
  const freqMs = med.frecuenciaHoras * 3600000;

  if (isNaN(inicio.getTime()) || freqMs <= 0) return [];

  // Si la fecha fin ya pasó (y no es hoy), este med no genera tomas hoy
  if (fin && !isSameDay(fin, hoy) && fin < hoy) return [];

  // ── Calcular el rango de "hoy" ────────────────────────────
  const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
  const finDelDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

  const result = [];

  // Si la primera toma es posterior al día de hoy, no hay tomas
  if (inicio > finDelDia) return [];

  // ── Caso 1: la primera toma es hoy o antes ────────────────
  // Debemos calcular cuántas frecuencias hay entre inicio e inicioDelDia,
  // y luego iterar desde ahí.

  let primeraTomaDeCuadre;

  if (inicio >= inicioDelDia) {
    // La fecha de inicio cae hoy
    primeraTomaDeCuadre = inicio;
  } else {
    // Calcular la primera toma del día de hoy
    const diffMs = inicioDelDia.getTime() - inicio.getTime();
    const intervalosCompletos = Math.ceil(diffMs / freqMs);
    primeraTomaDeCuadre = new Date(inicio.getTime() + intervalosCompletos * freqMs);
  }

  // Iterar generando tomas mientras caigan en hoy
  let cursor = primeraTomaDeCuadre;

  while (cursor <= finDelDia) {
    // Si hay fecha fin, no generar tomas posteriores
    if (fin && cursor > fin) break;

    result.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + freqMs);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
//  2. MATCH CON HISTORIAL
// ═══════════════════════════════════════════════════════════

/**
 * Clasifica cada toma teórica comparándola con el historial.
 * Tolerancia: ±60 min.
 *
 * @returns void – Modifica `tomasHoy` in place.
 */
function clasificarTomas() {
  const ahora = new Date();
  const HORA_Y_MEDIA_MS = 1.5 * 60 * 60 * 1000;
  
  // Set para llevar control de los registros de historial ya vinculados a una toma
  const matchedHistorialIds = new Set();

  tomasHoy.forEach(toma => {
    // Buscar en historial un registro que coincida.
    // Usamos una tolerancia basada en la mitad de su frecuencia, para enlazar el registro más cercano
    // aunque lo haya tomado con retraso (ej. si es cada 8h -> ±4h de tolerancia de match).
    const toleranciaMatch = (toma.medicamento.frecuenciaHoras * 60 * 60 * 1000) / 2;

    const posiblesMatches = historial.filter(h => {
      // El ID del historial puede venir como idToma o iDToma dependiendo del serializador C#, 
      // así que verificamos que no hayamos usado el mismo objeto
      if (h.idMedicamento !== toma.medicamento.idMedicamento) return false;
      if (h.estado !== 'Tomado' && h.estado !== 'Pasado') return false;
      if (matchedHistorialIds.has(h)) return false; 

      const fechaRegistro = new Date(h.fechaHoraToma);
      const diff = Math.abs(fechaRegistro.getTime() - toma.horaTeórica.getTime());
      return diff <= toleranciaMatch;
    });

    if (posiblesMatches.length > 0) {
      // Tomamos el registro que tenga la hora más cercana a esta toma teórica
      posiblesMatches.sort((a, b) => {
        const diffA = Math.abs(new Date(a.fechaHoraToma).getTime() - toma.horaTeórica.getTime());
        const diffB = Math.abs(new Date(b.fechaHoraToma).getTime() - toma.horaTeórica.getTime());
        return diffA - diffB;
      });
      const match = posiblesMatches[0];
      matchedHistorialIds.add(match); // Marcamos el registro como usado
      
      toma.estado = 'completada';
      toma.historialMatch = match;
    } else if (ahora.getTime() > toma.horaTeórica.getTime() + HORA_Y_MEDIA_MS) {
      // Pasó más de una hora y media
      toma.estado = 'pasada';
    } else if (ahora.getTime() > toma.horaTeórica.getTime() + TOLERANCIA_MS) {
      // Ya pasó la hora + los 5 minutos de gracia
      toma.estado = 'atrasada';
    } else if (ahora.getTime() >= toma.horaTeórica.getTime() - TOLERANCIA_MS) {
      // Dentro de los 5 minutos previos o los 5 minutos posteriores
      toma.estado = 'disponible';
    } else {
      // Aún no llega la hora
      toma.estado = 'pendiente';
    }
  });
}

// ═══════════════════════════════════════════════════════════
//  3. FETCH + CÁLCULO COMPLETO
// ═══════════════════════════════════════════════════════════

async function cargarDashboard() {
  try {
    // Fetch paralelo
    const [meds, hist] = await Promise.all([
      getMedicamentos(),
      getHistorialTomas()
    ]);

    medicamentos = (meds || []).filter(m => m.activo);
    historial    = hist || [];

  } catch (err) {
    console.error('Error al cargar datos del dashboard:', err);
    medicamentos = [];
    historial    = [];
  }

  // Generar tomas teóricas
  tomasHoy = [];
  medicamentos.forEach(med => {
    const horas = calcularTomasDelDia(med);
    horas.forEach(hora => {
      tomasHoy.push({
        medicamento:    med,
        horaTeórica:    hora,
        estado:         'pendiente',   // se reclasifica abajo
        historialMatch: null
      });
    });
  });

  // Clasificar estados
  clasificarTomas();

  // Ordenar por hora
  tomasHoy.sort((a, b) => a.horaTeórica - b.horaTeórica);

  // Renderizar
  render();
}

// ═══════════════════════════════════════════════════════════
//  4. RENDERIZADO
// ═══════════════════════════════════════════════════════════

function render() {
  renderTarjetas();
  renderResumen();
  renderProgreso();
}

function renderTarjetas() {
  if (!tomashoyContainer) return;

  tomashoyContainer.innerHTML = '';

  if (tomasHoy.length === 0) {
    if (noTomasDiv) {
      noTomasDiv.style.display = 'flex';
      tomashoyContainer.appendChild(noTomasDiv);
    }
    return;
  }

  if (noTomasDiv) noTomasDiv.style.display = 'none';

  tomasHoy.forEach((toma, index) => {
    const card = document.createElement('div');
    card.className = `toma-card toma-${toma.estado}`;

    const horaStr = formatTime(toma.horaTeórica);
    let tiempoStr = calcTiempoRelativo(toma.horaTeórica);
    if (toma.estado === 'pasada') tiempoStr = 'Esperar siguiente dosis';

    let btnText = 'Confirmar';
    if (toma.estado === 'completada') btnText = '✓ Tomado';
    if (toma.estado === 'pasada') btnText = 'Pasada';

    const btnDisabled = (toma.estado === 'completada' || toma.estado === 'pendiente' || toma.estado === 'pasada');

    card.innerHTML = `
      <div class="toma-info">
        <div class="toma-hora">${horaStr}</div>
        <div class="toma-medicamento">
          ${toma.medicamento.nombre} · ${toma.medicamento.dosis}
        </div>
        <div class="tiempo-restante">${tiempoStr}</div>
      </div>
      <button class="confirmar-btn"
              ${btnDisabled ? 'disabled' : ''}
              data-index="${index}">
        ${btnText}
      </button>
    `;

    // Solo habilitar el botón si es "atrasada" (ya pasó la hora && no tomada)
    // O si la hora ya ha pasado (tolerancia). Permitimos confirmar tomas atrasadas no pasadas de hora y media.
    const btn = card.querySelector('.confirmar-btn');

    // Habilitar si la hora ya llegó (o estamos en los 5 min previos) y no está completada/pasada
    if (toma.estado === 'disponible' || toma.estado === 'atrasada') {
      btn.disabled = false;
      btn.addEventListener('click', async () => {
        // Ejecución optimista: aplicar animación y cambiar estado visual
        card.classList.remove('toma-disponible', 'toma-atrasada', 'toma-pendiente');
        card.classList.add('toma-completada', 'animating-success');
        btn.disabled = true;
        btn.innerHTML = '✓ Tomado';
        
        await confirmarToma(index);
      });
    }

    tomashoyContainer.appendChild(card);
  });
}

function renderResumen() {
  const pendientes  = tomasHoy.filter(t => t.estado === 'pendiente').length;
  const atrasadas   = tomasHoy.filter(t => t.estado === 'atrasada' || t.estado === 'pasada').length;
  const completadas = tomasHoy.filter(t => t.estado === 'completada').length;

  if (pendientesEl)  pendientesEl.textContent  = pendientes;
  if (atrasadasEl)   atrasadasEl.textContent   = atrasadas;
  if (completadasEl) completadasEl.textContent = completadas;
}

function renderProgreso() {
  const total = tomasHoy.length;
  const hechas = tomasHoy.filter(t => t.estado === 'completada').length;
  const porcentaje = total > 0 ? Math.round((hechas / total) * 100) : 0;

  if (barraProgreso)  barraProgreso.style.width = `${porcentaje}%`;
  if (textoProgreso)  textoProgreso.textContent = `${hechas} / ${total} tomas realizadas`;
}

// ═══════════════════════════════════════════════════════════
//  5. ACCIÓN: CONFIRMAR TOMA
// ═══════════════════════════════════════════════════════════

async function confirmarToma(index) {
  const toma = tomasHoy[index];
  if (!toma || toma.estado === 'completada') return;

  const ahora = new Date();

  // Determinar estado: "Tomado" si dentro de tolerancia, "Pasado" si fuera
  const diffMs = ahora.getTime() - toma.horaTeórica.getTime();
  const estado = diffMs > TOLERANCIA_MS ? 'Pasado' : 'Tomado';

  try {
    await registrarToma({
      idMedicamento: toma.medicamento.idMedicamento,
      fechaHoraToma: ahora.toISOString(),
      estado
    });

    // Re-cargar todo el dashboard
    await cargarDashboard();
  } catch (err) {
    console.error('Error al confirmar toma:', err);
    alert('Error al registrar la toma. Inténtelo de nuevo.');
  }
}

// ═══════════════════════════════════════════════════════════
//  UTILIDADES
// ═══════════════════════════════════════════════════════════

function calcTiempoRelativo(fecha) {
  const ahora = new Date();
  const diffMin = Math.floor((ahora - fecha) / 60000);

  if (diffMin < 0) {
    const mins = Math.abs(diffMin);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `En ${h}h ${m}min` : `En ${h}h`;
    }
    return `En ${mins} min`;
  }

  if (diffMin === 0) return 'Ahora';

  if (diffMin <= 60) return `Hace ${diffMin} min`;

  const h = Math.floor(diffMin / 60);
  return `Retraso ${h}h ${diffMin % 60}min`;
}

// ═══════════════════════════════════════════════════════════
//  ARRANQUE
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  cargarDashboard();

  // Refrescar cada 60 segundos
  setInterval(cargarDashboard, 60000);
});