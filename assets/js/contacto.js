document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const contactForm = document.getElementById("contact-form")
  const confirmModal = document.getElementById("confirm-modal")
  const closeModalBtn = document.querySelector(".close-modal")
  const confirmOkBtn = document.getElementById("confirm-ok")
  const accordionButtons = document.querySelectorAll(".accordion-button")

  // Manejar envío del formulario
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Aquí iría la lógica para enviar el formulario a un servidor
      // Por ahora, simplemente mostramos el modal de confirmación
      showConfirmModal()
    })
  }

  // Mostrar modal de confirmación
  function showConfirmModal() {
    if (confirmModal) {
      confirmModal.classList.add("active")
    }
  }

  // Cerrar modal
  function closeModal() {
    if (confirmModal) {
      confirmModal.classList.remove("active")
      // Resetear el formulario después de cerrar el modal
      if (contactForm) {
        contactForm.reset()
      }
    }
  }

  // Manejadores de eventos para cerrar el modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal)
  }

  if (confirmOkBtn) {
    confirmOkBtn.addEventListener("click", closeModal)
  }

  // Cerrar modal al hacer clic fuera del contenido
  window.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
      closeModal()
    }
  })

  // Funcionalidad del acordeón para las FAQs
  accordionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Obtener el estado actual
      const isExpanded = this.getAttribute("aria-expanded") === "true"

      // Cambiar el estado
      this.setAttribute("aria-expanded", !isExpanded)

      // Obtener el contenido asociado
      const contentId = this.getAttribute("aria-controls")
      const content = document.getElementById(contentId)

      // Alternar la clase active para mostrar/ocultar el contenido
      if (content) {
        if (isExpanded) {
          content.classList.remove("active")
        } else {
          content.classList.add("active")
        }
      }
    })
  })

  // Validación de formulario mejorada
  const inputs = document.querySelectorAll("input, textarea")

  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateInput(this)
    })
  })

  function validateInput(input) {
    // Eliminar mensajes de error previos
    const parent = input.parentElement
    const errorMessage = parent.querySelector(".error-message")
    if (errorMessage) {
      parent.removeChild(errorMessage)
    }

    // Validar según el tipo de input
    if (input.required && input.value.trim() === "") {
      showError(input, "Este campo es obligatorio")
      return false
    }

    if (input.type === "email" && input.value.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(input.value)) {
        showError(input, "Por favor, introduce un email válido")
        return false
      }
    }

    if (input.type === "tel" && input.value.trim() !== "") {
      const phoneRegex = /^\d{9}$/
      if (!phoneRegex.test(input.value.replace(/\s/g, ""))) {
        showError(input, "Por favor, introduce un número de teléfono válido (9 dígitos)")
        return false
      }
    }

    return true
  }

  function showError(input, message) {
    const parent = input.parentElement
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.textContent = message
    errorDiv.style.color = "#dc3545"
    errorDiv.style.fontSize = "0.9rem"
    errorDiv.style.marginTop = "5px"
    parent.appendChild(errorDiv)

    // Añadir clase de error al input
    input.classList.add("input-error")
    input.style.borderColor = "#dc3545"
  }

  // Validación completa al enviar el formulario
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()

      let isValid = true

      // Validar todos los campos
      inputs.forEach((input) => {
        if (!validateInput(input)) {
          isValid = false
        }
      })

      // Si todo es válido, mostrar el modal de confirmación
      if (isValid) {
        showConfirmModal()
      }
    })
  }
})
