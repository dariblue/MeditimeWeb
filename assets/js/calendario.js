const API_URL = "https://api.dariblue.dev";

let session;

document.addEventListener("DOMContentLoaded", async () => {
  // Recuperar la sesión desde localStorage
  const sessionData = localStorage.getItem("meditime_session");
  if (!sessionData) {
    // Si no hay sesión, redirigir al inicio de sesión
    window.location.href = "/pages/login";
    return;
  }

  // Parsear la sesión
  session = JSON.parse(sessionData);

  // Verificar que la sesión tenga los datos necesarios
  if (!session.userId || !session.token) {
    console.error("Sesión inválida:", session);
    window.location.href = "/pages/login";
    return;
  }

  // Referencias a elementos del DOM
  const calendarioGrid = document.getElementById("calendario-grid")
  const currentMonthElement = document.getElementById("current-month")
  const prevMonthBtn = document.getElementById("prev-month")
  const nextMonthBtn = document.getElementById("next-month")
  const currentDayElement = document.getElementById("current-day")
  const prevDayBtn = document.getElementById("prev-day")
  const nextDayBtn = document.getElementById("next-day")
  const medicamentosDiaContainer = document.getElementById("medicamentos-dia")
  const proximosRecordatoriosContainer = document.getElementById("proximos-recordatorios")
  const totalMedicamentosElement = document.getElementById("total-medicamentos")
  const totalDosisElement = document.getElementById("total-dosis")
  const porcentajeCompletadoElement = document.getElementById("porcentaje-completado")
  const vistaSemanalGrid = document.getElementById("vista-semanal-grid")
  const diasSemanaContainer = document.getElementById("dias-semana")
  const detalleModal = document.getElementById("detalle-modal")
  const detalleTitulo = document.getElementById("detalle-titulo")
  const detalleContenido = document.getElementById("detalle-contenido")
  const cerrarDetalleBtn = document.getElementById("cerrar-detalle")
  const editarMedicamentoBtn = document.getElementById("editar-medicamento")
  const closeModalBtn = document.querySelector(".close-modal")
  const btnImprimir = document.getElementById("btn-imprimir")
  const btnExportar = document.getElementById("btn-exportar")
  const btnSincronizar = document.getElementById("btn-sincronizar")

  // Estado de la aplicación
  let currentDate = new Date()
  let selectedDate = new Date()
  let medicamentos = [] // Array para almacenar todos los medicamentos

  // Inicialización
  try {
    await loadMedicamentos(); // Cargar medicamentos desde la API
    renderCalendario();
    renderDetalleDia();
    renderProximosRecordatorios();
    renderVistaSemanal();
    updateEstadisticas();
  } catch (error) {
    console.error("Error durante la inicialización:", error);
  }

  // Manejadores de eventos para navegación
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1)
      renderCalendario()
    })
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1)
      renderCalendario()
    })
  }

  if (prevDayBtn) {
    prevDayBtn.addEventListener("click", () => {
      selectedDate.setDate(selectedDate.getDate() - 1)
      renderDetalleDia()
      highlightSelectedDay()
    })
  }

  if (nextDayBtn) {
    nextDayBtn.addEventListener("click", () => {
      selectedDate.setDate(selectedDate.getDate() + 1)
      renderDetalleDia()
      highlightSelectedDay()
    })
  }

  // Manejadores de eventos para modales
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal)
  }

  if (cerrarDetalleBtn) {
    cerrarDetalleBtn.addEventListener("click", closeModal)
  }

  if (editarMedicamentoBtn) {
    editarMedicamentoBtn.addEventListener("click", () => {
      closeModal()
      // Aquí iría la lógica para redirigir a la edición del medicamento
      window.location.href = "recordatorios"
    })
  }

  // Cerrar modal al hacer clic fuera del contenido
  window.addEventListener("click", (event) => {
    if (event.target === detalleModal) {
      closeModal()
    }
  })

  // Manejadores para botones de acción
  if (btnImprimir) {
    btnImprimir.addEventListener("click", imprimirCalendario)
  }

  if (btnExportar) {
    btnExportar.addEventListener("click", exportarDatos)
  }

  if (btnSincronizar) {
    btnSincronizar.addEventListener("click", sincronizarDatos)
  }

  // Funciones
  function renderCalendario() {
    if (!calendarioGrid || !currentMonthElement) return;

    // Actualizar el título del mes
    const options = { month: "long", year: "numeric" };
    currentMonthElement.textContent = currentDate.toLocaleDateString("es-ES", options);

    // Limpiar el grid
    calendarioGrid.innerHTML = "";

    // Obtener el primer y último día del mes actual
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Obtener el día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
    const firstDayIndex = firstDay.getDay();

    // Calcular días del mes anterior para completar la primera semana
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

    // Días del mes anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      const diaElement = createDayElement(date, true);
      calendarioGrid.appendChild(diaElement);
    }

    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const diaElement = createDayElement(date, false);
      calendarioGrid.appendChild(diaElement);
    }

    // Calcular días del mes siguiente para completar la última semana
    const lastDayIndex = lastDay.getDay();
    const nextDays = 6 - lastDayIndex;

    // Días del mes siguiente
    for (let i = 1; i <= nextDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      const diaElement = createDayElement(date, true);
      calendarioGrid.appendChild(diaElement);
    }

    // Resaltar el día seleccionado
    highlightSelectedDay();
  }

  function createDayElement(date, isOtherMonth) {
    const diaElement = document.createElement("div");
    diaElement.className = "dia-calendario";
  
    // Añadir clase para días de otros meses
    if (isOtherMonth) {
      diaElement.classList.add("otro-mes");
    }
  
    // Verificar si es hoy
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      diaElement.classList.add("hoy");
    }
  
    // Verificar si es el día seleccionado
    if (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    ) {
      diaElement.classList.add("seleccionado");
    }
  
    // Añadir el número del día
    const numeroDia = document.createElement("div");
    numeroDia.className = "numero-dia";
    numeroDia.textContent = date.getDate();
    diaElement.appendChild(numeroDia);
  
    // Añadir contador de medicamentos del día
    const medicamentosDia = getMedicamentosPorDia(date);
    if (medicamentosDia.length > 0) {
      const contadorContainer = document.createElement("div");
      contadorContainer.className = "medicamentos-dia-contador";
      
      const contador = document.createElement("div");
      contador.className = "medicamento-count";
      const texto = medicamentosDia.length === 1 ? "medicamento" : "medicamentos";
      contador.textContent = `${medicamentosDia.length} ${texto}`;
      
      contadorContainer.appendChild(contador);
      diaElement.appendChild(contadorContainer);
    }
  
    // Añadir evento de clic para seleccionar el día
    diaElement.addEventListener("click", () => {
      selectedDate = new Date(date);
      renderDetalleDia();
      highlightSelectedDay();
    });
  
    return diaElement;
  }
  

  function highlightSelectedDay() {
    // Quitar la clase 'seleccionado' de todos los días
    const allDays = document.querySelectorAll(".dia-calendario")
    allDays.forEach((day) => day.classList.remove("seleccionado"))

    // Añadir la clase 'seleccionado' al día seleccionado
    const selectedDay = document.querySelector(
      `.dia-calendario[data-date="${selectedDate.toISOString().split("T")[0]}"]`,
    )
    if (selectedDay) {
      selectedDay.classList.add("seleccionado")
    }
  }

  function renderDetalleDia() {
    if (!medicamentosDiaContainer || !currentDayElement) return

    // Actualizar el título del día
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    const formattedDate = selectedDate.toLocaleDateString("es-ES", options)
    currentDayElement.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

    // Obtener medicamentos para el día seleccionado
    const medicamentosDia = getMedicamentosPorDia(selectedDate)

    // Si no hay medicamentos, mostrar mensaje
    if (medicamentosDia.length === 0) {
      medicamentosDiaContainer.innerHTML = `
        <div class="no-medicamentos">
          <i class="fas fa-calendar-times"></i>
          <p>No hay medicamentos programados para este día</p>
          <a href="recordatorios" class="btn btn-primary">Añadir Medicamento</a>
        </div>
      `
      return
    }

    // Agrupar medicamentos por hora
    const medicamentosPorHora = agruparMedicamentosPorHora(medicamentosDia)

    // Limpiar el contenedor
    medicamentosDiaContainer.innerHTML = ""

    // Renderizar medicamentos agrupados por hora
    Object.keys(medicamentosPorHora)
      .sort()
      .forEach((hora) => {
        const medicamentosHora = medicamentosPorHora[hora]

        const grupoHora = document.createElement("div")
        grupoHora.className = "grupo-hora"

        const horaHeader = document.createElement("div")
        horaHeader.className = "hora-header"
        horaHeader.innerHTML = `
        <div class="hora">${formatHora(hora)}</div>
        <div class="cantidad">${medicamentosHora.length} medicamento${medicamentosHora.length > 1 ? "s" : ""}</div>
      `

        const medicamentosLista = document.createElement("div")
        medicamentosLista.className = "medicamentos-lista"

        medicamentosHora.forEach((med) => {
          const medicamentoCard = document.createElement("div")
          medicamentoCard.className = "medicamento-card"
          medicamentoCard.innerHTML = `
          <h4>${med.nombre}</h4>
          <div class="medicamento-info">
            <div class="medicamento-dosis">${med.dosis}</div>
            <div class="medicamento-frecuencia">${getFrecuenciaTexto(med)}</div>
          </div>
          ${med.instrucciones ? `<div class="medicamento-instrucciones">${med.instrucciones}</div>` : ""}
          <div class="medicamento-acciones">
            <button class="btn-accion btn-completar" data-id="${med.id}">
              <i class="fas fa-check"></i> Completar
            </button>
            <button class="btn-accion btn-detalles" data-id="${med.id}">
              <i class="fas fa-info-circle"></i> Detalles
            </button>
          </div>
        `

          // Añadir evento para mostrar detalles
          medicamentoCard.querySelector(".btn-detalles").addEventListener("click", () => {
            showMedicamentoDetalle(med)
          })

          // Añadir evento para marcar como completado
          medicamentoCard.querySelector(".btn-completar").addEventListener("click", () => {
            completarMedicamento(med.id)
          })

          medicamentosLista.appendChild(medicamentoCard)
        })

        grupoHora.appendChild(horaHeader)
        grupoHora.appendChild(medicamentosLista)
        medicamentosDiaContainer.appendChild(grupoHora)
      })
  }

  function renderProximosRecordatorios() {
    if (!proximosRecordatoriosContainer) return

    // Obtener próximos 5 días
    const proximosDias = []
    const today = new Date()

    for (let i = 0; i < 5; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      proximosDias.push(date)
    }

    // Obtener medicamentos para los próximos días
    let proximosMedicamentos = []

    proximosDias.forEach((date) => {
      const medicamentosDia = getMedicamentosPorDia(date)
      medicamentosDia.forEach((med) => {
        proximosMedicamentos.push({
          ...med,
          fecha: new Date(date),
        })
      })
    })

    // Ordenar por fecha y hora
    proximosMedicamentos.sort((a, b) => {
      if (a.fecha.getTime() !== b.fecha.getTime()) {
        return a.fecha.getTime() - b.fecha.getTime()
      }
      return a.hora.localeCompare(b.hora)
    })

    // Limitar a 10 medicamentos
    proximosMedicamentos = proximosMedicamentos.slice(0, 10)

    // Si no hay medicamentos, mostrar mensaje
    if (proximosMedicamentos.length === 0) {
      proximosRecordatoriosContainer.innerHTML = `
        <div class="no-recordatorios">
          <i class="fas fa-calendar-day"></i>
          <p>No hay recordatorios próximos</p>
        </div>
      `
      return
    }

    // Limpiar el contenedor
    proximosRecordatoriosContainer.innerHTML = ""

    // Renderizar próximos medicamentos
    proximosMedicamentos.forEach((med) => {
      const options = { weekday: "short", day: "numeric" }
      const formattedDate = med.fecha.toLocaleDateString("es-ES", options)

      const proximoItem = document.createElement("div")
      proximoItem.className = "proximo-item"
      proximoItem.innerHTML = `
        <div class="proximo-fecha">${formattedDate}</div>
        <div class="proximo-info">
          <h4>${formatHora(med.hora)} - ${med.nombre}</h4>
          <p>${med.dosis}</p>
        </div>
      `

      // Añadir evento para seleccionar el día
      proximoItem.addEventListener("click", () => {
        selectedDate = new Date(med.fecha)
        renderDetalleDia()
        highlightSelectedDay()

        // Si el mes es diferente, actualizar el calendario
        if (
          selectedDate.getMonth() !== currentDate.getMonth() ||
          selectedDate.getFullYear() !== currentDate.getFullYear()
        ) {
          currentDate = new Date(selectedDate)
          renderCalendario()
        }
      })

      proximosRecordatoriosContainer.appendChild(proximoItem)
    })
  }

  function renderVistaSemanal() {
    if (!vistaSemanalGrid || !diasSemanaContainer) return

    // Limpiar contenedores
    vistaSemanalGrid.innerHTML = ""
    diasSemanaContainer.innerHTML = ""

    // Obtener el primer día de la semana (domingo)
    const firstDayOfWeek = new Date(selectedDate)
    const day = selectedDate.getDay() // 0 = Domingo, 1 = Lunes, etc.
    firstDayOfWeek.setDate(selectedDate.getDate() - day)

    // Renderizar encabezados de días
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek)
      date.setDate(firstDayOfWeek.getDate() + i)

      const options = { weekday: "short", day: "numeric" }
      const formattedDate = date.toLocaleDateString("es-ES", options)

      const diaHeader = document.createElement("div")
      diaHeader.className = "dia-header"
      diaHeader.textContent = formattedDate

      // Resaltar el día actual
      const today = new Date()
      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        diaHeader.classList.add("today")
      }

      diasSemanaContainer.appendChild(diaHeader)
    }

    // Definir horas para mostrar (de 6:00 a 22:00)
    const horas = []
    for (let i = 6; i <= 22; i++) {
      horas.push(`${i.toString().padStart(2, "0")}:00`)
    }

    // Renderizar filas de horas
    horas.forEach((hora) => {
      const horaRow = document.createElement("div")
      horaRow.className = "hora-row"

      // Celda de hora
      const horaCell = document.createElement("div")
      horaCell.className = "hora-cell"
      horaCell.textContent = formatHora(hora)
      vistaSemanalGrid.appendChild(horaCell)

      // Celdas de días
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek)
        date.setDate(firstDayOfWeek.getDate() + i)

        const diaCell = document.createElement("div")
        diaCell.className = "dia-cell"

        // Obtener medicamentos para esta hora y día
        const medicamentosDia = getMedicamentosPorDia(date)
        const medicamentosHora = medicamentosDia.filter((med) => {
          const medHora = med.hora.split(":")[0].padStart(2, "0")
          return medHora === hora.split(":")[0]
        })

        // Renderizar medicamentos
        medicamentosHora.forEach((med) => {
          const medicamentoMini = document.createElement("div")
          medicamentoMini.className = "medicamento-mini"
          medicamentoMini.innerHTML = `
            <span class="medicamento-dot"></span>
            ${med.nombre}
          `

          // Añadir evento para mostrar detalles
          medicamentoMini.addEventListener("click", () => {
            showMedicamentoDetalle(med)
          })

          diaCell.appendChild(medicamentoMini)
        })

        vistaSemanalGrid.appendChild(diaCell)
      }
    })
  }

  function updateEstadisticas() {
    if (!totalMedicamentosElement || !totalDosisElement || !porcentajeCompletadoElement) return

    // Contar medicamentos únicos
    const medicamentosUnicos = new Set(medicamentos.map((med) => med.id)).size

    // Contar dosis totales en el mes actual
    let dosisTotales = 0
    let dosisCompletadas = 0

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
      const medicamentosDia = getMedicamentosPorDia(d)
      dosisTotales += medicamentosDia.length

      // Contar completados (simulado)
      if (d <= new Date()) {
        // Asumimos que los días pasados tienen un 80% de completitud
        dosisCompletadas += Math.round(medicamentosDia.length * 0.8)
      }
    }

    // Calcular porcentaje
    const porcentaje = dosisTotales > 0 ? Math.round((dosisCompletadas / dosisTotales) * 100) : 0

    // Actualizar elementos
    totalMedicamentosElement.textContent = medicamentosUnicos
    totalDosisElement.textContent = dosisTotales
    porcentajeCompletadoElement.textContent = `${porcentaje}%`
  }

  function showMedicamentoDetalle(medicamento) {
    if (!detalleModal || !detalleTitulo || !detalleContenido) return

    // Actualizar título
    detalleTitulo.textContent = medicamento.nombre

    // Actualizar contenido
    detalleContenido.innerHTML = `
      <div class="detalle-item">
        <div class="detalle-label">Dosis:</div>
        <div class="detalle-valor">${medicamento.dosis}</div>
      </div>
      <div class="detalle-item">
        <div class="detalle-label">Hora:</div>
        <div class="detalle-valor">${formatHora(medicamento.hora)}</div>
      </div>
      <div class="detalle-item">
        <div class="detalle-label">Frecuencia:</div>
        <div class="detalle-valor">${getFrecuenciaTexto(medicamento)}</div>
      </div>
      ${
        medicamento.instrucciones
          ? `
        <div class="detalle-item">
          <div class="detalle-label">Instrucciones:</div>
          <div class="detalle-valor">${medicamento.instrucciones}</div>
        </div>
      `
          : ""
      }
      ${
        medicamento.inicio
          ? `
        <div class="detalle-item">
          <div class="detalle-label">Fecha de inicio:</div>
          <div class="detalle-valor">${new Date(medicamento.inicio).toLocaleDateString("es-ES")}</div>
        </div>
      `
          : ""
      }
      ${
        medicamento.fin
          ? `
        <div class="detalle-item">
          <div class="detalle-label">Fecha de finalización:</div>
          <div class="detalle-valor">${new Date(medicamento.fin).toLocaleDateString("es-ES")}</div>
        </div>
      `
          : ""
      }
    `

    // Mostrar modal
    detalleModal.classList.add("active")
  }

  function closeModal() {
    if (detalleModal) {
      detalleModal.classList.remove("active")
    }
  }

  function completarMedicamento(id) {
    // Buscar el medicamento
    const medicamento = medicamentos.find((med) => med.id === id)
    if (medicamento) {
      // Cambiar el estado
      medicamento.estado = medicamento.estado === "completado" ? "pendiente" : "completado"

      // Guardar cambios
      saveMedicamentos()

      // Actualizar la interfaz
      renderDetalleDia()
      updateEstadisticas()
    }
  }

  function imprimirCalendario() {
    window.print()
  }

  function exportarDatos() {
    // Crear un objeto con los datos a exportar
    const datos = {
      medicamentos: medicamentos,
      fecha: new Date().toISOString(),
    }

    // Convertir a JSON
    const jsonData = JSON.stringify(datos, null, 2)

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

  function sincronizarDatos() {
    // Aquí iría la lógica para sincronizar datos
    // Por ahora, solo mostramos un mensaje
    alert("Sincronización completada correctamente")
  }

  // Funciones de utilidad
  async function loadMedicamentos() {
    try {
      const response = await fetch(`${API_URL}/api/Medicamentos/usuario/${session.userId}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener los medicamentos desde la API');
      }
  
      const medicamentosAPI = await response.json();
  
      // Transformar los datos al formato esperado
      medicamentos = medicamentosAPI.map((med) => ({
        id: med.idMedicamentos,
        nombre: med.nombre,
        tipo: med.tipoMedicamento.toLowerCase(),
        dosis: med.dosis,
        horas: med.horas || [med.horaToma],
        instrucciones: med.notas || "",
        inicio: med.fechaInicio || null,
        fin: med.fechaFin || null,
        frecuencia: med.frecuencia || "diario",
        diasSemana: med.diasSemana || [],
        estado: med.estado || "pendiente",
      }));
  
      console.log("Medicamentos cargados:", medicamentos);
    } catch (error) {
      console.error("Error al cargar medicamentos desde la API:", error);
      medicamentos = []; // Si hay un error, inicializar como un array vacío
    }
  }
  
  function saveMedicamentos() {
    localStorage.setItem("medicamentos", JSON.stringify(medicamentos))
  }

  function getMedicamentosPorDia(date) {
    // Filtrar medicamentos según la fecha y frecuencia
    return medicamentos.flatMap((med) => {
      // Verificar si el medicamento debe tomarse en esta fecha según su frecuencia
      if (debeTomarseMedicamento(med, date)) {
        // Para cada hora del medicamento, crear una entrada
        return med.horas.map((hora) => ({
          ...med,
          hora: hora,
        }))
      }
      return []
    })
  }

  function debeTomarseMedicamento(medicamento, date) {
    const fechaDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (medicamento.inicio) {
      const inicioDate = new Date(medicamento.inicio);
      if (fechaDate < inicioDate) return false;
    }

    if (medicamento.fin) {
      const finDate = new Date(medicamento.fin);
      if (fechaDate > finDate) return false;
    }

    switch (medicamento.frecuencia) {
      case "diario":
        return true;
      case "dias-alternos":
        const refDate = new Date(2025, 0, 1);
        const diffTime = Math.abs(fechaDate.getTime() - refDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays % 2 === 0;
      case "semanal":
        const diaSemana = fechaDate.getDay();
        return medicamento.diasSemana.includes(diaSemana);
      case "personalizado":
        return true; // Implementar lógica personalizada si es necesario
      default:
        return false;
    }
  }

  function agruparMedicamentosPorHora(medicamentos) {
    const grupos = {}

    medicamentos.forEach((med) => {
      if (!grupos[med.hora]) {
        grupos[med.hora] = []
      }
      grupos[med.hora].push(med)
    })

    return grupos
  }

  function getFrecuenciaTexto(medicamento) {
    switch (medicamento.frecuencia) {
      case "diario":
        return "Todos los días"

      case "dias-alternos":
        return "Días alternos"

      case "semanal":
        if (medicamento.diasSemana && medicamento.diasSemana.length > 0) {
          const diasTexto = medicamento.diasSemana.map((dia) => getDiaSemanaName(dia)).join(", ")
          return `Semanal (${diasTexto})`
        }
        return "Semanal"

      case "personalizado":
        return "Personalizado"

      default:
        return medicamento.frecuencia
    }
  }

  function getDiaSemanaName(dia) {
    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    return diasSemana[dia].charAt(0).toUpperCase() + diasSemana[dia].slice(1)
  }

  function formatHora(hora) {
    if (!hora) return ""

    // Convertir de formato 24h a 12h
    const [hours, minutes] = hora.split(":")
    const h = Number.parseInt(hours, 10)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12

    return `${hour12}:${minutes} ${ampm}`
  }
})
