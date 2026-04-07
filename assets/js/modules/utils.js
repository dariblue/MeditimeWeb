// ─────────────────────────────────────────────────────────────
// utils.js  –  Funciones de utilidad comunes (API v2.0)
// ─────────────────────────────────────────────────────────────

/**
 * Formatea un objeto Date (o string ISO) a "HH:MM".
 */
export function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Devuelve true si dos Date caen en el mismo día calendario.
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Validación de campos
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone) {
  const phoneRegex = /^\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validatePassword(password) {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[^A-Za-z0-9]/.test(password)) strength += 25;
  return strength;
}

// Manejo de errores en el DOM
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
  if (!element) return;
  element.textContent = message;
  element.style.display = 'block';
}