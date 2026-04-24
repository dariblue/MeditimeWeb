export function changeTab(tab) {
    const perfilMenuItems = document.querySelectorAll(".perfil-menu-item");
    const perfilTabs = document.querySelectorAll(".perfil-tab");
    
    perfilMenuItems.forEach(item => item.classList.toggle("active", item.getAttribute("data-tab") === tab));
    perfilTabs.forEach(tabElement => tabElement.classList.toggle("active", tabElement.id === `${tab}-tab`));
}

export function closeModals() {
    const confirmDeleteModal = document.getElementById("confirm-delete-modal");
    const sessionsModal = document.getElementById("sessions-modal");
    confirmDeleteModal?.classList.remove("active");
    sessionsModal?.classList.remove("active");
}

export function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => element.style.display = "none", 3000);
}

export function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = "none";
}

export function mostrarMensajeGlobal(mensaje, tipo = "error") {
    // Eliminar mensajes previos si existen
    const previos = document.querySelectorAll('.mensaje-global');
    previos.forEach(p => p.remove());

    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje-global ${tipo}`;
    
    // Añadir icono según el tipo
    const icono = tipo === "success" ? "fa-check-circle" : "fa-exclamation-circle";
    mensajeDiv.innerHTML = `<i class="fas ${icono}"></i><span>${mensaje}</span>`;
    
    document.body.appendChild(mensajeDiv);

    // Forzar reflow para que la transición funcione
    mensajeDiv.offsetHeight;

    // Mostrar
    mensajeDiv.classList.add('visible');

    // Quitar después de 4 segundos
    setTimeout(() => {
        mensajeDiv.classList.remove('visible');
        setTimeout(() => {
            mensajeDiv.remove();
        }, 500); // Esperar a que termine la transición de salida
    }, 4000);
}

export function fillUserForms(userData) {
    const datosPersonalesForm = document.getElementById("datos-personales-form");
    if (!datosPersonalesForm) return;
    document.getElementById("nombre").value = userData.nombre || "";
    document.getElementById("apellidos").value = userData.apellidos || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("telefono").value = userData.telefono || "";
    if (userData.fecha_Nacimiento) {
        const fecha = new Date(userData.fecha_Nacimiento);
        document.getElementById("fecha_nacimiento").value = fecha.toISOString().split("T")[0];
    }
    document.getElementById("domicilio").value = userData.domicilio || "";
}

export function actualizarStatusCard(userData) {
    const card = document.getElementById('userStatusCard');
    if (!card) return;

    if (userData.rol === 'no_responsable') {
        card.innerHTML = `
        <div class="status-title">ESTADO DE TU CUENTA</div>
        <div class="status-value">
          Necesitas responsables que supervisen tu medicación
          <span class="status-badge no-responsable">No responsable</span>
        </div>
        <p>Las personas que asignes como responsables podrán gestionar tu medicación y recibir notificaciones de tus tomas.</p>
      `;
        const header = document.querySelector('.responsables-list-header');
        if (header) header.style.display = 'flex';
    } else {
        card.innerHTML = `
        <div class="status-title">ESTADO DE TU CUENTA</div>
        <div class="status-value">
          Eres responsable de ti mismo
          <span class="status-badge responsable">Responsable</span>
        </div>
        <p>Como eres responsable de ti mismo, no necesitas que otras personas supervisen tu medicación.</p>
      `;
        const header = document.querySelector('.responsables-list-header');
        if (header) header.style.display = 'none';
    }
}

export function cargarResponsables(userData, responsablesAsignados, eliminarResponsableHandler) {
    const container = document.getElementById('responsables-container');
    if (!container) return;

    if (userData.rol !== 'no_responsable') {
        container.innerHTML = `
        <div class="empty-responsables">
          <i class="fas fa-check-circle"></i>
          <h3>No necesitas responsables</h3>
          <p>Eres responsable de ti mismo, por lo que no requieres supervisión de otras personas.</p>
        </div>
      `;
        return;
    }

    if (!responsablesAsignados.length) {
        container.innerHTML = `
        <div class="empty-responsables">
          <i class="fas fa-user-shield"></i>
          <h3>Aún no tienes responsables asignados</h3>
          <p>Haz clic en "Añadir responsable" para que alguien pueda supervisar tu medicación.</p>
        </div>
      `;
        return;
    }

    mostrarResponsables(responsablesAsignados, eliminarResponsableHandler);
}

export function mostrarResponsables(responsablesAsignados, eliminarResponsableHandler) {
    const container = document.getElementById('responsables-container');
    if (!container) return;

    if (!responsablesAsignados.length) {
        container.innerHTML = `
        <div class="empty-responsables">
          <i class="fas fa-user-shield"></i>
          <h3>No tienes responsables asignados</h3>
          <p>Añade personas que puedan gestionar tu medicación</p>
        </div>
      `;
        return;
    }

    container.innerHTML = responsablesAsignados.map(responsable => `
      <div class="responsable-card" card-id="${responsable.id}">
        <div class="responsable-info">
          <h4><i class="fas fa-user-circle"></i> ${responsable.nombre}</h4>
          <p><i class="fas fa-envelope"></i> ${responsable.email}</p>
        </div>
        <div class="responsable-actions">
          <button data-id="${responsable.id}" class="btn-icon-danger btn-eliminar-responsable" title="Eliminar responsable" type="button">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-eliminar-responsable').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            eliminarResponsableHandler(id);
        });
    });
}

export function mostrarResponsableExistente(usuario, asignarResponsableHandler) {
    const resultadoDiv = document.getElementById('resultadoBusquedaResponsable');
    if (!resultadoDiv) return;

    const rol = (usuario.rol || "").trim().toLowerCase();

    if (rol !== "responsable") {
        resultadoDiv.innerHTML = `
        <p class="error-message">
          El usuario encontrado no tiene el rol de responsable.
          Solo puedes asignar usuarios con rol de responsable.
        </p>
      `;
        return;
    }

    resultadoDiv.innerHTML = `
      <div class="tutor-info">
        <p><strong>Responsable encontrado:</strong> ${usuario.nombre}</p>
        <p>Email: ${usuario.email}</p>
        <button id="btn-asignar-existente" class="btn-success">
          Asignar como responsable
        </button>
      </div>
    `;

    document.getElementById('btn-asignar-existente').addEventListener('click', () => {
        asignarResponsableHandler(usuario.id, usuario.nombre, usuario.email);
    });
}

export function mostrarFormularioRegistroResponsable(email, registrarYAsignarHandler, cancelarHandler) {
    const resultadoDiv = document.getElementById('resultadoBusquedaResponsable');
    if (!resultadoDiv) return;

    resultadoDiv.innerHTML = `
      <div class="tutor-registro-form">
        <h4>Registrar nuevo responsable</h4>
        <div class="form-group">
          <label>Nombre completo</label>
          <input type="text" id="nuevoResponsableNombre" placeholder="Nombre" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:5px;">
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="nuevoResponsablePassword" placeholder="Mínimo 6 caracteres" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:5px;">
        </div>
        <div class="button-group" style="display:flex; gap:10px; margin-top:15px;">
          <button id="btn-registrar-asignar" class="btn-success" style="flex:1; padding:10px;">Registrar y asignar</button>
          <button id="btn-cancelar-registro" class="btn btn-secondary" style="flex:1; padding:10px;">Cancelar</button>
        </div>
      </div>
    `;

    document.getElementById('btn-registrar-asignar').addEventListener('click', (e) => {
        registrarYAsignarHandler(email, e);
    });
    
    document.getElementById('btn-cancelar-registro').addEventListener('click', cancelarHandler);
}

export function cancelarBusqueda() {
    const res = document.getElementById('resultadoBusquedaResponsable');
    if(res) res.innerHTML = '';
}

export function cerrarModalResponsable() {
    const modal = document.getElementById('modalAgregarResponsable');
    if(modal) modal.style.display = 'none';
}
