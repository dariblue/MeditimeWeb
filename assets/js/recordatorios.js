// ─────────────────────────────────────────────────────────────
// recordatorios.js  –  CRUD puro de medicamentos (API v2.0)
// Sin tracking / historial. Solo Añadir, Editar y Eliminar.
// + Sistema de roles: responsable vs paciente no responsable
// ─────────────────────────────────────────────────────────────

import {
  getMedicamentos,
  saveMedicamento,
  updateMedicamento,
  saveOrUpdateMedicamento,
  deleteMedicamento
} from './modules/medicamentos.js';

import {
  isResponsable, canEdit,
  getPacientesACargo, getActivePacienteId,
  setActivePaciente, resetActivePaciente,
  isViewingOtherPatient, getCurrentUserId
} from './modules/roles.js';

const API_URL = 'https://api.dariblue.dev';

document.addEventListener('DOMContentLoaded', async () => {

  // ── sesión ─────────────────────────────────────────────────
  const session = window.auth?.getCurrentUser();
  if (!session) { window.location.href = '/login'; return; }

  // ── estado ─────────────────────────────────────────────────
  let medicamentos = [];
  let editingId = null;
  let deleteId = null;
  let pacientesACargo = [];

  // ── referencias DOM ────────────────────────────────────────
  const container       = document.getElementById('recordatorios-container');
  const noRecordatorios = document.getElementById('no-recordatorios');
  const miniCalendario  = document.getElementById('mini-calendario');
  const totalMedsEl     = document.getElementById('total-medicamentos');
  const totalActivosEl  = document.getElementById('total-activos');
  const totalStockEl    = document.getElementById('total-stock-bajo');

  // ── Roles DOM ──────────────────────────────────────────────
  const readonlyBanner   = document.getElementById('readonly-banner');
  const pacienteSelector = document.getElementById('paciente-selector');
  const selectPaciente   = document.getElementById('select-paciente-rec');
  const managingBanner   = document.getElementById('managing-banner');
  const managingText     = document.getElementById('managing-banner-text');
  const managingClose    = document.getElementById('managing-banner-close');

  // ── botones abrir modal ────────────────────────────────────
  const addMedBtn   = document.getElementById('add-med-btn');
  const addFirstBtn = document.getElementById('add-first-med');

  if (addMedBtn)   addMedBtn.addEventListener('click',   () => openAddModal());
  if (addFirstBtn) addFirstBtn.addEventListener('click', () => openAddModal());

  // ── confirmación eliminar ──────────────────────────────────
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  }

  // ── prevenir submit nativo ─────────────────────────────────
  const medForm = document.getElementById('med-form');
  if (medForm) medForm.addEventListener('submit', (e) => e.preventDefault());

  // ── configurar roles ───────────────────────────────────────
  await setupRoles();

  // ── inicializar ────────────────────────────────────────────
  await loadAndRender();
  renderMiniCalendario();

  // Prompt para alertas automáticas
  setTimeout(() => {
    if (session && window.medicationNotifications?.checkAndPrompt) {
      window.medicationNotifications.checkAndPrompt(session.userId);
    }
  }, 5000);

  // ═══════════════════════════════════════════════════════════
  //                    ROLES
  // ═══════════════════════════════════════════════════════════

  async function setupRoles() {
    const esResp = isResponsable();

    if (!esResp) {
      // Paciente no responsable → modo solo lectura
      if (readonlyBanner) readonlyBanner.style.display = 'block';
      if (addMedBtn) addMedBtn.style.display = 'none';
      if (addFirstBtn) addFirstBtn.style.display = 'none';
      return;
    }

    // Es responsable → comprobar pacientes a cargo
    pacientesACargo = await getPacientesACargo();

    if (pacientesACargo.length > 0 && pacienteSelector && selectPaciente) {
      selectPaciente.innerHTML = '<option value="">Mi cuenta</option>';
      pacientesACargo.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.idUsuario || p.IDUsuario || p.id;
        opt.textContent = `${p.nombre || ''} ${p.apellidos || ''}`.trim() || p.email;
        selectPaciente.appendChild(opt);
      });

      // Restaurar selección previa
      const activeId = getActivePacienteId();
      const myId = getCurrentUserId();
      if (activeId && activeId !== myId) {
        selectPaciente.value = String(activeId);
        showManagingBanner(activeId);
      }

      pacienteSelector.style.display = 'block';

      selectPaciente.addEventListener('change', async () => {
        const val = selectPaciente.value;
        if (val) {
          setActivePaciente(parseInt(val, 10));
          showManagingBanner(parseInt(val, 10));
        } else {
          resetActivePaciente();
          hideManagingBanner();
        }
        await loadAndRender();
      });

      if (managingClose) {
        managingClose.addEventListener('click', async () => {
          resetActivePaciente();
          selectPaciente.value = '';
          hideManagingBanner();
          await loadAndRender();
        });
      }
    }
  }

  function showManagingBanner(pacienteId) {
    const paciente = pacientesACargo.find(p =>
      (p.idUsuario || p.IDUsuario || p.id) == pacienteId
    );
    if (managingBanner && managingText && paciente) {
      const nombre = `${paciente.nombre || ''} ${paciente.apellidos || ''}`.trim();
      managingText.innerHTML = `Gestionando a: <strong>${nombre}</strong>`;
      managingBanner.style.display = 'block';
    }
  }

  function hideManagingBanner() {
    if (managingBanner) managingBanner.style.display = 'none';
  }

  // ═══════════════════════════════════════════════════════════
  //                     FUNCIONES
  // ═══════════════════════════════════════════════════════════

  // ── cargar datos + renderizar ──────────────────────────────
  async function loadAndRender() {
    const pacienteId = getActivePacienteId();
    try {
      medicamentos = await getMedicamentos(pacienteId);
    } catch (err) {
      console.error('Error al cargar medicamentos:', err);
      medicamentos = [];
    }
    renderMedicamentos();
    updateEstadisticas();
  }

  // ── renderizar lista ───────────────────────────────────────
  function renderMedicamentos() {
    if (!container) return;

    // Limpiar excepto el bloque "no-recordatorios"
    container.innerHTML = '';
    if (noRecordatorios) container.appendChild(noRecordatorios);

    if (medicamentos.length === 0) {
      if (noRecordatorios) noRecordatorios.style.display = 'flex';
      // Si no puede editar, ocultar botón de añadir primer med
      if (!canEdit() && addFirstBtn) addFirstBtn.style.display = 'none';
      return;
    }

    if (noRecordatorios) noRecordatorios.style.display = 'none';

    // Ordenar: activos primero, luego por nombre
    const sorted = [...medicamentos].sort((a, b) => {
      if (a.activo !== b.activo) return b.activo ? 1 : -1;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });

    sorted.forEach(med => container.appendChild(createMedCard(med)));
  }

  // ── crear tarjeta de medicamento ───────────────────────────
  function createMedCard(med) {
    const card = document.createElement('div');
    card.className = 'recordatorio-item';
    card.setAttribute('data-id', med.idMedicamento);

    if (!med.activo) card.style.opacity = '0.55';

    const stockBajo = med.stockActual <= med.umbralAlerta;
    const frecuenciaTexto = med.frecuenciaHoras === 1
      ? 'Cada hora'
      : `Cada ${med.frecuenciaHoras}h`;

    const fechaInicioStr = med.fechaInicio
      ? new Date(med.fechaInicio).toLocaleString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

    const puedeEditar = canEdit();

    card.innerHTML = `
      <div class="recordatorio-info" style="flex:1">
        <h4>
          <i class="fas fa-pills"></i>
          ${med.nombre}
          ${!med.activo ? '<span style="color:#999; font-size:0.8em">(inactivo)</span>' : ''}
        </h4>
        <p><strong>Dosis:</strong> ${med.dosis}</p>
        <p><strong>Frecuencia:</strong> ${frecuenciaTexto}</p>
        <p><strong>Inicio:</strong> ${fechaInicioStr}</p>
        <p>
          <strong>Stock:</strong>
          <span style="color:${stockBajo ? '#dc3545' : 'inherit'}">
            ${med.stockActual} uds ${stockBajo ? '⚠️' : ''}
          </span>
        </p>
      </div>
      ${puedeEditar ? `
        <div class="recordatorio-acciones">
          <button class="btn-accion btn-editar" aria-label="Editar medicamento">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-accion btn-eliminar" aria-label="Eliminar medicamento">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      ` : ''}
    `;

    // eventos (solo si puede editar)
    if (puedeEditar) {
      card.querySelector('.btn-editar').addEventListener('click', () =>
        openEditModal(med.idMedicamento)
      );
      card.querySelector('.btn-eliminar').addEventListener('click', () =>
        openDeleteModal(med.idMedicamento)
      );
    }

    return card;
  }

  // ── estadísticas panel lateral ─────────────────────────────
  function updateEstadisticas() {
    if (totalMedsEl)    totalMedsEl.textContent    = medicamentos.length;
    if (totalActivosEl) totalActivosEl.textContent = medicamentos.filter(m => m.activo).length;
    if (totalStockEl)   totalStockEl.textContent   =
      medicamentos.filter(m => m.activo && m.stockActual <= m.umbralAlerta).length;
  }

  // ── modal: AÑADIR ──────────────────────────────────────────
  function openAddModal() {
    editingId = null;
    resetForm();

    const modal = document.getElementById('med-modal');
    if (!modal) return;

    modal.querySelector('.modal-title').textContent = 'Añadir nuevo medicamento';

    const saveBtn = modal.querySelector('.btn-success');
    saveBtn.textContent = 'Guardar Medicamento';
    saveBtn.onclick = handleSave;

    showModal('med-modal');
  }

  // ── modal: EDITAR ──────────────────────────────────────────
  function openEditModal(id) {
    const med = medicamentos.find(m => m.idMedicamento === id);
    if (!med) return;

    editingId = id;
    resetForm();

    // rellenar formulario
    document.getElementById('med-nombre').value     = med.nombre || '';
    document.getElementById('med-dosis').value      = med.dosis || '';
    document.getElementById('med-frecuencia').value = med.frecuenciaHoras || '';
    document.getElementById('med-stock').value      = med.stockActual ?? 0;
    document.getElementById('med-umbral').value     = med.umbralAlerta ?? 5;
    document.getElementById('med-activo').checked   = med.activo;

    if (med.fechaInicio) {
      document.getElementById('med-inicio').value =
        toDatetimeLocalString(med.fechaInicio);
    }
    if (med.fechaFin) {
      document.getElementById('med-fin').value =
        toDatetimeLocalString(med.fechaFin);
    }

    const modal = document.getElementById('med-modal');
    modal.querySelector('.modal-title').textContent = 'Editar medicamento';

    const saveBtn = modal.querySelector('.btn-success');
    saveBtn.textContent = 'Actualizar Medicamento';
    saveBtn.onclick = handleSave;

    showModal('med-modal');
  }

  // ── guardar (crear o editar) ───────────────────────────────
  async function handleSave() {
    const pacienteId = getActivePacienteId();

    const data = {
      nombre:          document.getElementById('med-nombre').value.trim(),
      dosis:           document.getElementById('med-dosis').value.trim(),
      fechaInicio:     document.getElementById('med-inicio').value || null,
      frecuenciaHoras: document.getElementById('med-frecuencia').value,
      fechaFin:        document.getElementById('med-fin').value || null,
      stockActual:     document.getElementById('med-stock').value,
      umbralAlerta:    document.getElementById('med-umbral').value,
      activo:          document.getElementById('med-activo').checked
    };

    if (!data.nombre || !data.dosis || !data.fechaInicio || !data.frecuenciaHoras) {
      alert('Por favor, complete los campos obligatorios.');
      return;
    }

    if (editingId) data.idMedicamento = editingId;

    try {
      await saveOrUpdateMedicamento(data);
      closeModal('med-modal');
      await loadAndRender();
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar el medicamento.');
    }
  }

  // ── modal: ELIMINAR ────────────────────────────────────────
  function openDeleteModal(id) {
    deleteId = id;
    showModal('confirm-modal');
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    try {
      await deleteMedicamento(deleteId);
      deleteId = null;
      closeModal('confirm-modal');
      await loadAndRender();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  }

  // ── reset formulario ──────────────────────────────────────
  function resetForm() {
    const form = document.getElementById('med-form');
    if (form) form.reset();

    // Defaults
    const activo = document.getElementById('med-activo');
    if (activo) activo.checked = true;

    const stock = document.getElementById('med-stock');
    if (stock) stock.value = 0;

    const umbral = document.getElementById('med-umbral');
    if (umbral) umbral.value = 5;
  }

  // ── helpers modal ──────────────────────────────────────────
  function showModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const modalInst = bootstrap.Modal.getOrCreateInstance(el);
    modalInst.show();
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const modalInst = bootstrap.Modal.getInstance(el);
    if (modalInst) modalInst.hide();
  }

  // ── helper: ISO → datetime-local ──────────────────────────
  function toDatetimeLocalString(iso) {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ── mini calendario ────────────────────────────────────────
  function renderMiniCalendario() {
    if (!miniCalendario) return;
    miniCalendario.innerHTML = '';

    const now = new Date();
    const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    dias.forEach(d => {
      const h = document.createElement('div');
      h.className = 'calendar-header';
      h.textContent = d;
      miniCalendario.appendChild(h);
    });

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (let i = 0; i < firstDay.getDay(); i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day otro-mes';
      empty.textContent = '-';
      miniCalendario.appendChild(empty);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = document.createElement('div');
      day.className = 'calendar-day';
      day.textContent = i;

      if (
        i === now.getDate() &&
        now.getMonth() === firstDay.getMonth() &&
        now.getFullYear() === firstDay.getFullYear()
      ) {
        day.classList.add('today');
      }
      miniCalendario.appendChild(day);
    }
  }
});
