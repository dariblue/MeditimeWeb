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

  // Inicialización
  init()

  // Funciones
  function init() {
    // Cargar datos del usuario
    loadUserData()

    // Configurar eventos
    setupEvents()

    // Configurar permisos de notificaciones
    setupNotificationPermission()
  }

  function setupEvents() {
    // Manejar cambio de pestañas
    perfilMenuItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tab = item.getAttribute("data-tab")
        if (tab) {
          changeTab(tab)
        }
      })
    })

    // Manejar envío del formulario de datos personales
    if (datosPersonalesForm) {
      datosPersonalesForm.addEventListener("submit", handleDatosPersonalesSubmit)
    }

    // Manejar envío del formulario de cambio de contraseña
    if (cambiarPasswordForm) {
      cambiarPasswordForm.addEventListener("submit", handleCambiarPasswordSubmit)
    }

    // Manejar envío del formulario de notificaciones
    if (notificacionesForm) {
      notificacionesForm.addEventListener("submit", handleNotificacionesSubmit)
    }

    // Manejar envío del formulario de preferencias
    if (preferenciasForm) {
      preferenciasForm.addEventListener("submit", handlePreferenciasSubmit)
    }

    // Manejar cambio de avatar
    if (changeAvatarBtn && avatarUpload) {
      changeAvatarBtn.addEventListener("click", () => {
        avatarUpload.click()
      })

      avatarUpload.addEventListener("change", handleAvatarChange)
    }

    // Manejar botones de mostrar/ocultar contraseña
    togglePasswordBtns.forEach((btn) => {
      btn.addEventListener("click", togglePasswordVisibility)
    })

    // Manejar medidor de seguridad de contraseña
    if (passwordNuevo) {
      passwordNuevo.addEventListener("input", updatePasswordStrength)
    }

    // Manejar eliminar cuenta
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener("click", () => {
        confirmDeleteModal.classList.add("active")
      })
    }

    // Manejar cancelar eliminación
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener("click", closeModals)
    }

    // Manejar confirmar eliminación
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", handleDeleteAccount)
    }

    // Manejar cerrar modales
    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", closeModals)
    })

    // Cerrar modales al hacer clic fuera del contenido
    window.addEventListener("click", (event) => {
      if (event.target === confirmDeleteModal || event.target === sessionsModal) {
        closeModals()
      }
    })

    // Manejar ver sesiones
    if (viewSessionsBtn) {
      viewSessionsBtn.addEventListener("click", () => {
        sessionsModal.classList.add("active")
      })
    }

    // Manejar cerrar modal de sesiones
    if (closeSessionsModalBtn) {
      closeSessionsModalBtn.addEventListener("click", closeModals)
    }

    // Manejar cerrar todas las sesiones
    if (closeAllSessionsBtn) {
      closeAllSessionsBtn.addEventListener("click", handleCloseAllSessions)
    }

    // Manejar exportar datos
    if (exportDataBtn) {
      exportDataBtn.addEventListener("click", handleExportData)
    }
  }

  function changeTab(tab) {
    currentTab = tab

    // Actualizar clases activas en menú
    perfilMenuItems.forEach((item) => {
      if (item.getAttribute("data-tab") === tab) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })

    // Actualizar pestañas visibles
    perfilTabs.forEach((tabElement) => {
      if (tabElement.id === `${tab}-tab`) {
        tabElement.classList.add("active")
      } else {
        tabElement.classList.remove("active")
      }
    })
  }

  async function loadUserData() {
    try {
      // Obtener sesión
      const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
      if (!session) {
        window.location.href = "login"
        return
      }

      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/${session.userId}`, {
        headers: {
          // Añadir token de autenticación si es necesario
          // "Authorization": `Bearer ${session.token}`
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar datos del usuario")
      }

      // Obtener datos
      userData = await response.json()

      // Rellenar formularios
      fillUserForms()
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)

      // Cargar datos de ejemplo para desarrollo
      loadSampleUserData()
    }
  }

  function loadSampleUserData() {
    // Datos de ejemplo para desarrollo
    userData = {
      iD_Usuario: 1,
      nombre: "Alberto",
      apellidos: "Gutiérrez",
      email: "albertito@gmail.com",
      telefono: 123456789,
      fecha_Nacimiento: "1980-05-15T00:00:00",
      domicilio: "Calle del pez 55",
      notificaciones: true,
      isAdmin: true,
      createdAt: "2024-01-15T10:30:00",
      preferencias: {
        tema: "light",
        tamanoTexto: "medium",
        vistaCalendario: "month",
        primerDiaSemana: 0,
        idioma: "es",
        formatoHora: "12",
      },
      configuracionNotificaciones: {
        emailMedicamentos: true,
        navegadorMedicamentos: true,
        tiempoAnticipacion: 5,
        nuevasCaracteristicas: true,
        consejos: true,
      },
    }

    // Rellenar formularios
    fillUserForms()
  }

  function fillUserForms() {
    // Rellenar formulario de datos personales
    if (datosPersonalesForm) {
      document.getElementById("nombre").value = userData.nombre || ""
      document.getElementById("apellidos").value = userData.apellidos || ""
      document.getElementById("email").value = userData.email || ""
      document.getElementById("telefono").value = userData.telefono || ""

      if (userData.fecha_Nacimiento) {
        const fechaNacimiento = new Date(userData.fecha_Nacimiento)
        document.getElementById("fecha_nacimiento").value = fechaNacimiento.toISOString().split("T")[0]
      }

      document.getElementById("domicilio").value = userData.domicilio || ""
    }

    // Rellenar formulario de notificaciones
    if (notificacionesForm && userData.configuracionNotificaciones) {
      document.getElementById("email-meds").checked = userData.configuracionNotificaciones.emailMedicamentos
      document.getElementById("browser-meds").checked = userData.configuracionNotificaciones.navegadorMedicamentos
      document.getElementById("reminder-time").value = userData.configuracionNotificaciones.tiempoAnticipacion
      document.getElementById("features-updates").checked = userData.configuracionNotificaciones.nuevasCaracteristicas
      document.getElementById("tips-updates").checked = userData.configuracionNotificaciones.consejos
    }

    // Rellenar formulario de preferencias
    if (preferenciasForm && userData.preferencias) {
      document.getElementById("theme").value = userData.preferencias.tema
      document.getElementById("font-size").value = userData.preferencias.tamanoTexto
      document.getElementById("calendar-view").value = userData.preferencias.vistaCalendario
      document.getElementById("first-day").value = userData.preferencias.primerDiaSemana
      document.getElementById("language").value = userData.preferencias.idioma
      document.getElementById("time-format").value = userData.preferencias.formatoHora
    }
  }

  async function handleDatosPersonalesSubmit(e) {
    e.preventDefault()

    // Ocultar mensajes previos
    hideMessage("datos-error")
    hideMessage("datos-success")

    // Recoger datos del formulario
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
      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUserData),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar datos del usuario")
      }

      // Actualizar datos
      userData = updatedUserData

      // Actualizar sesión
      updateSession({
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        email: userData.email,
      })

      // Mostrar mensaje de éxito
      showMessage("datos-success", "Datos actualizados correctamente")
    } catch (error) {
      console.error("Error al actualizar datos del usuario:", error)
      showMessage("datos-error", "Error al actualizar datos. Intente nuevamente.")

      // Para desarrollo, simular éxito
      userData = updatedUserData

      // Actualizar sesión
      updateSession({
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        email: userData.email,
      })

      // Mostrar mensaje de éxito
      showMessage("datos-success", "Datos actualizados correctamente")
    }
  }

  async function handleCambiarPasswordSubmit(e) {
    e.preventDefault()

    // Ocultar mensajes previos
    hideMessage("password-error")
    hideMessage("password-success")

    // Recoger datos del formulario
    const passwordActual = document.getElementById("password-actual").value
    const passwordNuevo = document.getElementById("password-nuevo").value
    const passwordConfirmar = document.getElementById("password-confirmar").value

    // Validar contraseñas
    if (passwordNuevo !== passwordConfirmar) {
      showMessage("password-error", "Las contraseñas no coinciden")
      return
    }

    try {
      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/cambiar-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userData.iD_Usuario,
          passwordActual,
          passwordNuevo,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al cambiar contraseña")
      }

      // Limpiar formulario
      cambiarPasswordForm.reset()

      // Mostrar mensaje de éxito
      showMessage("password-success", "Contraseña actualizada correctamente")
    } catch (error) {
      console.error("Error al cambiar contraseña:", error)
      showMessage("password-error", "Error al cambiar contraseña. Verifique su contraseña actual.")

      // Para desarrollo, simular éxito
      cambiarPasswordForm.reset()
      showMessage("password-success", "Contraseña actualizada correctamente")
    }
  }

  async function handleNotificacionesSubmit(e) {
    e.preventDefault()

    // Ocultar mensajes previos
    hideMessage("notificaciones-error")
    hideMessage("notificaciones-success")

    // Recoger datos del formulario
    const emailMedicamentos = document.getElementById("email-meds").checked
    const navegadorMedicamentos = document.getElementById("browser-meds").checked
    const tiempoAnticipacion = document.getElementById("reminder-time").value
    const nuevasCaracteristicas = document.getElementById("features-updates").checked
    const consejos = document.getElementById("tips-updates").checked

    // Actualizar datos
    userData.configuracionNotificaciones = {
      emailMedicamentos,
      navegadorMedicamentos,
      tiempoAnticipacion,
      nuevasCaracteristicas,
      consejos,
    }

    // Actualizar configuración de notificaciones en el sistema
    if (window.medicationNotifications) {
      window.medicationNotifications.updateConfig({
        anticipacion: Number.parseInt(tiempoAnticipacion),
        navegador: navegadorMedicamentos,
        email: emailMedicamentos,
      })
    }

    try {
      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}/notificaciones`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData.configuracionNotificaciones),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar preferencias de notificaciones")
      }

      // Mostrar mensaje de éxito
      showMessage("notificaciones-success", "Preferencias de notificaciones actualizadas correctamente")
    } catch (error) {
      console.error("Error al actualizar preferencias de notificaciones:", error)
      showMessage("notificaciones-error", "Error al actualizar preferencias. Intente nuevamente.")

      // Para desarrollo, simular éxito
      showMessage("notificaciones-success", "Preferencias de notificaciones actualizadas correctamente")
    }
  }

  async function handlePreferenciasSubmit(e) {
    e.preventDefault()

    // Ocultar mensajes previos
    hideMessage("preferencias-error")
    hideMessage("preferencias-success")

    // Recoger datos del formulario
    const tema = document.getElementById("theme").value
    const tamanoTexto = document.getElementById("font-size").value
    const vistaCalendario = document.getElementById("calendar-view").value
    const primerDiaSemana = document.getElementById("first-day").value
    const idioma = document.getElementById("language").value
    const formatoHora = document.getElementById("time-format").value

    // Actualizar datos
    userData.preferencias = {
      tema,
      tamanoTexto,
      vistaCalendario,
      primerDiaSemana,
      idioma,
      formatoHora,
    }

    try {
      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}/preferencias`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData.preferencias),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar preferencias")
      }

      // Aplicar preferencias
      applyPreferences()

      // Mostrar mensaje de éxito
      showMessage("preferencias-success", "Preferencias actualizadas correctamente")
    } catch (error) {
      console.error("Error al actualizar preferencias:", error)
      showMessage("preferencias-error", "Error al actualizar preferencias. Intente nuevamente.")

      // Para desarrollo, simular éxito
      applyPreferences()
      showMessage("preferencias-success", "Preferencias actualizadas correctamente")
    }
  }

  function applyPreferences() {
    // Aplicar tema
    if (userData.preferencias.tema === "dark") {
      document.body.classList.add("dark-theme")
    } else {
      document.body.classList.remove("dark-theme")
    }

    // Aplicar tamaño de texto
    document.body.classList.remove("text-small", "text-medium", "text-large")
    document.body.classList.add(`text-${userData.preferencias.tamanoTexto}`)
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, seleccione una imagen")
      return
    }

    // Mostrar vista previa
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.src = e.target.result
    }
    reader.readAsDataURL(file)

    // Aquí iría la lógica para subir la imagen al servidor
    // Por ahora, solo mostramos la vista previa
  }

  function togglePasswordVisibility() {
    const passwordField = this.parentElement.querySelector("input")
    const icon = this.querySelector("i")

    if (passwordField.type === "password") {
      passwordField.type = "text"
      icon.classList.remove("fa-eye")
      icon.classList.add("fa-eye-slash")
    } else {
      passwordField.type = "password"
      icon.classList.remove("fa-eye-slash")
      icon.classList.add("fa-eye")
    }
  }

  function updatePasswordStrength() {
    if (!strengthBar || !strengthText) return

    const password = this.value
    let strength = 0
    let feedback = "Seguridad de la contraseña"

    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25

    strengthBar.style.width = `${strength}%`

    if (strength <= 25) {
      strengthBar.style.backgroundColor = "#dc3545"
      feedback = "Débil"
    } else if (strength <= 50) {
      strengthBar.style.backgroundColor = "#ffc107"
      feedback = "Regular"
    } else if (strength <= 75) {
      strengthBar.style.backgroundColor = "#28a745"
      feedback = "Buena"
    } else {
      strengthBar.style.backgroundColor = "#20c997"
      feedback = "Excelente"
    }

    strengthText.textContent = feedback
  }

  async function handleDeleteAccount() {
    const password = document.getElementById("confirm-delete-password").value

    if (!password) {
      alert("Por favor, ingrese su contraseña para confirmar")
      return
    }

    try {
      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar cuenta")
      }

      // Cerrar sesión
      localStorage.removeItem("meditime_session")

      // Redirigir a la página de inicio
      window.location.href = "/"
    } catch (error) {
      console.error("Error al eliminar cuenta:", error)
      alert("Error al eliminar cuenta. Verifique su contraseña e intente nuevamente.")

      // Para desarrollo, simular éxito
      localStorage.removeItem("meditime_session")
      window.location.href = "/"
    }
  }

  async function handleCloseAllSessions() {
    try {
      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/${userData.iD_Usuario}/sesiones`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al cerrar sesiones")
      }

      // Cerrar modal
      closeModals()

      // Mostrar mensaje de éxito
      alert("Todas las sesiones han sido cerradas. Deberá iniciar sesión nuevamente.")

      // Cerrar sesión actual
      localStorage.removeItem("meditime_session")
      window.location.href = "login"
    } catch (error) {
      console.error("Error al cerrar sesiones:", error)
      alert("Error al cerrar sesiones. Intente nuevamente.")

      // Para desarrollo, simular éxito
      closeModals()
      alert("Todas las sesiones han sido cerradas. Deberá iniciar sesión nuevamente.")
      localStorage.removeItem("meditime_session")
      window.location.href = "login"
    }
  }

  function handleExportData() {
    // Crear objeto con los datos a exportar
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
      medicamentos: [], // Aquí se añadirían los medicamentos del usuario
      fecha: new Date().toISOString(),
    }

    // Convertir a JSON
    const jsonData = JSON.stringify(dataToExport, null, 2)

    // Crear un blob
    const blob = new Blob([jsonData], { type: "application/json" })

    // Crear URL para el blob
    const url = URL.createObjectURL(blob)

    // Crear un enlace para descargar
    const a = document.createElement("a")
    a.href = url
    a.download = `meditime_datos_${new Date().toISOString().split("T")[0]}.json`

    // Simular clic
    document.body.appendChild(a)
    a.click()

    // Limpiar
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function closeModals() {
    confirmDeleteModal.classList.remove("active")
    sessionsModal.classList.remove("active")
  }

  function showMessage(elementId, message) {
    const element = document.getElementById(elementId)
    if (!element) return

    element.textContent = message
    element.style.display = "block"

    // Ocultar después de 5 segundos
    setTimeout(() => {
      element.style.display = "none"
    }, 5000)
  }

  function hideMessage(elementId) {
    const element = document.getElementById(elementId)
    if (!element) return

    element.style.display = "none"
  }

  function updateSession(updatedData) {
    // Obtener sesión actual
    const session = JSON.parse(localStorage.getItem("meditime_session") || "null")
    if (!session) return

    // Actualizar datos
    const updatedSession = {
      ...session,
      ...updatedData,
    }

    // Guardar sesión actualizada
    localStorage.setItem("meditime_session", JSON.stringify(updatedSession))
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
