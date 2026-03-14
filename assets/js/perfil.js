// API URL
const API_URL = "https://api.dariblue.dev"

document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const perfilMenuItems = document.querySelectorAll(".perfil-menu-item")
  const perfilTabs = document.querySelectorAll(".perfil-tab")
  const datosPersonalesForm = document.getElementById("datos-personales-form")
  const cambiarPasswordForm = document.getElementById("cambiar-password-form")
  const notificacionesForm = document.getElementById("notificaciones-form")
  const preferenciasForm = document.getElementById("preferencias-form")
  const changeAvatarBtn = document.getElementById("change-avatar-btn")
  const avatarUpload = document.getElementById("avatar-upload")
  const avatarPreview = document.getElementById("avatar-preview")
  const togglePasswordBtns = document.querySelectorAll(".toggle-password")
  const passwordNuevo = document.getElementById("password-nuevo")
  const strengthBar = document.querySelector(".strength-bar")
  const strengthText = document.querySelector(".strength-text")
  const deleteAccountBtn = document.getElementById("delete-account-btn")
  const confirmDeleteModal = document.getElementById("confirm-delete-modal")
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn")
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn")
  const closeModalBtns = document.querySelectorAll(".close-modal")
  const viewSessionsBtn = document.getElementById("view-sessions-btn")
  const sessionsModal = document.getElementById("sessions-modal")
  const closeSessionsModalBtn = document.getElementById("close-sessions-modal-btn")
  const closeAllSessionsBtn = document.getElementById("close-all-sessions-btn")
  const exportDataBtn = document.getElementById("export-data-btn")

  // Estado de la aplicación
  let currentTab = "datos-personales"
  let userData = {}
  let tutoresAsignados = [] // Responsables del usuario

  // Inicialización
  init()

  function init() {
    loadUserData()
    setupEvents()
    setupNotificationPermission()
    // NOTA: initResponsablesSeccion() se llama DESPUÉS de loadUserData
  }

  function setupEvents() {
    // Cambio de pestañas
    perfilMenuItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tab = item.getAttribute("data-tab")
        if (tab) changeTab(tab)
      })
    })

    // Formularios
    if (datosPersonalesForm) datosPersonalesForm.addEventListener("submit", handleDatosPersonalesSubmit)
    if (cambiarPasswordForm) cambiarPasswordForm.addEventListener("submit", handleCambiarPasswordSubmit)
    if (notificacionesForm) notificacionesForm.addEventListener("submit", handleNotificacionesSubmit)
    if (preferenciasForm) preferenciasForm.addEventListener("submit", handlePreferenciasSubmit)

    // Avatar
    if (changeAvatarBtn && avatarUpload) {
      changeAvatarBtn.addEventListener("click", () => avatarUpload.click())
      avatarUpload.addEventListener("change", handleAvatarChange)
    }

    // Contraseña
    togglePasswordBtns.forEach(btn => btn.addEventListener("click", togglePasswordVisibility))
    if (passwordNuevo) passwordNuevo.addEventListener("input", updatePasswordStrength)

    // Eliminar cuenta
    if (deleteAccountBtn) deleteAccountBtn.addEventListener("click", () => confirmDeleteModal.classList.add("active"))
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeModals)
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", handleDeleteAccount)

    // Modales
    closeModalBtns.forEach(btn => btn.addEventListener("click", closeModals))
    window.addEventListener("click", (event) => {
      if (event.target === confirmDeleteModal || event.target === sessionsModal) closeModals()
    })

    // Sesiones
    if (viewSessionsBtn) viewSessionsBtn.addEventListener("click", () => sessionsModal.classList.add("active"))
    if (closeSessionsModalBtn) closeSessionsModalBtn.addEventListener("click", closeModals)
    if (closeAllSessionsBtn) closeAllSessionsBtn.addEventListener("click", handleCloseAllSessions)
    if (exportDataBtn) exportDataBtn.addEventListener("click", handleExportData)
  }

  function changeTab(tab) {
    currentTab = tab
    perfilMenuItems.forEach(item => item.classList.toggle("active", item.getAttribute("data-tab") === tab))
    perfilTabs.forEach(tabElement => tabElement.classList.toggle("active", tabElement.id === `${tab}-tab`))
  }

  async function loadUserData() {
    try {
      //  SIMULACIÓN 
      userData = {
        iD_Usuario: 1,
        nombre: "Alberto",
        apellidos: "Gutiérrez",
        email: "alberto@email.com",
        rol: "no_responsable", // Cambiar a "responsable" para probar la otra vista
        telefono: "123456789",
        fecha_Nacimiento: "1980-05-15",
        domicilio: "Calle del pez 55",
        notificaciones: true
      }

      fillUserForms()
      initResponsablesSeccion()

      /*  CÓDIGO REAL  
      // Obtener sesión
      const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
      if (!session) {
        window.location.href = "login.html"
        return
      }

      const response = await fetch(`${API_URL}/Usuarios/${session.userId}`, {
        headers: {
          "Authorization": `Bearer ${session.token}`
        }
      })

      if (!response.ok) {
        throw new Error("Error al cargar datos del usuario")
      }

      userData = await response.json()
      
      // Asegurar que userData.rol existe
      if (!userData.rol) {
        userData.rol = localStorage.getItem('user_role') || 'responsable'
      }

      fillUserForms()
      initResponsablesSeccion()
      */
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
      loadSampleUserData()
    }
  }

  function loadSampleUserData() {
    // Datos de ejemplo para desarrollo (fallback)
    userData = {
      iD_Usuario: 1,
      nombre: "Alberto",
      apellidos: "Gutiérrez",
      email: "albertito@gmail.com",
      rol: "no_responsable",
      telefono: 123456789,
      fecha_Nacimiento: "1980-05-15T00:00:00",
      domicilio: "Calle del pez 55",
      notificaciones: true,
      preferencias: {
        tema: "light",
        tamanoTexto: "medium",
        vistaCalendario: "month",
        primerDiaSemana: 0,
        idioma: "es",
        formatoHora: "12"
      },
      configuracionNotificaciones: {
        emailMedicamentos: true,
        navegadorMedicamentos: true,
        tiempoAnticipacion: 5,
        nuevasCaracteristicas: true,
        consejos: true
      }
    }
    fillUserForms()
    initResponsablesSeccion()
  }

  function fillUserForms() {
    if (!datosPersonalesForm) return
    document.getElementById("nombre").value = userData.nombre || ""
    document.getElementById("apellidos").value = userData.apellidos || ""
    document.getElementById("email").value = userData.email || ""
    document.getElementById("telefono").value = userData.telefono || ""
    if (userData.fecha_Nacimiento) {
      const fecha = new Date(userData.fecha_Nacimiento)
      document.getElementById("fecha_nacimiento").value = fecha.toISOString().split("T")[0]
    }
    document.getElementById("domicilio").value = userData.domicilio || ""
  }

  //  FUNCIONES DE RESPONSABLES 

  function initResponsablesSeccion() {
    const esNoResponsable = userData.rol === 'no_responsable'

    // Configurar botón de añadir responsable
    const btnAgregar = document.getElementById('btnAgregarResponsable')
    if (btnAgregar) {
      const nuevoBoton = btnAgregar.cloneNode(true)
      btnAgregar.parentNode.replaceChild(nuevoBoton, btnAgregar)
      nuevoBoton.addEventListener('click', (e) => {
        e.preventDefault()
        document.getElementById('modalAgregarResponsable').style.display = 'flex'
        document.getElementById('buscarResponsableEmail').value = ''
        document.getElementById('resultadoBusquedaResponsable').innerHTML = ''
      })
    }

    // Configurar búsqueda
    const btnBuscar = document.getElementById('btnBuscarResponsable')
    if (btnBuscar) btnBuscar.addEventListener('click', buscarResponsable)

    const inputBuscar = document.getElementById('buscarResponsableEmail')
    if (inputBuscar) {
      inputBuscar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          buscarResponsable()
        }
      })
    }

    // Actualizar UI según el rol
    actualizarStatusCard()
    cargarResponsables()
  }

  function actualizarStatusCard() {
    const card = document.getElementById('userStatusCard')
    if (!card) return

    if (userData.rol === 'no_responsable') {
      card.innerHTML = `
        <div class="status-title">ESTADO DE TU CUENTA</div>
        <div class="status-value">
          Necesitas responsables que supervisen tu medicación
          <span class="status-badge no-responsable">No responsable</span>
        </div>
        <p>Las personas que asignes como responsables podrán gestionar tu medicación y recibir notificaciones de tus tomas.</p>
      `
      document.querySelector('.responsables-list-header').style.display = 'flex'
    } else {
      card.innerHTML = `
        <div class="status-title">ESTADO DE TU CUENTA</div>
        <div class="status-value">
          Eres responsable de ti mismo
          <span class="status-badge responsable">Responsable</span>
        </div>
        <p>Como eres responsable de ti mismo, no necesitas que otras personas supervisen tu medicación.</p>
      `
      document.querySelector('.responsables-list-header').style.display = 'none'
    }
  }

  async function cargarResponsables() {
    const container = document.getElementById('responsables-container')
    if (!container) return

    if (userData.rol !== 'no_responsable') {
      container.innerHTML = `
        <div class="empty-responsables">
          <i class="fas fa-check-circle"></i>
          <h3>No necesitas responsables</h3>
          <p>Eres responsable de ti mismo, por lo que no requieres supervisión de otras personas.</p>
        </div>
      `
      return
    }

    // Mostrar loading
    container.innerHTML = `
      <div class="loading">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>Cargando responsables...</p>
      </div>
    `

    //  SIMULACIÓN  
    setTimeout(() => {
      // Datos de ejemplo
      tutoresAsignados = [
        { id: 2, nombre: "Carlos López", email: "carlos@email.com" },
        { id: 3, nombre: "María García", email: "maria@email.com" }
      ]

      if (tutoresAsignados.length === 0) {
        container.innerHTML = `
          <div class="empty-responsables">
            <i class="fas fa-user-shield"></i>
            <h3>Aún no tienes responsables asignados</h3>
            <p>Haz clic en "Añadir responsable" para que alguien pueda supervisar tu medicación.</p>
          </div>
        `
      } else {
        mostrarResponsables()
      }
    }, 1500)

    /*  CÓDIGO REAL 
    try {
      const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
      
      const response = await fetch(`${API_URL}/Tutelas/mis-tutores?tuteladoId=${userData.iD_Usuario}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      })

      if (response.ok) {
        tutoresAsignados = await response.json()
        
        if (tutoresAsignados.length === 0) {
          container.innerHTML = `
            <div class="empty-responsables">
              <i class="fas fa-user-shield"></i>
              <h3>Aún no tienes responsables asignados</h3>
              <p>Haz clic en "Añadir responsable" para que alguien pueda supervisar tu medicación.</p>
            </div>
          `
        } else {
          mostrarResponsables()
        }
      } else {
        container.innerHTML = `
          <div class="empty-responsables">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Error al cargar</h3>
            <p>No se pudieron cargar tus responsables. Intenta de nuevo.</p>
          </div>
        `
      }
    } catch (error) {
      console.error("Error:", error)
      container.innerHTML = `
        <div class="empty-responsables">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error de conexión</h3>
          <p>No se pudo conectar con el servidor.</p>
        </div>
      `
    }
    */
  }

  function mostrarResponsables() {
    const container = document.getElementById('responsables-container')
    if (!container) return

    if (!tutoresAsignados.length) {
      container.innerHTML = `
        <div class="empty-responsables">
          <i class="fas fa-user-shield"></i>
          <h3>No tienes responsables asignados</h3>
          <p>Añade personas que puedan gestionar tu medicación</p>
        </div>
      `
      return
    }

    let html = ''
    tutoresAsignados.forEach(tutor => {
      html += `
        <div class="responsable-card" data-id="${tutor.id}">
          <div class="responsable-info">
            <h4><i class="fas fa-user-circle"></i> ${tutor.nombre}</h4>
            <p><i class="fas fa-envelope"></i> ${tutor.email}</p>
          </div>
          <div class="responsable-actions">
            <button class="btn-icon-danger" onclick="window.eliminarResponsable(${tutor.id})" title="Eliminar responsable">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `
    })
    container.innerHTML = html
  }

  //  FUNCIONES DEL MODAL 

  window.cerrarModalResponsable = () => {
    document.getElementById('modalAgregarResponsable').style.display = 'none'
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function buscarResponsable() {
    const email = document.getElementById('buscarResponsableEmail').value.trim()
    const resultadoDiv = document.getElementById('resultadoBusquedaResponsable')

    if (!email) return resultadoDiv.innerHTML = '<p class="error-message">Ingresa un email</p>'
    if (!validarEmail(email)) return resultadoDiv.innerHTML = '<p class="error-message">Email inválido</p>'
    if (tutoresAsignados.some(t => t.email === email)) {
      return resultadoDiv.innerHTML = '<p class="error-message">Este responsable ya está asignado</p>'
    }

    const btn = document.getElementById('btnBuscarResponsable')
    btn.disabled = true
    btn.textContent = 'Buscando...'

    //  SIMULACIÓN
    setTimeout(() => {
      try {
        if (email === 'carlos@email.com') {
          mostrarResponsableExistente({ id: 2, nombre: 'Carlos López', email: email })
        } else if (email === 'maria@email.com') {
          mostrarResponsableExistente({ id: 3, nombre: 'María García', email: email })
        } else {
          mostrarFormularioRegistroResponsable(email)
        }
      } catch (error) {
        resultadoDiv.innerHTML = '<p class="error-message">Error al procesar la búsqueda</p>'
      } finally {
        btn.disabled = false
        btn.textContent = 'Buscar'
      }
    }, 1000)

    /*  CÓDIGO REAL 
    try {
      const response = await fetch(`${API_URL}/Usuarios/buscar?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.existe) {
        mostrarResponsableExistente(data.usuario)
      } else {
        mostrarFormularioRegistroResponsable(email)
      }
    } catch (error) {
      resultadoDiv.innerHTML = '<p class="error-message">Error al conectar con el servidor</p>'
    } finally {
      btn.disabled = false
      btn.textContent = 'Buscar'
    }
    */
  }

  function mostrarResponsableExistente(usuario) {
    const resultadoDiv = document.getElementById('resultadoBusquedaResponsable')
    if (!resultadoDiv) return

    resultadoDiv.innerHTML = `
      <div class="tutor-info">
        <p><strong>Responsable encontrado:</strong> ${usuario.nombre}</p>
        <p>Email: ${usuario.email}</p>
        <button onclick="window.asignarResponsable(${usuario.id}, '${usuario.nombre}', '${usuario.email}')" class="btn-success">
          Asignar como responsable
        </button>
      </div>
    `
  }

  function mostrarFormularioRegistroResponsable(email) {
    const resultadoDiv = document.getElementById('resultadoBusquedaResponsable')
    if (!resultadoDiv) return

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
          <button onclick="window.registrarYAsignarResponsable('${email}')" class="btn-success" style="flex:1; padding:10px;">Registrar y asignar</button>
          <button onclick="window.cancelarBusqueda()" class="btn btn-secondary" style="flex:1; padding:10px;">Cancelar</button>
        </div>
      </div>
    `
  }

  window.asignarResponsable = async function (id, nombre, email) {
    //  SIMULACIÓN 
    setTimeout(() => {
      tutoresAsignados.push({ id, nombre, email })
      mostrarResponsables()
      document.getElementById('modalAgregarResponsable').style.display = 'none'
      alert('Responsable asignado correctamente')
    }, 500)

    /*  CÓDIGO REAL 
    try {
      const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
      
      const response = await fetch(`${API_URL}/Tutelas/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          tutorId: id,
          tuteladoId: userData.iD_Usuario
        })
      })

      if (response.ok) {
        tutoresAsignados.push({ id, nombre, email })
        mostrarResponsables()
        document.getElementById('modalAgregarResponsable').style.display = 'none'
        
        // Mostrar mensaje de éxito
        const msgDiv = document.createElement('div')
        msgDiv.className = 'success-message'
        msgDiv.textContent = 'Responsable asignado correctamente'
        document.querySelector('.perfil-content').prepend(msgDiv)
        setTimeout(() => msgDiv.remove(), 3000)
      } else {
        alert('Error al asignar responsable')
      }
    } catch (error) {
      alert('Error de conexión')
    }
    */
  }

  window.registrarYAsignarResponsable = async function (email) {
    const nombre = document.getElementById('nuevoResponsableNombre').value.trim()
    const password = document.getElementById('nuevoResponsablePassword').value.trim()

    if (!nombre || !password || password.length < 6) {
      alert('Completa todos los campos correctamente (contraseña mínimo 6 caracteres)')
      return
    }

    const btn = event.target
    const originalText = btn.textContent
    btn.disabled = true
    btn.textContent = 'Registrando...'

    //  SIMULACIÓN 
    setTimeout(() => {
      const nuevoId = Math.floor(Math.random() * 1000) + 10
      tutoresAsignados.push({ id: nuevoId, nombre, email })
      mostrarResponsables()
      document.getElementById('modalAgregarResponsable').style.display = 'none'
      alert('Responsable registrado y asignado correctamente')
      btn.disabled = false
      btn.textContent = originalText
    }, 1000)

    /*  CÓDIGO REAL 
    try {
      // Primero registrar al nuevo usuario como tutor
      const responseRegistro = await fetch(`${API_URL}/Usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          email: email,
          contrasena: password,
          rol: 'tutor'
        })
      })

      const dataRegistro = await responseRegistro.json()

      if (!responseRegistro.ok) {
        throw new Error(dataRegistro.message || 'Error al registrar tutor')
      }

      const nuevoId = dataRegistro.usuarioId || dataRegistro.id

      // Luego asignarlo como responsable
      const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
      
      const responseAsignar = await fetch(`${API_URL}/Tutelas/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          tutorId: nuevoId,
          tuteladoId: userData.iD_Usuario
        })
      })

      if (responseAsignar.ok) {
        tutoresAsignados.push({ id: nuevoId, nombre, email })
        mostrarResponsables()
        document.getElementById('modalAgregarResponsable').style.display = 'none'
        
        const msgDiv = document.createElement('div')
        msgDiv.className = 'success-message'
        msgDiv.textContent = 'Responsable registrado y asignado correctamente'
        document.querySelector('.perfil-content').prepend(msgDiv)
        setTimeout(() => msgDiv.remove(), 3000)
      } else {
        alert('Error al asignar el responsable')
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message)
    } finally {
      btn.disabled = false
      btn.textContent = originalText
    }
    */
  }

  window.cancelarBusqueda = () => {
    document.getElementById('resultadoBusquedaResponsable').innerHTML = ''
  }

  window.eliminarResponsable = async function (id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este responsable?')) return

    // SIMULACIÓN  
    console.log("Eliminando responsable ID:", id)
    tutoresAsignados = tutoresAsignados.filter(t => t.id !== id)
    mostrarResponsables()
    alert('Responsable eliminado correctamente')

    /*  CÓDIGO REAL 
    try {
      const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
      
      const response = await fetch(`${API_URL}/Tutelas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      })

      if (response.ok) {
        tutoresAsignados = tutoresAsignados.filter(t => t.id !== id)
        mostrarResponsables()
        
        const msgDiv = document.createElement('div')
        msgDiv.className = 'success-message'
        msgDiv.textContent = 'Responsable eliminado correctamente'
        document.querySelector('.perfil-content').prepend(msgDiv)
        setTimeout(() => msgDiv.remove(), 3000)
      } else {
        alert('Error al eliminar responsable')
      }
    } catch (error) {
      alert('Error de conexión')
    }
    */
  }

  // FUNCIONES DE FORMULARIOS 

  async function handleDatosPersonalesSubmit(e) {
    e.preventDefault()
    hideMessage("datos-error")
    hideMessage("datos-success")

    const formData = new FormData(datosPersonalesForm)
    const updatedUserData = {
      ...userData,
      nombre: formData.get("nombre"),
      apellidos: formData.get("apellidos"),
      email: formData.get("email"),
      telefono: formData.get("telefono") ? Number(formData.get("telefono")) : null,
      fecha_Nacimiento: formData.get("fecha_nacimiento"),
      domicilio: formData.get("domicilio"),
    }

    try {
      /* CÓDIGO REAL 
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      })

      if (!response.ok) throw new Error("Error al actualizar")
      */

      // SIMULACIÓN
      userData = updatedUserData
      updateSession({ nombre: userData.nombre, apellidos: userData.apellidos, email: userData.email })
      showMessage("datos-success", "Datos actualizados correctamente")
    } catch (error) {
      console.error("Error:", error)
      showMessage("datos-error", "Error al actualizar datos. Intente nuevamente.")
    }
  }

  async function handleCambiarPasswordSubmit(e) {
    e.preventDefault()
    hideMessage("password-error")
    hideMessage("password-success")

    const passwordActual = document.getElementById("password-actual").value
    const passwordNuevo = document.getElementById("password-nuevo").value
    const passwordConfirmar = document.getElementById("password-confirmar").value

    if (passwordNuevo !== passwordConfirmar) {
      return showMessage("password-error", "Las contraseñas no coinciden")
    }

    try {
      /*  CÓDIGO REAL 
      const response = await fetch(`${API_URL}/Usuarios/cambiar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userData.iD_Usuario, passwordActual, passwordNuevo }),
      })
      if (!response.ok) throw new Error("Error al cambiar contraseña")
      */

      // SIMULACIÓN
      cambiarPasswordForm.reset()
      showMessage("password-success", "Contraseña actualizada correctamente")
    } catch (error) {
      console.error("Error:", error)
      showMessage("password-error", "Error al cambiar contraseña. Verifique su contraseña actual.")
    }
  }

  async function handleNotificacionesSubmit(e) {
    e.preventDefault()
    hideMessage("notificaciones-error")
    hideMessage("notificaciones-success")

    userData.configuracionNotificaciones = {
      emailMedicamentos: document.getElementById("email-meds").checked,
      navegadorMedicamentos: document.getElementById("browser-meds").checked,
      tiempoAnticipacion: document.getElementById("reminder-time").value,
      nuevasCaracteristicas: document.getElementById("features-updates").checked,
      consejos: document.getElementById("tips-updates").checked,
    }

    try {
      /*  CÓDIGO REAL 
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}/notificaciones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData.configuracionNotificaciones),
      })
      if (!response.ok) throw new Error("Error al actualizar")
      */

      // SIMULACIÓN
      showMessage("notificaciones-success", "Preferencias de notificaciones actualizadas correctamente")
    } catch (error) {
      console.error("Error:", error)
      showMessage("notificaciones-error", "Error al actualizar preferencias. Intente nuevamente.")
    }
  }

  async function handlePreferenciasSubmit(e) {
    e.preventDefault()
    hideMessage("preferencias-error")
    hideMessage("preferencias-success")

    userData.preferencias = {
      tema: document.getElementById("theme").value,
      tamanoTexto: document.getElementById("font-size").value,
      vistaCalendario: document.getElementById("calendar-view").value,
      primerDiaSemana: document.getElementById("first-day").value,
      idioma: document.getElementById("language").value,
      formatoHora: document.getElementById("time-format").value,
    }

    try {
      /*  CÓDIGO REAL 
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}/preferencias`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData.preferencias),
      })
      if (!response.ok) throw new Error("Error al actualizar")
      */

      // SIMULACIÓN
      applyPreferences()
      showMessage("preferencias-success", "Preferencias actualizadas correctamente")
    } catch (error) {
      console.error("Error:", error)
      showMessage("preferencias-error", "Error al actualizar preferencias. Intente nuevamente.")
    }
  }

  function applyPreferences() {
    if (userData.preferencias.tema === "dark") {
      document.body.classList.add("dark-theme")
    } else {
      document.body.classList.remove("dark-theme")
    }
    document.body.classList.remove("text-small", "text-medium", "text-large")
    document.body.classList.add(`text-${userData.preferencias.tamanoTexto}`)
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) {
      alert("Por favor, seleccione una imagen válida")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => { if (avatarPreview) avatarPreview.src = e.target.result }
    reader.readAsDataURL(file)
    alert("Avatar cambiado (simulación)")
  }

  function togglePasswordVisibility() {
    const input = this.parentElement.querySelector("input")
    const icon = this.querySelector("i")
    if (input.type === "password") {
      input.type = "text"
      icon.classList.replace("fa-eye", "fa-eye-slash")
    } else {
      input.type = "password"
      icon.classList.replace("fa-eye-slash", "fa-eye")
    }
  }

  function updatePasswordStrength() {
    if (!strengthBar || !strengthText) return
    const password = this.value
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    strengthBar.style.width = `${strength}%`
    strengthText.textContent = strength <= 25 ? "Débil" : strength <= 50 ? "Regular" : strength <= 75 ? "Buena" : "Excelente"
  }

  async function handleDeleteAccount() {
    const password = document.getElementById("confirm-delete-password").value
    if (!password) return alert("Por favor, ingrese su contraseña")

    try {
      /*  CÓDIGO REAL 
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) throw new Error("Error al eliminar")
      */

      // SIMULACIÓN
      localStorage.removeItem("meditime_session")
      window.location.href = "/index.html"
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar cuenta. Verifique su contraseña e intente nuevamente.")
    }
  }

  async function handleCloseAllSessions() {
    try {
      /*  CÓDIGO REAL 
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}/sesiones`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Error al cerrar sesiones")
      */

      // SIMULACIÓN
      closeModals()
      alert("Todas las sesiones han sido cerradas")
      localStorage.removeItem("meditime_session")
      window.location.href = "login.html"
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cerrar sesiones")
    }
  }

  function handleExportData() {
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
    }

    const jsonData = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meditime_datos_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function closeModals() {
    confirmDeleteModal?.classList.remove("active")
    sessionsModal?.classList.remove("active")
  }

  function showMessage(elementId, message) {
    const element = document.getElementById(elementId)
    if (!element) return
    element.textContent = message
    element.style.display = "block"
    setTimeout(() => element.style.display = "none", 3000)
  }

  function hideMessage(elementId) {
    const element = document.getElementById(elementId)
    if (element) element.style.display = "none"
  }

  function updateSession(updatedData) {
    const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
    if (!session) return
    localStorage.setItem("meditime_session", JSON.stringify({ ...session, ...updatedData }))
  }

  function setupNotificationPermission() {
    const browserToggle = document.getElementById("browser-meds")
    if (browserToggle) {
      browserToggle.addEventListener("change", (e) => {
        if (e.target.checked && window.medicationNotifications) {
          window.medicationNotifications.requestPermission()
        }
      })
    }
  }
})