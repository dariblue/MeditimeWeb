const API_URL = 'http://localhost:5000';


import { formatHora, showError, hideError } from "./modules/utils.js";
import { createModal } from "./modules/modal.js";
import {
  saveMedicamento,
  deleteMedicamento,
  getMedicamentos,
  saveOrUpdateMedicamento // Importar la función
} from "./modules/medicamentos.js";


document.addEventListener("DOMContentLoaded", async () => {
  // console.log('DOM cargado');

  const session = window.auth.getCurrentUser();
  if (!session) {
    window.location.href = "/pages/login.html";
    return;
  }

  // Inicializar modales
  const addMedModal = document.getElementById("med-modal");
  const addFirstMedModal = document.getElementById("med-modal");

  if (addMedModal) {
    const modal = new bootstrap.Modal(addMedModal);
    window.addMedModal = modal;
  } else {
    console.error("Modal de agregar medicamento no encontrado");
  }

  if (addFirstMedModal) {
    const modal = new bootstrap.Modal(addFirstMedModal);
    window.addFirstMedModal = modal;
  } else {
    console.error("Modal de primer medicamento no encontrado");
  }

  // Event listeners para los botones
  const addMedBtn = document.getElementById("add-med-btn");
  const addFirstMedBtn = document.getElementById("add-first-med");

  if (addMedBtn) {
    addMedBtn.addEventListener("click", () => {
      if (window.addMedModal) {
        window.addMedModal.show();
      } else {
        console.error("Modal de agregar medicamento no inicializado");
      }
    });
  } else {
    console.error("Botón de agregar medicamento no encontrado");
  }

  if (addFirstMedBtn) {
    addFirstMedBtn.addEventListener("click", () => {
      if (window.addFirstMedModal) {
        window.addFirstMedModal.show();
      } else {
        console.error("Modal de primer medicamento no inicializado");
      }
    });
  } else {
    console.error("Botón de primer medicamento no encontrado");
  }

  // Cargar medicamentos
  try {
    const medicamentos = await getMedicamentos();
    if (medicamentos.length === 0) {
      document.getElementById("no-recordatorios").style.display = "block";
    } else {
      document.getElementById("no-recordatorios").style.display = "none";
      // Actualizar la lista de medicamentos
    }
  } catch (error) {
    console.error("Error al cargar medicamentos:", error);
    showError("Error al cargar los medicamentos");
  }

  // Referencias a elementos del DOM
  const filtroBtns = document.querySelectorAll(".filtro-btn");
  const recordatoriosContainer = document.getElementById(
    "recordatorios-container"
  );
  const miniCalendario = document.getElementById("mini-calendario");
  const porcentajeCumplimientoElement = document.getElementById(
    "porcentaje-cumplimiento"
  );
  const totalMedicamentosElement =
    document.getElementById("total-medicamentos");
  const totalDosisElement = document.getElementById("total-dosis");
  const noRecordatorios = document.getElementById("no-recordatorios");
  const medModalElement = document.getElementById("med-modal");
  const confirmModalElement = document.getElementById("confirm-modal");

  // Crear instancias de modales solo si los elementos existen
  let medModal = null;
  let confirmModal = null;

  if (medModalElement) {
    medModal = createModal("med-modal");
  } else {
    console.error("Modal de agregar medicamento no encontrado");
  }

  if (confirmModalElement) {
    confirmModal = createModal("confirm-modal");
  }

  if (medModal) {
    console.log("Modal de edición inicializado correctamente");
  } else {
    console.error("Modal de edición no inicializado");
  }

  // Estado de la aplicación
  let currentFilter = "todos";
  let recordatorioToDelete = null;
  let editingRecordatorioId = null;
  let medicamentos = [];
  const currentDate = new Date();

  // Inicialización
  loadMedicamentos().then(() => {
    renderMedicamentos(); // despues de inicialixar loadMedicamentos
    renderMiniCalendario();
    updateEstadisticas();
  });

  // Manejadores de eventos
  if (addMedBtn) {
    addMedBtn.addEventListener("click", () => {
      if (medModal) {
        openAddModal();
      }
    });
  }

  if (addFirstMedBtn) {
    addFirstMedBtn.addEventListener("click", () => {
      if (medModal) {
        openAddModal();
      }
    });
  }

  // Manejar el envío del formulario
  const medForm = document.getElementById("med-form");
  if (medForm) {
    medForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Evitar el envío automático del formulario
    });
  }

  // Manejar filtros
  filtroBtns.forEach((btn) => {
    btn.addEventListener("click", handleFilterClick);
  });

  // Manejar confirmación de eliminación
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
  }

  // Establecer fecha de inicio por defecto
  const medInicio = document.getElementById("med-inicio");
  if (medInicio) {
    const today = new Date();
    medInicio.value = today.toISOString().split("T")[0];
  }

  // Funciones
  function openAddModal() {
    resetForm();

    const modalElement = document.getElementById("med-modal");
    if (modalElement) {
      const modalTitle = modalElement.querySelector(".modal-title");
      if (modalTitle) {
        modalTitle.textContent = "Añadir un nuevo medicamento!";
      }

      const saveButton = modalElement.querySelector(".btn-success");
      if (saveButton) {
        saveButton.textContent = "Guardar Medicamento";

        // Limpiar cualquier evento previo
        saveButton.onclick = null;

        // Asignar el nuevo evento para crear un medicamento
        saveButton.onclick = async () => {
          const newMedicamento = {
            nombre: document.getElementById("med-nombre").value.trim(),
            tipoMedicamento: document.getElementById("med-tipo").value.trim(),
            dosis: document.getElementById("med-dosis").value.trim(),
            horaToma: document.getElementById("med-hora").value.trim(),
            notas: document.getElementById("med-instrucciones").value.trim() || "",
            fechaInicio: document.getElementById("med-inicio").value || null,
            fechaFin: document.getElementById("med-fin").value || null,
          };

          try {
            await saveOrUpdateMedicamento(newMedicamento); // Crear un nuevo medicamento
            closeModalManually("med-modal");
            await loadMedicamentos();
            renderMedicamentos();
            renderMiniCalendario();
            updateEstadisticas();
          } catch (error) {
            console.error("Error al guardar el medicamento:", error);
          }
        };
      }

      modalElement.classList.add("show", "active");
      modalElement.style.display = "block";
      document.body.classList.add("modal-open");
    } else {
      console.error("Modal de agregar medicamento no encontrado");
    }
  }

  function openEditModal(id) {
    console.log(`Abriendo modal de edición para el medicamento con ID: ${id}`);
    const medicamento = getMedicamentoById(id);
    if (!medicamento) {
      console.error(`No se encontró el medicamento con ID ${id}`);
      return;
    }

    resetForm();

    // Rellenar el formulario con los datos existentes
    document.getElementById("med-nombre").value = medicamento.nombre;
    document.getElementById("med-tipo").value = medicamento.tipoMedicamento || "";
    document.getElementById("med-dosis").value = medicamento.dosis;
    document.getElementById("med-instrucciones").value =
      medicamento.notas || "";
    document.getElementById("med-hora").value = medicamento.horas[0] || "";

    if (medicamento.inicio) {
      document.getElementById("med-inicio").value = medicamento.inicio.split("T")[0];
    }

    if (medicamento.fin) {
      document.getElementById("med-fin").value = medicamento.fin.split("T")[0];
    }

    editingRecordatorioId = id;

    // Cambiar el título del modal
    const modalElement = document.getElementById("med-modal");
    if (modalElement) {
      const modalTitle = modalElement.querySelector(".modal-title");
      if (modalTitle) {
        modalTitle.textContent = "Edita tu medicamento!";
      }

      // Cambiar el texto del botón de guardar
      const saveButton = modalElement.querySelector(".btn-success");
      if (saveButton) {
        saveButton.textContent = "Actualizar Medicamento";

        // Limpiar cualquier evento previo
        saveButton.onclick = null;

        // Asignar el nuevo evento para actualizar un medicamento
        saveButton.onclick = async () => {
          const updatedMedicamento = {
            id: editingRecordatorioId, // Incluir el ID del medicamento
            nombre: document.getElementById("med-nombre").value.trim(),
            tipoMedicamento: document.getElementById("med-tipo").value.trim(),
            dosis: document.getElementById("med-dosis").value.trim(),
            horaToma: document.getElementById("med-hora").value.trim(),
            notas: document.getElementById("med-instrucciones").value.trim() || "",
            fechaInicio: document.getElementById("med-inicio").value || null,
            fechaFin: document.getElementById("med-fin").value || null,
          };

          try {
            await saveOrUpdateMedicamento(updatedMedicamento); // Actualizar el medicamento
            closeModalManually("med-modal");
            await loadMedicamentos();
            renderMedicamentos();
            renderMiniCalendario();
            updateEstadisticas();
          } catch (error) {
            console.error("Error al actualizar el medicamento:", error);
          }
        };
      }

      modalElement.classList.add("show", "active");
      modalElement.style.display = "block";
      document.body.classList.add("modal-open"); // Evitar scroll en el fondo
    } else {
      console.error("Modal de edición no encontrado");
    }
  }

  function openDeleteConfirmModal(id) {
    recordatorioToDelete = id;

    const modalElement = document.getElementById("confirm-modal");
    if (modalElement) {
      modalElement.classList.add("show", "active");
      modalElement.style.display = "block";
      document.body.classList.add("modal-open"); // Evitar scroll en el fondo
    } else {
      console.error("Modal de confirmación no encontrado");
    }
  }

  function resetForm() {
    const form = document.getElementById("med-form");
    if (form) {
      form.reset();
      const today = new Date();
      const medInicio = document.getElementById("med-inicio");
      if (medInicio) {
        medInicio.value = today.toISOString().split("T")[0];
      }
    }
  }

  // Función para cerrar el modal manualmente
  function closeModalManually(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.classList.remove("show", "active");
      modalElement.style.display = "none";
      document.body.classList.remove("modal-open"); // Restaurar el scroll en el fondo

      // Eliminar el fondo oscuro del modal (backdrop)
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.remove(); // Eliminar el elemento del DOM
      }
    } else {
      console.error(`Modal con ID ${modalId} no encontrado.`);
    }
  }

  // Manejar el envío del formulario
  async function handleFormSubmit(e) {
    e.preventDefault();

    // Verificar campos obligatorios
    const requiredFields = medForm.querySelectorAll(
      "input[required], select[required]"
    );
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        field.classList.add("invalid");
        isValid = false;
      } else {
        field.classList.remove("invalid");
      }
    });

    if (!isValid) {
      showError(
        document.getElementById("form-error"),
        "Por favor, complete todos los campos obligatorios"
      );
      return;
    }

    // Recoger datos del formulario
    const medicamento = {
      nombre: document.getElementById("med-nombre").value.trim(),
      tipoMedicamento: document.getElementById("med-tipo").value.trim(),
      dosis: document.getElementById("med-dosis").value.trim(),
      horaToma: document.getElementById("med-hora").value.trim(),
      notas: document.getElementById("med-instrucciones").value.trim() || "",
      fechaInicio: document.getElementById("med-inicio").value || null,
      fechaFin: document.getElementById("med-fin").value || null,
    };

    try {
      // Guardar el medicamento en la API
      await saveMedicamento(medicamento);
      // console.log('Medicamento guardado exitosamente');

      // Cerrar el modal manualmente
      closeModalManually("med-modal");

      // Actualizar la lista de medicamentos
      await loadMedicamentos(); // Recargar los medicamentos desde la API
      renderMedicamentos();
      renderMiniCalendario();
      updateEstadisticas();
    } catch (error) {
      console.error("Error al guardar el medicamento:", error);
      showError(
        document.getElementById("form-error"),
        "Error al guardar el medicamento. Por favor, inténtelo de nuevo."
      );
    }
  }

  function handleFilterClick() {
    filtroBtns.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.getAttribute("data-filter");
    applyFilter();
  }

  function handleConfirmDelete() {
    if (recordatorioToDelete) {
      deleteMedicamento(recordatorioToDelete)
      .then(() => {
        console.log("Medicamento eliminado con éxito");
        recordatorioToDelete = null;
        closeModalManually("confirm-modal");
        loadMedicamentos().then(() => {
          renderMedicamentos(); // recargar medicamentos después de eliminar
          renderMiniCalendario();
          updateEstadisticas();
        });
      })
      .catch((error) => {
        console.error("Error al eliminar el medicamento:", error);
      });

      // confirmModal.close();
    }
  }

  function renderMedicamentos() {
    if (!recordatoriosContainer) return;

    // Limpiar el contenedor de recordatorios excepto el mensaje de no recordatorios
    const noRecordatorios = document.getElementById("no-recordatorios");
    recordatoriosContainer.innerHTML = "";
    if (noRecordatorios) {
      recordatoriosContainer.appendChild(noRecordatorios);
    }

    // Agrupar medicamentos por hora para el día actual
    const medicamentosHoy = getMedicamentosPorDia(new Date());

    // console.log("Medicamentos a renderizar:", medicamentosHoy);

    if (medicamentosHoy.length === 0) {
      if (noRecordatorios) {
        noRecordatorios.style.display = "flex";
      }
      return;
    }

    // Ocultar mensaje de no recordatorios
    if (noRecordatorios) {
      noRecordatorios.style.display = "none";
    }

    // Ordenar por hora
    medicamentosHoy.sort((a, b) => a.hora.localeCompare(b.hora));

    // Renderizar cada medicamento
    medicamentosHoy.forEach((med) => {
      const recordatorioItem = createRecordatorioElement(med);
      recordatoriosContainer.appendChild(recordatorioItem);
    });

    applyFilter();
  }

  function createRecordatorioElement(medicamento) {
    const recordatorioItem = document.createElement("div");
    recordatorioItem.className = "recordatorio-item";
    recordatorioItem.setAttribute("data-estado", medicamento.estado);
    recordatorioItem.setAttribute("data-id", medicamento.id);

    // Formatear la hora para mostrar
    const horaFormateada = formatHora(medicamento.hora);

    // Icono según el tipo de medicamento
    const tipoIcono = getTipoMedicamentoIcono(medicamento.tipo);

    // Construir el elemento HTML
    recordatorioItem.innerHTML = `
      <div class="recordatorio-hora">
        <span class="hora">${horaFormateada}</span>
      </div>
      <div class="recordatorio-info">
        <h4>${tipoIcono} ${medicamento.nombre}</h4>
        <p>${medicamento.dosis}</p>
        ${
          medicamento.instrucciones
            ? `<p class="instrucciones">${medicamento.instrucciones}</p>`
            : ""
        }
      </div>
      <div class="recordatorio-acciones">
        <button class="btn-accion btn-completar ${
          medicamento.estado === "completado" ? "completado" : ""
        }" 
                aria-label="Marcar como ${
                  medicamento.estado === "completado"
                    ? "pendiente"
                    : "completado"
                }">
          <i class="fas fa-check"></i>
        </button>
        <button class="btn-accion btn-editar" aria-label="Editar recordatorio">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-accion btn-eliminar" aria-label="Eliminar recordatorio">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    setupItemActionButtons(recordatorioItem);

    return recordatorioItem;
  }

  function getTipoMedicamentoIcono(tipo) {
    const iconos = {
      pastilla: '<i class="fas fa-pills"></i>',
      capsula: '<i class="fas fa-capsules"></i>',
      jarabe: '<i class="fas fa-prescription-bottle"></i>',
      aerosol: '<i class="fas fa-spray-can"></i>',
      inyeccion: '<i class="fas fa-syringe"></i>',
      pomada: '<i class="fas fa-prescription-bottle-alt"></i>',
      gotas: '<i class="fas fa-eye-dropper"></i>',
      otro: '<i class="fas fa-briefcase-medical"></i>',
    };

    return iconos[tipo] || '<i class="fas fa-pills"></i>';
  }

  function setupItemActionButtons(item) {
    const id = item.getAttribute("data-id");

    const btnCompletar = item.querySelector(".btn-completar");
    const btnEditar = item.querySelector(".btn-editar");
    const btnEliminar = item.querySelector(".btn-eliminar");

    if (btnCompletar) {
      btnCompletar.addEventListener("click", () => {
        toggleMedicamentoEstado(id);
      });
    }

    if (btnEditar) {
      btnEditar.addEventListener("click", () => {
        console.log(
          `Botón de editar clicado para el medicamento con ID: ${id}`
        );
        openEditModal(id);
      });
    }

    if (btnEliminar) {
      btnEliminar.addEventListener("click", () => {
        openDeleteConfirmModal(id);
      });
    }
  }

  function applyFilter() {
    const recordatorioItems = document.querySelectorAll(".recordatorio-item");

    recordatorioItems.forEach((item) => {
      const estado = item.getAttribute("data-estado");

      if (
        currentFilter === "todos" ||
        (currentFilter === "pendientes" && estado === "pendiente") ||
        (currentFilter === "completados" && estado === "completado")
      ) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  }

  function updateEstadisticas() {
    if (
      !porcentajeCumplimientoElement ||
      !totalMedicamentosElement ||
      !totalDosisElement
    )
      return;

    // Contar medicamentos únicos
    const medicamentosUnicos = new Set(medicamentos.map((med) => med.id)).size;

    // Contar dosis diarias
    const medicamentosHoy = getMedicamentosPorDia(new Date());
    const dosisDiarias = medicamentosHoy.length;

    // Calcular porcentaje de cumplimiento
    const completados = medicamentosHoy.filter(
      (med) => med.estado === "completado"
    ).length;
    let porcentaje = 0;
    if (dosisDiarias > 0) {
      porcentaje = Math.round((completados / dosisDiarias) * 100);
    }

    // Actualizar elementos
    porcentajeCumplimientoElement.textContent = porcentaje + "%";
    totalMedicamentosElement.textContent = medicamentosUnicos;
    totalDosisElement.textContent = dosisDiarias;
  }

  // Funciones de almacenamiento local
  async function saveMedicamentos() {
    try {
      // Transformar los medicamentos al formato de la API
      const medicamentosAPI = medicamentos.map((med) => ({
        nombre: med.nombre,
        tipoMedicamento: med.tipo,
        dosis: med.dosis,
        horaToma: med.horas[0],
        notas: med.instrucciones,
        fechaInicio: med.inicio,
        fechaFin: med.fin || null,
      }));

      const response = await fetch("/api/medicamentos/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medicamentosAPI),
      });

      if (!response.ok) {
        throw new Error("Error al guardar los medicamentos");
      }
    } catch (error) {
      console.error("Error:", error);
      // Si hay error, guardar en localStorage como respaldo
      localStorage.setItem("medicamentos", JSON.stringify(medicamentos));
    }
  }

  async function loadMedicamentos() {
    try {
      const medicamentosAPI = await getMedicamentos();
      // console.log('Datos obtenidos de la API:', medicamentosAPI); // Verificar los datos obtenidos

      // Transformar los datos al formato esperado
      medicamentos = medicamentosAPI
        .filter((med) => {
          const tieneHora = med.horaToma && med.horaToma.trim() !== ""; // Verificar que horaToma exista y no esté vacía
          if (!tieneHora) {
            console.warn(
              `El medicamento ${med.nombre} fue excluido porque no tiene hora definida.`
            );
          }
          return tieneHora; // Filtrar medicamentos sin hora
        })
        .map((med) => {
          // console.log(`Transformando medicamento: ${med.nombre}`);
          return {
            id: med.idMedicamentos,
            nombre: med.nombre,
            tipo: med.tipoMedicamento.toLowerCase(),
            dosis: med.dosis,
            horas: [med.horaToma.slice(0, 5)], // Convertir horaToma de HH:MM:SS a HH:MM y almacenarla en un array
            instrucciones: med.notas || "",
            inicio: med.fechaInicio || null,
            fin: med.fechaFin || null,
            estado: "pendiente", // Asignar un estado por defecto
          };
        });

      // console.log("Medicamentos cargados después de la transformación:", medicamentos);
    } catch (error) {
      console.error("Error al cargar medicamentos desde la API:", error);
      medicamentos = []; // Si hay un error, inicializar como un array vacío
    }
  }

  // Funciones para el mini calendario
  function renderMiniCalendario() {
    if (!miniCalendario) return;

    miniCalendario.innerHTML = "";

    // Añadir encabezados de días de la semana
    const diasSemana = ["D", "L", "M", "X", "J", "V", "S"];
    diasSemana.forEach((dia) => {
      const diaHeader = document.createElement("div");
      diaHeader.className = "calendar-header";
      diaHeader.textContent = dia;
      miniCalendario.appendChild(diaHeader);
    });

    // Obtener el primer día del mes
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    // Obtener el último día del mes
    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Añadir espacios en blanco para el primer día del mes
    const primerDiaSemana = firstDay.getDay();
    for (let i = 0; i < primerDiaSemana; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day otro-mes";
      emptyDay.textContent = "-";
      miniCalendario.appendChild(emptyDay);
    }

    // Añadir días del mes
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = document.createElement("div");
      day.className = "calendar-day";
      day.textContent = i;

      // Verificar si es hoy
      const today = new Date();
      if (
        i === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      ) {
        day.classList.add("today");
      }

      miniCalendario.appendChild(day);
    }
  }

  function getMedicamentosPorDia(date) {
    // Filtrar medicamentos según la fecha
    return medicamentos.flatMap((med) => {
      // Validar que `horas` esté definido y sea un array
      if (!med.horas || !Array.isArray(med.horas)) {
        console.warn(
          `El medicamento ${med.nombre} no tiene horas definidas correctamente`
        );
        return [];
      }

      // Para cada hora del medicamento, crear una entrada
      return med.horas.map((hora) => ({
        ...med,
        hora: hora, // Usar la hora normalizada (HH:MM)
      }));
    });
  }

  // Exponer la función globalmente
  window.getMedicamentosPorDia = getMedicamentosPorDia;

  // Funciones de utilidad
  function getMedicamentoById(id) {
    console.log("Buscando medicamento con ID:", id);
    console.log("Array de medicamentos:", medicamentos); // Verificar el contenido del array
    return medicamentos.find((med) => med.id === Number(id));
  }

  function getMedicamentoEstado(id) {
    const medicamento = getMedicamentoById(id);
    return medicamento ? medicamento.estado : "pendiente";
  }

  async function toggleMedicamentoEstado(id) {
    const medicamento = getMedicamentoById(id);
    if (medicamento) {
      const session = window.auth.getCurrentUser();
      if (!session) {
        console.error("No hay sesión activa");
        return;
      }

      // Cambiar el estado
      const nuevoEstado = medicamento.estado === "pendiente" ? "completado" : "pendiente";
      medicamento.estado = nuevoEstado;

      // Registrar o actualizar en HistorialTomas
      try {
        const response = await fetch(`${API_URL}/api/HistorialTomas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            idUsuario: session.userId,
            idMedicamento: medicamento.id,
            fechaProgramada: medicamento.inicio || new Date().toISOString(),
            fechaToma: nuevoEstado === "completado" ? new Date().toISOString() : null,
            estadoToma: nuevoEstado,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al registrar o actualizar en HistorialTomas");
        }

        console.log(`Historial actualizado: Medicamento ${medicamento.nombre} marcado como ${nuevoEstado}`);
      } catch (error) {
        console.error("Error al actualizar el historial:", error);
      }

      // Actualizar la interfaz
      renderMedicamentos();
      saveMedicamentos();
      updateEstadisticas();
    }
  }

  // Solicitar permiso para notificaciones
  if (window.medicationNotifications) {
    window.medicationNotifications.requestPermission();
  }

  // Cargar medicamentos y configurar la aplicación
  await loadMedicamentos();
  renderMedicamentos();
  renderMiniCalendario();
  updateEstadisticas();

  // Iniciar servicio de notificaciones
  if (window.medicationNotifications) {
    window.medicationNotifications.startNotificationService();
  }
});
