document.addEventListener('DOMContentLoaded', function () {
  const STORAGE_KEY = 'meditime_cuidadores';
  const DEFAULT_CUIDADORES = [
    {
      id: '1',
      nombre: 'María García López',
      relacion: 'Hija',
      email: 'maria.garcia@email.com',
      telefono: '+34 600 111 222',
      permisos: { ver: true, confirmar: true, notificaciones: true, editar: false }
    },
    {
      id: '2',
      nombre: 'Carlos Rodríguez',
      relacion: 'Enfermero',
      email: 'carlos.rodriguez@email.com',
      telefono: '+34 600 333 444',
      permisos: { ver: true, confirmar: true, notificaciones: true, editar: true }
    }
  ];

  const container = document.getElementById('cuidadores-container');
  const addBtn = document.getElementById('btnAgregarCuidador');
  const modal = document.getElementById('modalCuidador');
  const form = document.getElementById('cuidador-form');
  const closeBtn = document.getElementById('cerrarModalCuidador');
  const cancelBtn = document.getElementById('cancelarCuidador');
  const title = document.getElementById('cuidadoresModalTitle');
  const errorBox = document.getElementById('cuidadores-form-error');
  const hiddenId = document.getElementById('cuidadorId');

  if (!container || !addBtn || !modal || !form) return;

  function readCuidadores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CUIDADORES));
        return [...DEFAULT_CUIDADORES];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_CUIDADORES];
    } catch (e) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CUIDADORES));
      return [...DEFAULT_CUIDADORES];
    }
  }

  function saveCuidadores(cuidadores) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cuidadores));
  }

  function getInitials(name) {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('') || 'C';
  }

  function permissionChip(label) {
    return `<span class="cuidador-permiso-chip">${label}</span>`;
  }

  function renderCuidadores() {
    const cuidadores = readCuidadores();
    if (!cuidadores.length) {
      container.innerHTML = '<div class="loading">No hay cuidadores registrados</div>';
      return;
    }

    container.innerHTML = cuidadores.map(c => `
      <article class="cuidador-card">
        <div class="cuidador-card-top">
          <div class="cuidador-identidad">
            <div class="cuidador-avatar">${getInitials(c.nombre)}</div>
            <div class="cuidador-meta">
              <h5>${c.nombre} ${c.relacion ? `<span class="badge-relacion">${c.relacion}</span>` : ''}</h5>
              <p><i class="fas fa-envelope"></i> ${c.email}</p>
              ${c.telefono ? `<p><i class="fas fa-phone"></i> ${c.telefono}</p>` : ''}
            </div>
          </div>
          <div class="cuidador-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-edit-cuidador="${c.id}">Editar</button>
            <button class="btn-icon btn-delete" type="button" data-delete-cuidador="${c.id}" aria-label="Eliminar cuidador"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="cuidador-permisos-lista">
          ${c.permisos.ver ? permissionChip('Ver') : ''}
          ${c.permisos.confirmar ? permissionChip('Confirmar') : ''}
          ${c.permisos.notificaciones ? permissionChip('Notificaciones') : ''}
          ${c.permisos.editar ? permissionChip('Editar') : ''}
        </div>
      </article>
    `).join('');
  }

  function resetFormDefaults() {
    form.reset();
    hiddenId.value = '';
    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.textContent = '';
    }
    const permVer = document.getElementById('permisoVer');
    const permConfirmar = document.getElementById('permisoConfirmar');
    const permNotif = document.getElementById('permisoNotificaciones');
    const permEditar = document.getElementById('permisoEditar');
    if (permVer) permVer.checked = true;
    if (permConfirmar) permConfirmar.checked = true;
    if (permNotif) permNotif.checked = true;
    if (permEditar) permEditar.checked = false;
  }

  function openModal(cuidador) {
    resetFormDefaults();
    if (cuidador) {
      title.textContent = 'Editar cuidador';
      hiddenId.value = cuidador.id;
      document.getElementById('cuidadorNombre').value = cuidador.nombre || '';
      document.getElementById('cuidadorRelacion').value = cuidador.relacion || '';
      document.getElementById('cuidadorEmail').value = cuidador.email || '';
      document.getElementById('cuidadorTelefono').value = cuidador.telefono || '';
      document.getElementById('permisoVer').checked = !!cuidador.permisos?.ver;
      document.getElementById('permisoConfirmar').checked = !!cuidador.permisos?.confirmar;
      document.getElementById('permisoNotificaciones').checked = !!cuidador.permisos?.notificaciones;
      document.getElementById('permisoEditar').checked = !!cuidador.permisos?.editar;
    } else {
      title.textContent = 'Registrar nuevo cuidador';
    }
    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  addBtn.addEventListener('click', function () {
    openModal(null);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (event) {
    if (event.target === modal) closeModal();
  });

  container.addEventListener('click', function (event) {
    const editBtn = event.target.closest('[data-edit-cuidador]');
    const deleteBtn = event.target.closest('[data-delete-cuidador]');
    if (editBtn) {
      const cuidador = readCuidadores().find(item => item.id === editBtn.dataset.editCuidador);
      if (cuidador) openModal(cuidador);
    }
    if (deleteBtn) {
      const updated = readCuidadores().filter(item => item.id !== deleteBtn.dataset.deleteCuidador);
      saveCuidadores(updated);
      renderCuidadores();
    }
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const nombre = document.getElementById('cuidadorNombre').value.trim();
    const relacion = document.getElementById('cuidadorRelacion').value.trim();
    const email = document.getElementById('cuidadorEmail').value.trim();
    const telefono = document.getElementById('cuidadorTelefono').value.trim();

    if (!nombre || !relacion || !email) {
      if (errorBox) {
        errorBox.textContent = 'Completa los campos obligatorios.';
        errorBox.style.display = 'block';
      }
      return;
    }

    const payload = {
      id: hiddenId.value || String(Date.now()),
      nombre,
      relacion,
      email,
      telefono,
      permisos: {
        ver: document.getElementById('permisoVer').checked,
        confirmar: document.getElementById('permisoConfirmar').checked,
        notificaciones: document.getElementById('permisoNotificaciones').checked,
        editar: document.getElementById('permisoEditar').checked
      }
    };

    const cuidadores = readCuidadores();
    const index = cuidadores.findIndex(item => item.id === payload.id);
    if (index >= 0) {
      cuidadores[index] = payload;
    } else {
      cuidadores.push(payload);
    }

    saveCuidadores(cuidadores);
    renderCuidadores();
    closeModal();
  });

  renderCuidadores();
});
