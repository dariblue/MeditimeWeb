// Definir setupUserMenu primero
function setupUserMenu() {
  const navLinks = document.querySelector('.nav-links');
  const authButtons = document.querySelector('.auth-buttons');
  const session = window.auth.getCurrentUser();

  // Eliminar cualquier menú de usuario existente
  const existingUserMenu = document.querySelector('.user-menu');
  if (existingUserMenu) {
    existingUserMenu.remove();
  }

  if (session) {
    // Ocultar botones de autenticación
    if (authButtons) {
      authButtons.style.display = 'none';
    }

    // Crear menú de usuario
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <button class="user-menu-toggle">
        <i class="fas fa-user"></i>
        <span class="user-name">${session.nombre}</span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <ul class="user-dropdown">
        <li><a href="/pages/recordatorios"><i class="fas fa-bell"></i> Mis Recordatorios</a></li>
        <li><a href="/pages/calendario"><i class="fas fa-calendar"></i> Calendario</a></li>
        <li><a href="/pages/perfil"><i class="fas fa-user-circle"></i> Mi Perfil</a></li>
        <li><a href="#"><i class="fas fa-cog"></i> Configuración</a></li>
        ${session.isAdmin ? '<li><a href="/pages/admin"><i class="fas fa-shield-alt"></i> Panel Admin</a></li>' : ''}
        <li><a href="#" id="logout-button"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a></li>
      </ul>
    `;

    // Agregar el menú de usuario a la navegación
    if (navLinks) {
      navLinks.appendChild(userMenu);
    }

    // Manejar el clic en el botón de usuario
    const userMenuButton = userMenu.querySelector('.user-menu-toggle');
    const userDropdown = userMenu.querySelector('.user-dropdown');
    
    userMenuButton.addEventListener('click', () => {
      userDropdown.classList.toggle('active');
    });

    // Manejar el clic en el botón de cerrar sesión
    const logoutButton = userMenu.querySelector('#logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.auth.logout();
        window.location.href = '/';
      });
    }
  } else {
    // Mostrar botones de autenticación
    if (authButtons) {
      authButtons.style.display = 'flex';
    }
  }
}

// Función para verificar la autenticación
function checkAuthentication() {
  const isAuthPage = window.location.pathname.includes("login") || 
                    window.location.pathname.includes("registro");
  const isAdminPage = window.location.pathname.includes("admin");
  const session = window.auth.getCurrentUser();

  if (session) {
    if (isAuthPage) {
      window.location.href = "/";
    }
    if (isAdminPage && !session.isAdmin) {
      window.location.href = "/";
    }
  } else if (isAdminPage) {
    window.location.href = "login";
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  setupUserMenu();
  checkAuthentication();

  // Menú móvil
  const menuToggle = document.querySelector(".menu-toggle")
  const navLinks = document.querySelector(".nav-links")

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active")

      // Cambiar el ícono del menú
      const icon = menuToggle.querySelector("i")
      if (icon.classList.contains("fa-bars")) {
        icon.classList.remove("fa-bars")
        icon.classList.add("fa-times")
      } else {
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  }

  // Testimonios slider simple
  const dots = document.querySelectorAll(".dot")
  const testimonials = document.querySelectorAll(".testimonial")

  if (dots.length && testimonials.length) {
    // Mostrar solo el primer testimonio inicialmente
    testimonials.forEach((testimonial, index) => {
      if (index !== 0) {
        testimonial.style.display = "none"
      }
    })

    // Manejar clics en los puntos
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        // Ocultar todos los testimonios
        testimonials.forEach((testimonial) => {
          testimonial.style.display = "none"
        })

        // Mostrar el testimonio seleccionado
        testimonials[index].style.display = "block"

        // Actualizar la clase activa
        dots.forEach((d) => d.classList.remove("active"))
        dot.classList.add("active")
      })
    })
  }

  // Desplazamiento suave para enlaces internos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Ajuste para la barra de navegación
          behavior: "smooth",
        })

        // Cerrar el menú móvil si está abierto
        if (navLinks && navLinks.classList.contains("active")) {
          navLinks.classList.remove("active")
          const icon = menuToggle.querySelector("i")
          icon.classList.remove("fa-times")
          icon.classList.add("fa-bars")
        }
      }
    })
  })

  // Mejoras de accesibilidad para el teclado
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  focusableElements.forEach((element) => {
    element.addEventListener("keydown", (e) => {
      // Ignorar si el elemento es input o textarea (permite escribir espacios y enter)
      const tag = element.tagName.toLowerCase()
      const type = element.getAttribute("type")
  
      if ((tag === "input" && type === "text") || tag === "textarea") {
        return // no interceptar Enter ni espacio
      }
  
      // Activar elementos como botones, enlaces, etc.
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        element.click()
      }
    })
  })
})
