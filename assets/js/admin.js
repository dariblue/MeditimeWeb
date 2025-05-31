document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const adminMenuItems = document.querySelectorAll(".admin-menu-item")
  const adminTabs = document.querySelectorAll(".admin-tab")
  const searchUserInput = document.getElementById("search-user")
  const usersTableBody = document.getElementById("users-table-body")
  const addUserBtn = document.getElementById("add-user-btn")
  const userModal = document.getElementById("user-modal")
  const userForm = document.getElementById("user-form")
  const modalTitle = document.getElementById("modal-title")
  const cancelUserBtn = document.getElementById("cancel-user-btn")
  const closeModalBtns = document.querySelectorAll(".close-modal")
  const confirmModal = document.getElementById("confirm-modal")
  const cancelDeleteBtn = document.getElementById("cancel-delete")
  const confirmDeleteBtn = document.getElementById("confirm-delete")
  const prevPageBtn = document.getElementById("prev-page")
  const nextPageBtn = document.getElementById("next-page")
  const paginationInfo = document.getElementById("pagination-info")
  const systemConfigForm = document.getElementById("system-config-form")
  const resetConfigBtn = document.getElementById("reset-config")

  // API URL
  const API_URL = "http://localhost:5000"

  // Estado de la aplicación
  let currentTab = "usuarios"
  let users = []
  let currentPage = 1
  let totalPages = 1
  const itemsPerPage = 10
  let userToDelete = null
  let editingUserId = null
  let searchTerm = ""

  // Inicialización
  init()

  // Funciones
  function init() {
    // Cargar usuarios
    loadUsers()

    // Cargar estadísticas
    loadStats()

    // Configurar eventos
    setupEvents()
  }

  function setupEvents() {
    // Manejar cambio de pestañas
    adminMenuItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tab = item.getAttribute("data-tab")
        if (tab) {
          changeTab(tab)
        }
      })
    })

    // Manejar búsqueda de usuarios
    if (searchUserInput) {
      searchUserInput.addEventListener("input", () => {
        searchTerm = searchUserInput.value.trim().toLowerCase()
        currentPage = 1
        renderUsers()
      })
    }

    // Manejar añadir usuario
    if (addUserBtn) {
      addUserBtn.addEventListener("click", openAddUserModal)
    }

    // Manejar envío del formulario de usuario
    if (userForm) {
      userForm.addEventListener("submit", handleUserFormSubmit)
    }

    // Manejar cancelar en el formulario de usuario
    if (cancelUserBtn) {
      cancelUserBtn.addEventListener("click", closeModals)
    }

    // Manejar cerrar modales
    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", closeModals)
    })

    // Cerrar modales al hacer clic fuera del contenido
    window.addEventListener("click", (event) => {
      if (event.target === userModal || event.target === confirmModal) {
        closeModals()
      }
    })

    // Manejar cancelar eliminación
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener("click", closeModals)
    }

    // Manejar confirmar eliminación
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", handleConfirmDelete)
    }

    // Manejar paginación
    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--
          renderUsers()
        }
      })
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++
          renderUsers()
        }
      })
    }

    // Manejar envío del formulario de configuración
    if (systemConfigForm) {
      systemConfigForm.addEventListener("submit", (e) => {
        e.preventDefault()
        // Aquí iría la lógica para guardar la configuración
        alert("Configuración guardada correctamente")
      })
    }

    // Manejar reseteo de configuración
    if (resetConfigBtn) {
      resetConfigBtn.addEventListener("click", () => {
        if (confirm("¿Está seguro de que desea restablecer la configuración a los valores predeterminados?")) {
          // Aquí iría la lógica para resetear la configuración
          systemConfigForm.reset()
        }
      })
    }
  }

  function changeTab(tab) {
    currentTab = tab

    // Actualizar clases activas en menú
    adminMenuItems.forEach((item) => {
      if (item.getAttribute("data-tab") === tab) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })

    // Actualizar pestañas visibles
    adminTabs.forEach((tabElement) => {
      if (tabElement.id === `${tab}-tab`) {
        tabElement.classList.add("active")
      } else {
        tabElement.classList.remove("active")
      }
    })
  }

  async function loadUsers() {
    try {
      // Obtener sesión para el token de autenticación (si es necesario)
      const session = JSON.parse(localStorage.getItem("meditime_session") || "null")

      // Mostrar mensaje de carga
      if (usersTableBody) {
        usersTableBody.innerHTML = `<tr><td colspan="7" class="loading-message">Cargando usuarios...</td></tr>`
      }

      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios`, {
        headers: {
          // Añadir token de autenticación si es necesario
          // "Authorization": `Bearer ${session?.token}`
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar usuarios")
      }

      // Obtener datos
      const data = await response.json()
      users = Array.isArray(data) ? data : []

      // Renderizar usuarios
      renderUsers()
    } catch (error) {
      console.error("Error al cargar usuarios:", error)

      // Mostrar mensaje de error
      if (usersTableBody) {
        usersTableBody.innerHTML = `<tr><td colspan="7" class="loading-message">Error al cargar usuarios. Intente nuevamente.</td></tr>`
      }

      // Cargar datos de ejemplo para desarrollo
      loadSampleUsers()
    }
  }

  function loadSampleUsers() {
    // Datos de ejemplo para desarrollo
    users = [
      {
        iD_Usuario: 1,
        nombre: "Alberto",
        apellidos: "Gutiérrez",
        email: "albertito@gmail.com",
        telefono: 123456789,
        fecha_Nacimiento: "2024-02-05T00:00:00",
        domicilio: "Calle del pez 55",
        notificaciones: false,
        isAdmin: true,
        createdAt: "2024-01-15T10:30:00",
      },
      {
        iD_Usuario: 2,
        nombre: "María",
        apellidos: "López",
        email: "maria@gmail.com",
        telefono: 987654321,
        fecha_Nacimiento: "1980-05-15T00:00:00",
        domicilio: "Avenida Principal 123",
        notificaciones: true,
        isAdmin: false,
        createdAt: "2024-02-10T14:20:00",
      },
      {
        iD_Usuario: 3,
        nombre: "Juan",
        apellidos: "Pérez",
        email: "juan@gmail.com",
        telefono: 555123456,
        fecha_Nacimiento: "1975-08-22T00:00:00",
        domicilio: "Plaza Mayor 7",
        notificaciones: true,
        isAdmin: false,
        createdAt: "2024-02-15T09:45:00",
      },
    ]

    // Renderizar usuarios
    renderUsers()
  }

  function renderUsers() {
    if (!usersTableBody) return

    // Filtrar usuarios según término de búsqueda
    const filteredUsers = users.filter((user) => {
      if (!searchTerm) return true

      return (
        user.nombre.toLowerCase().includes(searchTerm) ||
        user.apellidos.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
    })

    // Calcular paginación
    totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    // Actualizar información de paginación
    if (paginationInfo) {
      paginationInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`
    }

    // Habilitar/deshabilitar botones de paginación
    if (prevPageBtn) {
      prevPageBtn.disabled = currentPage <= 1
    }

    if (nextPageBtn) {
      nextPageBtn.disabled = currentPage >= totalPages
    }

    // Si no hay usuarios, mostrar mensaje
    if (paginatedUsers.length === 0) {
      usersTableBody.innerHTML = `<tr><td colspan="7" class="loading-message">No se encontraron usuarios</td></tr>`
      return
    }

    // Renderizar usuarios
    usersTableBody.innerHTML = paginatedUsers
      .map(
        (user) => `
      <tr>
        <td>${user.iD_Usuario}</td>
        <td>${user.nombre} ${user.apellidos}</td>
        <td>${user.email}</td>
        <td>${user.telefono || "-"}</td>
        <td>${formatDate(user.createdAt || new Date().toISOString())}</td>
        <td>
          <span class="admin-badge ${user.isAdmin ? "admin-badge-success" : "admin-badge-secondary"}">
            ${user.isAdmin ? "Sí" : "No"}
          </span>
        </td>
        <td>
          <div class="user-actions">
            <button class="btn-icon btn-edit" data-id="${user.iD_Usuario}" aria-label="Editar usuario">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" data-id="${user.iD_Usuario}" aria-label="Eliminar usuario">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("")

    // Añadir eventos a los botones de acción
    setupActionButtons()
  }

  function setupActionButtons() {
    // Botones de editar
    const editButtons = document.querySelectorAll(".btn-edit")
    editButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.getAttribute("data-id")
        if (userId) {
          openEditUserModal(Number(userId))
        }
      })
    })

    // Botones de eliminar
    const deleteButtons = document.querySelectorAll(".btn-delete")
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.getAttribute("data-id")
        if (userId) {
          openDeleteConfirmModal(Number(userId))
        }
      })
    })
  }

  function openAddUserModal() {
    modalTitle.textContent = "Añadir Usuario"
    editingUserId = null
    userForm.reset()
    userModal.classList.add("active")
  }

  function openEditUserModal(userId) {
    const user = users.find((u) => u.iD_Usuario === userId)
    if (!user) return

    modalTitle.textContent = "Editar Usuario"
    editingUserId = userId

    // Rellenar el formulario con los datos del usuario
    document.getElementById("user-nombre").value = user.nombre || ""
    document.getElementById("user-apellidos").value = user.apellidos || ""
    document.getElementById("user-email").value = user.email || ""
    document.getElementById("user-telefono").value = user.telefono || ""

    if (user.fecha_Nacimiento) {
      const fechaNacimiento = new Date(user.fecha_Nacimiento)
      document.getElementById("user-fecha-nacimiento").value = fechaNacimiento.toISOString().split("T")[0]
    }

    document.getElementById("user-domicilio").value = user.domicilio || ""
    document.getElementById("user-password").value = "" // No mostrar contraseña
    document.getElementById("user-admin").checked = user.isAdmin
    document.getElementById("user-notificaciones").checked = user.notificaciones

    userModal.classList.add("active")
  }

  function openDeleteConfirmModal(userId) {
    userToDelete = userId
    confirmModal.classList.add("active")
  }

  async function handleUserFormSubmit(e) {
    e.preventDefault()

    // Recoger datos del formulario
    const formData = new FormData(userForm)
    const userData = {
      nombre: formData.get("nombre"),
      apellidos: formData.get("apellidos"),
      email: formData.get("email"),
      telefono: formData.get("telefono") ? Number(formData.get("telefono")) : null,
      fecha_Nacimiento: formData.get("fecha_nacimiento"),
      domicilio: formData.get("domicilio"),
      notificaciones: formData.get("notificaciones") === "on",
      isAdmin: formData.get("isAdmin") === "on",
    }

    // Si estamos editando, añadir el ID
    if (editingUserId) {
      userData.iD_Usuario = editingUserId
    } else {
      // Si estamos creando, añadir la contraseña
      userData.contrasena = formData.get("password")
    }

    // Si estamos editando y se ha proporcionado una contraseña, añadirla
    if (editingUserId && formData.get("password")) {
      userData.contrasena = formData.get("password")
    }

    try {
      // Determinar si es una creación o actualización
      const method = editingUserId ? "PUT" : "POST"
      const url = editingUserId ? `${API_URL}/Usuarios/${editingUserId}` : `${API_URL}/Usuarios`

      // Realizar solicitud a la API
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error(`Error al ${editingUserId ? "actualizar" : "crear"} usuario`)
      }

      // Cerrar modal
      closeModals()

      // Recargar usuarios
      loadUsers()

      // Mostrar mensaje de éxito
      alert(`Usuario ${editingUserId ? "actualizado" : "creado"} correctamente`)
    } catch (error) {
      console.error(`Error al ${editingUserId ? "actualizar" : "crear"} usuario:`, error)
      alert(`Error al ${editingUserId ? "actualizar" : "crear"} usuario. Intente nuevamente.`)

      // Para desarrollo, simular éxito
      if (editingUserId) {
        // Actualizar usuario en el array local
        const index = users.findIndex((u) => u.iD_Usuario === editingUserId)
        if (index !== -1) {
          users[index] = { ...users[index], ...userData }
        }
      } else {
        // Añadir usuario al array local
        const newUser = {
          ...userData,
          iD_Usuario: users.length > 0 ? Math.max(...users.map((u) => u.iD_Usuario)) + 1 : 1,
          createdAt: new Date().toISOString(),
        }
        users.push(newUser)
      }

      // Cerrar modal
      closeModals()

      // Renderizar usuarios
      renderUsers()
    }
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return

    try {
      // Realizar solicitud a la API
      const response = await fetch(`${API_URL}/Usuarios/${userToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar usuario")
      }

      // Cerrar modal
      closeModals()

      // Recargar usuarios
      loadUsers()

      // Mostrar mensaje de éxito
      alert("Usuario eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      alert("Error al eliminar usuario. Intente nuevamente.")

      // Para desarrollo, simular éxito
      users = users.filter((u) => u.iD_Usuario !== userToDelete)

      // Cerrar modal
      closeModals()

      // Renderizar usuarios
      renderUsers()
    } finally {
      userToDelete = null
    }
  }

  function closeModals() {
    userModal.classList.remove("active")
    confirmModal.classList.remove("active")
    editingUserId = null
    userToDelete = null
  }

  function loadStats() {
    // Aquí iría la lógica para cargar estadísticas desde la API
    // Por ahora, usamos datos de ejemplo

    // Total de usuarios
    document.getElementById("total-users").textContent = users.length

    // Nuevos usuarios en el último mes
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const newUsers = users.filter((user) => {
      if (!user.createdAt) return false
      const createdAt = new Date(user.createdAt)
      return createdAt >= oneMonthAgo
    }).length

    document.getElementById("new-users").textContent = newUsers

    // Datos de ejemplo para otras estadísticas
    document.getElementById("total-meds").textContent = "42"
    document.getElementById("active-reminders").textContent = "156"
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
})
