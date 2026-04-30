// ─────────────────────────────────────────────────────────────
// sw.js  —  MediTime Service Worker (Fase 1: Cache & Offline)
// ─────────────────────────────────────────────────────────────
// Estrategia: Network First con fallback a caché.
// Los eventos 'push' y 'notificationclick' se añadirán en Fase 4.
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'meditime-cache-v1';

// Shell de la app: recursos críticos para funcionar offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/pages/inicio.html',
  '/pages/login.html',
  '/pages/registro.html',
  '/pages/recordatorios.html',
  '/pages/calendario.html',
  '/pages/perfil.html',
  '/pages/contacto.html',
  '/pages/faq.html',
  '/pages/admin.html',
  '/assets/css/styles.css',
  '/assets/css/auth.css',
  '/assets/css/inicio.css',
  '/assets/css/recordatorios.css',
  '/assets/css/calendario.css',
  '/assets/css/perfil.css',
  '/assets/css/contacto.css',
  '/assets/css/admin.css',
  '/assets/js/auth.js',
  '/assets/js/script.js',
  '/assets/js/notifications.js',
  '/assets/img/logo.png',
  '/assets/img/notificacion.webp',
  '/assets/img/ImagenInicio.webp',
  '/assets/img/default-avatar.png',
  '/assets/img/icons/icon-192.png',
  '/assets/img/icons/icon-512.png',
  '/manifest.json'
];

// ─── INSTALL ─────────────────────────────────────────────────
// Precachea el shell de la aplicación al instalar el SW.
self.addEventListener('install', event => {
  console.log('[SW] Install — precacheando app shell');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // Activar inmediatamente sin esperar
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────
// Limpia cachés antiguas cuando se activa una nueva versión del SW.
self.addEventListener('activate', event => {
  console.log('[SW] Activate — limpiando cachés antiguas');
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Eliminando caché antigua:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim()) // Tomar control de las pestañas abiertas
  );
});

// ─── FETCH ───────────────────────────────────────────────────
// Estrategia Network First:
//   1. Intenta obtener de la red
//   2. Si funciona, guarda una copia en caché y devuelve la respuesta
//   3. Si falla (offline), devuelve la versión cacheada
//
// Excluye peticiones a la API (no queremos cachear datos dinámicos)
// y peticiones a CDNs externas de fuentes/iconos.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar peticiones a la API ni a dominios externos
  if (url.origin !== self.location.origin) return;

  // No cachear peticiones POST/PUT/DELETE
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        // Clonar la respuesta porque solo se puede consumir una vez
        const responseClone = networkResponse.clone();

        // Guardar en caché solo respuestas exitosas
        if (networkResponse.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }

        return networkResponse;
      })
      .catch(() => {
        // Sin red — buscar en caché
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Si es una navegación (página HTML) y no está en caché,
          // devolver la página de inicio como fallback
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          // Para otros recursos no cacheados, devolver un error genérico
          return new Response('Recurso no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// ─── PLACEHOLDER para Fase 4 ────────────────────────────────
// Los eventos 'push' y 'notificationclick' se implementarán aquí
// en la Fase 4 del plan de implementación.
// ─────────────────────────────────────────────────────────────
