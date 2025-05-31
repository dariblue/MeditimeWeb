// Módulo de manejo de modales

export function createModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    throw new Error(`Modal con ID ${modalId} no encontrado`);
  }

  const closeBtn = modal.querySelector("button[data-bs-dismiss='modal']");
  const cancelBtn = modal.querySelector("button.btn-secondary");

  if (!closeBtn) {
    throw new Error("Botón de cerrar modal no encontrado");
  }

  if (!cancelBtn) {
    throw new Error("Botón de cancelar modal no encontrado");
  }

  // Configurar eventos para cerrar el modal
  closeBtn.addEventListener("click", () => closeModalManually(modalId));
  cancelBtn.addEventListener("click", () => closeModalManually(modalId));

  return new Modal(modal, closeBtn, cancelBtn);
}

// Inicializar el modal con Bootstrap
const medModalElement = document.getElementById('med-modal');
let medModal = null;

if (medModalElement) {
  medModal = new bootstrap.Modal(medModalElement); // Inicializar el modal con Bootstrap
} else {
  console.error('Modal de agregar medicamento no encontrado');
}

class Modal {
  constructor(modal, closeBtn, cancelBtn) {
    this.modal = modal
    this.closeBtn = closeBtn
    this.cancelBtn = cancelBtn
    this.title = modal.querySelector(".modal-title")
    this.content = modal.querySelector(".modal-content")
    this.setupEventListeners()
  }

  setupEventListeners() {
    this.closeBtn.addEventListener("click", () => this.close())
    this.cancelBtn.addEventListener("click", () => this.close())
    
    // Cerrar al hacer clic fuera del contenido
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.close()
      }
    })
  }

  open(title = "") {
    if (this.title && title) {
      this.title.textContent = title
    }
    this.modal.classList.add("active")
    document.body.style.overflow = "hidden"
  }

  close() {
    this.modal.classList.remove("active")
    document.body.style.overflow = ""
  }

  setContent(content) {
    if (this.content) {
      this.content.innerHTML = content
    }
  }
}

function closeModalManually(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    modalElement.classList.remove('show'); // Ocultar el modal
    modalElement.style.display = 'none'; // Asegurarse de que no sea visible
    document.body.classList.remove('modal-open'); // Eliminar la clase que bloquea el scroll
    document.body.style.overflow = ''; // Restaurar el scroll
    document.body.style.paddingRight = ''; // Restaurar el padding

    // Eliminar el fondo gris (backdrop)
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove(); // Eliminar el elemento del DOM
    }
  } else {
    console.error(`Modal con ID ${modalId} no encontrado.`);
  }
}