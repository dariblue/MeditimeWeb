(function() {
  const API_URL = 'https://api.bestdariblue.tech';
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
    window.location.href = '/pages/login'; // Redirige al usuario a la página de inicio de sesión
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
          window.location.href = '/';
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

  // Función para inicializar el formulario de registro
  function initRegisterForm() {
    const registerForm = document.getElementById('registro-form');
    const errorElement = document.getElementById('registro-error');
    const successElement = document.getElementById('registro-success');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    let isSubmitting = false; // Bandera para evitar envíos duplicados

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
