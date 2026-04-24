import { hideMessage, showMessage, mostrarMensajeGlobal } from './perfil-ui.js';
import { updateSession, actualizarDatosPersonales, actualizarAvatar } from './perfil-api.js';

export async function handleDatosPersonalesSubmit(e, userData, onUserDataUpdate) {
    e.preventDefault();
    hideMessage("datos-error");
    hideMessage("datos-success");

    const formData = new FormData(e.target);
    const datosAPI = {
        nombre: formData.get("nombre"),
        apellidos: formData.get("apellidos"),
        email: formData.get("email"),
        telefono: formData.get("telefono") || null,
        fechaNacimiento: formData.get("fecha_nacimiento") || null,
        domicilio: formData.get("domicilio") || null
    };

    try {
        await actualizarDatosPersonales(userData.iD_Usuario, datosAPI);

        // Actualizar estado local
        const updatedUserData = {
            ...userData,
            nombre: datosAPI.nombre,
            apellidos: datosAPI.apellidos,
            email: datosAPI.email,
            telefono: datosAPI.telefono,
            fecha_Nacimiento: datosAPI.fechaNacimiento,
            domicilio: datosAPI.domicilio
        };
        onUserDataUpdate(updatedUserData);
        updateSession({ nombre: datosAPI.nombre, apellidos: datosAPI.apellidos, email: datosAPI.email });
        mostrarMensajeGlobal("Datos actualizados correctamente", "success");
    } catch (error) {
        console.error("Error:", error);
        mostrarMensajeGlobal(error.message || "Error al actualizar datos", "error");
    }
}

export function handleAvatarChange(e, userData) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
        alert("Por favor, seleccione una imagen válida");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        const avatarPreview = document.getElementById("avatar-preview");
        if (avatarPreview) avatarPreview.src = ev.target.result;

        try {
            await actualizarAvatar(userData.iD_Usuario, ev.target.result);
            mostrarMensajeGlobal("Avatar actualizado correctamente", "success");
        } catch (error) {
            console.error("Error:", error);
            mostrarMensajeGlobal("Error al subir el avatar: " + error.message, "error");
        }
    };
    reader.readAsDataURL(file);
}
