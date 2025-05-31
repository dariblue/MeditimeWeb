// Funciones de utilidad comunes

// Formateo de hora
export function formatHora(hora) {
  if (!hora) return '';
  const [hours, minutes] = hora.split(':');
  return `${hours}:${minutes}`;
}

// Validación de campos
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone) {
  const phoneRegex = /^\d{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function validatePassword(password) {
  let strength = 0
  if (password.length >= 8) strength += 25
  if (/[A-Z]/.test(password)) strength += 25
  if (/[0-9]/.test(password)) strength += 25
  if (/[^A-Za-z0-9]/.test(password)) strength += 25
  return strength
}

// Manejo de errores
export function showError(element, message) {
  if (!element) {
    console.error('Elemento no encontrado para mostrar error:', message);
    return;
  }
  
  element.textContent = message;
  element.style.display = 'block';
}

export function hideError(element) {
  if (!element) return;
  element.style.display = 'none';
}

export function showSuccess(element, message) {
  if (!element) return
  element.textContent = message
  element.style.display = "block"
} 