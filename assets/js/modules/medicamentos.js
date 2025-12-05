const API_URL = 'https://api.dariblue.dev';

export async function saveMedicamento(medicamento) {
  try {
    const session = window.auth.getCurrentUser();
    if (!session) {
      console.error('No hay sesión activa');
      throw new Error('No hay sesión activa');
    }

    const medicamentoData = {
      idUsuario: session.userId,
      nombre: medicamento.nombre,
      tipoMedicamento: medicamento.tipoMedicamento,
      dosis: medicamento.dosis,
      horaToma: medicamento.horaToma,
      notas: medicamento.notas || '',
      fechaInicio: medicamento.fechaInicio,
      fechaFin: medicamento.fechaFin || null,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };

    // console.log('Cuerpo de la solicitud:', medicamentoData);

    const response = await fetch(`${API_URL}/api/Medicamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(medicamentoData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error de la API:', errorData || response.statusText);
      throw new Error(errorData?.message || 'Error al guardar el medicamento');
    }

    const savedMedicamento = await response.json();
    // console.log('Medicamento guardado:', savedMedicamento);
    return savedMedicamento;
  } catch (error) {
    console.error('Error en saveMedicamento:', error);
    throw error;
  }
}

export async function deleteMedicamento(id) {
  try {
    const session = window.auth.getCurrentUser();
    if (!session) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/api/Medicamentos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el medicamento');
    }

    return true;
  } catch (error) {
    console.error('Error en deleteMedicamento:', error);
    throw error;
  }
}

export async function getMedicamentos() {
  try {
    const session = window.auth.getCurrentUser();
    if (!session) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_URL}/api/Medicamentos/usuario/${session.userId}`, {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener los medicamentos');
    }

    const medicamentos = await response.json();
    // console.log('Medicamentos obtenidos:', medicamentos);
    return medicamentos;
  } catch (error) {
    console.error('Error en getMedicamentos:', error);
    throw error;
  }
}

export async function saveMedicamentosBatch(medicamentos) {
  try {
    const session = window.auth.getCurrentUser();
    if (!session) {
      throw new Error('No hay sesión activa');
    }

    const medicamentosAPI = medicamentos.map(med => ({
      idUsuario: session.userId,
      nombre: med.nombre,
      tipoMedicamento: med.tipo,
      dosis: med.dosis,
      horaToma: med.horas[0],
      notas: med.instrucciones || '',
      fechaInicio: med.inicio,
      fechaFin: med.fin || null
    }));

    const response = await fetch(`${API_BASE_URL}/api/medicamentos/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(medicamentosAPI)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al guardar los medicamentos');
    }

    const savedMedicamentos = await response.json();
    
    return savedMedicamentos.map(med => ({
      id: med.idMedicamentos.toString(),
      nombre: med.nombre,
      tipo: med.tipoMedicamento,
      dosis: med.dosis,
      horas: [med.horaToma],
      instrucciones: med.notas,
      inicio: med.fechaInicio,
      fin: med.fechaFin,
      estado: 'pendiente'
    }));
  } catch (error) {
    console.error('Error al guardar los medicamentos:', error);
    throw error;
  }
}

export async function updateMedicamento(medicamento) {
  try {
    const session = window.auth.getCurrentUser();
    if (!session) {
      throw new Error('No hay sesión activa');
    }

    const medicamentoData = {
      idUsuario: session.userId,
      nombre: medicamento.nombre,
      tipoMedicamento: medicamento.tipoMedicamento,
      dosis: medicamento.dosis,
      horaToma: medicamento.horaToma,
      notas: medicamento.notas || '',
      fechaInicio: medicamento.fechaInicio,
      fechaFin: medicamento.fechaFin || null,
      fechaModificacion: new Date().toISOString()
    };

    const response = await fetch(`${API_URL}/api/Medicamentos/${medicamento.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(medicamentoData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Error al actualizar el medicamento');
    }

    const updatedMedicamento = await response.json();
    return updatedMedicamento;
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    throw error;
  }
}

export async function saveOrUpdateMedicamento(medicamento) {
  if (medicamento.id) {
    return updateMedicamento(medicamento); // Actualizar si tiene ID
  } else {
    return saveMedicamento(medicamento); // Crear si no tiene ID
  }
}
