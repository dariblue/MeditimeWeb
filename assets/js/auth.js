(function () {
  const API_URL = 'https://api.dariblue.dev';
  const SESSION_KEY = 'meditime_session';

  // Funciones de utilidad
  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }

  function hideError(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  function showSuccess(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }

  function handleError(error) {
    console.error('Error:', error);
    throw error;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function validatePassword(password) {
    return password.length >= 6;
  }

  // Funciones de sesión
  function saveSession(sessionData) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      // console.log('Sesión guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la sesión:', error);
    }
  }

  function getSession() {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error al obtener la sesión:', error);
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem('meditime_session'); // Elimina la sesión del almacenamiento local
      // console.log('Sesión eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la sesión:', error);
    }
  }

  // Función de login
  async function login(email, password) {
    try {
      if (!validateEmail(email)) {
        throw new Error('Email inválido');
      }

      // console.log('Iniciando proceso de login...');
      // console.log('Credenciales:', { email, password: '***' });

      const loginResponse = await fetch(`${API_URL}/Usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          contrasena: password
        })
      });

      // console.log('Respuesta del servidor:', loginResponse);

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        console.error('Error detallado:', errorData);
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const data = await loginResponse.json();
      // console.log('Datos de login:', data);

      // Almacenar la sesión
      const session = {
        token: data.token,
        userId: data.idUsuario || data.id,
        email: data.email,
        nombre: data.nombre,
        apellidos: data.apellidos,
        isAdmin: data.isAdmin === 1
      };

      localStorage.setItem('meditime_session', JSON.stringify(session));
      // console.log('Sesión almacenada:', session);

      return session;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  async function register(userData) {
    try {
      if (!validateEmail(userData.email)) {
        throw new Error('Email inválido');
      }
      if (!validatePassword(userData.password)) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // console.log('Registrando usuario:', userData);

      let response;
      try {
        response = await fetch(`${API_URL}/Usuarios/registro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            nombre: userData.nombre,
            apellidos: userData.apellidos,
            email: userData.email,
            contrasena: userData.password,
            telefono: userData.telefono || '',
            fecha_Nacimiento: userData.fecha_nacimiento || null,
            domicilio: userData.domicilio || '',
            notificaciones: userData.notificaciones || false
          })
        });
      } catch (error) {
        console.error('Error de conexión:', error);
        throw new Error('Error de conexión. Por favor, verifique su conexión a internet.');
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al registrar usuario');
      }

      return responseData;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  // Función de logout
  function logout() {
    clearSession(); // Elimina la sesión del almacenamiento local
    window.location.href = '/pages/login.html'; // Redirige al usuario a la página de inicio de sesión
  }

  // Función para verificar si el usuario está autenticado
  function isAuthenticated() {
    return !!getSession();
  }

  // Función para obtener el token
  function getToken() {
    const session = getSession();
    return session ? session.token : null;
  }

  // Función para obtener el usuario actual
  function getCurrentUser() {
    try {
      const sessionStr = localStorage.getItem('meditime_session');
      if (!sessionStr) {
        return null;
      }

      const session = JSON.parse(sessionStr);

      if (!session || !session.token || !session.userId) {
        console.error('Sesión inválida:', session);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error al obtener la sesión:', error);
      return null;
    }
  }

  // Función para inicializar el formulario de login
  function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    const errorElement = document.getElementById('login-error');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember')?.checked || false;

        // Limpiar mensajes de error anteriores
        if (errorElement) {
          errorElement.style.display = 'none';
          errorElement.textContent = '';
        }

        try {
          const user = await login(email, password);

          // Verificar que la sesión se guardó correctamente
          const session = getSession();

          if (!session) {
            throw new Error('No se pudo guardar la sesión');
          }

          // Redirigir al usuario
          window.location.href = '/pages/inicio.html';
        } catch (error) {
          console.error('Error en login:', error);
          if (errorElement) {
            errorElement.textContent = error.message || 'Error al iniciar sesión. Por favor, inténtelo de nuevo.';
            errorElement.style.display = 'block';
          }
        }
      });
    }
  }

  //  FUNCIONES PARA REGISTRO CON TUTOR 
  let tutoresRegistro = []; // Para almacenar tutores durante el registro

  function initTutorRegistro() {
    const noResponsableCheck = document.getElementById('noResponsable');
    const tutorSeccion = document.getElementById('tutorSeccion');

    if (!noResponsableCheck || !tutorSeccion) return;

    noResponsableCheck.addEventListener('change', function (e) {
      tutorSeccion.style.display = e.target.checked ? 'block' : 'none';
      if (!e.target.checked) {
        tutoresRegistro = [];
        actualizarEstadoTutorRegistro();
      }
    });

    const buscarBtn = document.getElementById('buscarTutor');
    if (buscarBtn) {
      buscarBtn.addEventListener('click', buscarTutorRegistro);
    }
  }

  async function buscarTutorRegistro() {
    const email = document.getElementById('tutorEmail').value.trim();
    const resultadoDiv = document.getElementById('resultadoBusqueda');

    if (!email || !validateEmail(email)) {
      resultadoDiv.innerHTML = '<p class="error-message">Email inválido</p>';
      return;
    }

    const btn = document.getElementById('buscarTutor');
    btn.disabled = true;
    btn.textContent = 'Buscando...';
    // PARA PRUEBAS SIMULAMOS UNA RESPUESTA
    setTimeout(() => {
      // Datos de ejemplo para probar
      if (email === 'carlos@email.com') {
        // Tutor existente
        resultadoDiv.innerHTML = `
        <div class="tutor-info">
          <p><strong>Tutor encontrado:</strong> Carlos López</p>
          <p>Email: carlos@email.com</p>
          <button onclick="asignarTutorRegistro(2, 'Carlos López', 'carlos@email.com')" class="btn-success">
            Asignar
          </button>
        </div>
      `;
      } else if (email === 'maria@email.com') {
        // Tutor existente
        resultadoDiv.innerHTML = `
        <div class="tutor-info">
          <p><strong>Tutor encontrado:</strong> María García</p>
          <p>Email: maria@email.com</p>
          <button onclick="asignarTutorRegistro(3, 'María García', 'maria@email.com')" class="btn-success">
            Asignar
          </button>
        </div>
      `;
      } else {
        // No existe - mostrar formulario de registro
        resultadoDiv.innerHTML = `
        <div class="tutor-registro-form">
          <h4>Registrar nuevo tutor</h4>
          <div class="form-group">
            <label>Nombre completo</label>
            <input type="text" id="nuevoTutorNombre" placeholder="Nombre">
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="nuevoTutorPassword" placeholder="Mínimo 6 caracteres">
          </div>
          <div class="button-group">
            <button onclick="registrarTutorRegistro('${email}')" class="btn-success">Registrar y asignar</button>
            <button onclick="cancelarBusquedaRegistro()" class="btn btn-secondary">Cancelar</button>
          </div>
        </div>
      `;
      }
      btn.disabled = false;
      btn.textContent = 'Buscar';
    }, 1000);

    /** PARA CUANDO ESTE HECHA LA BASE DE DATOS
        try {
          const response = await fetch(`${API_URL}/Usuarios/buscar?email=${encodeURIComponent(email)}`);
          const data = await response.json();
    
          if (data.existe) {
            mostrarTutorExistenteRegistro(data.usuario);
          } else {
            mostrarFormularioRegistroTutor(email);
          }
        } catch (error) {
          resultadoDiv.innerHTML = '<p class="error-message">Error al buscar</p>';
        } finally {
          btn.disabled = false;
          btn.textContent = 'Buscar';
        } */
  }

  function mostrarTutorExistenteRegistro(usuario) {
    const resultadoDiv = document.getElementById('resultadoBusqueda');

    if (tutoresRegistro.some(t => t.email === usuario.email)) {
      resultadoDiv.innerHTML = '<p class="error-message">Este tutor ya está asignado</p>';
      return;
    }

    resultadoDiv.innerHTML = `
    <div class="tutor-info">
      <p><strong>Tutor encontrado:</strong> ${usuario.nombre}</p>
      <p>Email: ${usuario.email}</p>
      <button onclick="asignarTutorRegistro(${usuario.id}, '${usuario.nombre}', '${usuario.email}')" class="btn-success">
        Asignar
      </button>
    </div>
  `;
  }

  function mostrarFormularioRegistroTutor(email) {
    const resultadoDiv = document.getElementById('resultadoBusqueda');

    resultadoDiv.innerHTML = `
    <div class="tutor-registro-form">
      <h4>Registrar nuevo tutor</h4>
      <div class="form-group">
        <label>Nombre completo</label>
        <input type="text" id="nuevoTutorNombre" placeholder="Nombre">
      </div>
      <div class="form-group">
        <label>Contraseña</label>
        <input type="password" id="nuevoTutorPassword" placeholder="Mínimo 6 caracteres">
      </div>
      <div class="button-group">
        <button onclick="registrarTutorRegistro('${email}')" class="btn-success">Registrar y asignar</button>
        <button onclick="cancelarBusquedaRegistro()" class="btn btn-secondary">Cancelar</button>
      </div>
    </div>
  `;
  }

  window.asignarTutorRegistro = function (id, nombre, email) {
    tutoresRegistro.push({ id, nombre, email });
    document.getElementById('tutorEmail').value = '';
    document.getElementById('resultadoBusqueda').innerHTML = '';
    actualizarEstadoTutorRegistro();
  };

  window.registrarTutorRegistro = async function (email) {
    const nombre = document.getElementById('nuevoTutorNombre').value.trim();
    const password = document.getElementById('nuevoTutorPassword').value.trim();

    if (!nombre || !password || password.length < 6) {
      alert('Completa todos los campos');
      return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
      const response = await fetch(`${API_URL}/Usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          email: email,
          contrasena: password,
          rol: 'tutor'
        })
      });

      const data = await response.json();

      if (response.ok) {
        tutoresRegistro.push({
          id: data.usuarioId || data.id,
          nombre: nombre,
          email: email
        });

        document.getElementById('tutorEmail').value = '';
        document.getElementById('resultadoBusqueda').innerHTML = '';
        actualizarEstadoTutorRegistro();
        alert('Tutor registrado correctamente');
      }
    } catch (error) {
      alert('Error al registrar');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Registrar y asignar';
    }
  };

  window.cancelarBusquedaRegistro = function () {
    document.getElementById('resultadoBusqueda').innerHTML = '';
    document.getElementById('tutorEmail').value = '';
  };

  function actualizarEstadoTutorRegistro() {
    const estadoDiv = document.getElementById('tutorEstado');
    const btnRegistro = document.getElementById('btnRegistro');

    if (tutoresRegistro.length === 0) {
      estadoDiv.innerHTML = '<p class="error-message">⚠️ Necesitas asignar al menos un tutor</p>';
      if (btnRegistro) btnRegistro.disabled = true;
      return;
    }

    let html = '<div class="tutor-seleccionado"><p><strong>Tutores asignados:</strong></p><ul>';
    tutoresRegistro.forEach(t => {
      html += `<li>${t.nombre} (${t.email})</li>`;
    });
    html += '</ul></div>';

    estadoDiv.innerHTML = html;
    if (btnRegistro) btnRegistro.disabled = false;
  }

  // Función para inicializar el formulario de registro
  function initRegisterForm() {
    const registerForm = document.getElementById('registro-form');
    const errorElement = document.getElementById('registro-error');
    const successElement = document.getElementById('registro-success');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    let isSubmitting = false; // Bandera para evitar envíos duplicados

    initTutorRegistro(); // Inicializar la funcionalidad de asignación de tutores en el registro

    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Evitar envíos duplicados
        if (isSubmitting) {
          // console.log('Ya se está procesando un registro...');
          return;
        }

        isSubmitting = true;

        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const fecha_nacimiento = document.getElementById('fecha_nacimiento').value;
        const domicilio = document.getElementById('domicilio').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const notificaciones = document.getElementById('notificaciones').checked;
        const terms = document.getElementById('terms').checked;

        const noResponsable = document.getElementById('noResponsable')?.checked || false;

        // Limpiar mensajes anteriores
        if (errorElement) {
          errorElement.style.display = 'none';
          errorElement.textContent = '';
        }
        if (successElement) {
          successElement.style.display = 'none';
          successElement.textContent = '';
        }

        // Validar términos
        if (!terms) {
          if (errorElement) {
            errorElement.textContent = 'Debe aceptar los términos y condiciones';
            errorElement.style.display = 'block';
          }
          isSubmitting = false;
          return;
        }

        // Validar contraseñas
        if (password !== confirmPassword) {
          if (errorElement) {
            errorElement.textContent = 'Las contraseñas no coinciden';
            errorElement.style.display = 'block';
          }
          isSubmitting = false;
          return;
        }

        // Validar tutores si no es responsable
        if (noResponsable && tutoresRegistro.length === 0) {
          showError(errorElement, 'Debes asignar al menos un tutor');
          isSubmitting = false;
          return;
        }

        try {
          // console.log('Iniciando proceso de registro...');
          const user = await register({
            nombre,
            apellidos,
            email,
            password,
            telefono,
            fecha_nacimiento,
            domicilio,
            notificaciones
          });

          // console.log('Registro exitoso:', user);

          // Si no es responsable, asignar tutores
          if (noResponsable && tutoresRegistro.length > 0) {
            await asignarTutorRegistro(user.usuarioId || user.id);
          }

          if (successElement) {
            successElement.textContent = 'Registro exitoso. Redirigiendo...';
            successElement.style.display = 'block';
          }

          // Redirigir al usuario a la página de login después de 2 segundos
          setTimeout(() => {
            window.location.href = '/pages/login';
          }, 2000);
        } catch (error) {
          console.error('Error en registro:', error);
          if (errorElement) {
            errorElement.textContent = error.message || 'Error al registrar usuario. Por favor, inténtelo de nuevo.';
            errorElement.style.display = 'block';
          }
        } finally {
          isSubmitting = false;
        }
      });
    }
  }

  //  Custom select (Tipo de cuenta)   *REVISAR*
  (function () {
    const cs = document.getElementById("roleSelect");
    if (!cs) return;

    const trigger = cs.querySelector(".custom-select-trigger");
    const valueSpan = cs.querySelector(".custom-select-value");
    const options = cs.querySelector(".custom-select-options");
    const hiddenInput = cs.querySelector("#role");

    function closeSelect() {
      cs.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      cs.classList.toggle("open");
      trigger.setAttribute("aria-expanded", cs.classList.contains("open") ? "true" : "false");
    });

    options.addEventListener("click", (e) => {
      const opt = e.target.closest(".custom-select-option");
      if (!opt) return;

      const text = opt.textContent.trim();
      const val = opt.dataset.value;

      valueSpan.textContent = text;
      hiddenInput.value = val;

      closeSelect();
    });

    document.addEventListener("click", closeSelect);

    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSelect();
    });
  })();

  // Exponer las funciones al objeto window
  window.auth = {
    login,
    register,
    logout,
    isAuthenticated,
    getToken,
    getCurrentUser,
    initLoginForm,
    initRegisterForm,
    showError,
    hideError,
    showSuccess
  };

  // Inicializar el formulario correspondiente según la página
  if (window.location.pathname.includes('login')) {
    initLoginForm();
  } else if (window.location.pathname.includes('registro')) {
    initRegisterForm();
  }
})();
