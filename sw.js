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

// ─── PUSH EVENT (Fase 4) ──────────────────────────────────────
self.addEventListener('push', event => {
  console.log('[SW] Evento Push recibido.');

  let payload = {
    title: 'Nueva Notificación',
    body: 'Tienes un nuevo mensaje de MediTime.',
    idMedicamento: 0
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/assets/img/icons/icon-192.png',
    badge: '/assets/img/icons/icon-72.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/pages/inicio.html',
      idMedicamento: payload.idMedicamento,
      payloadStr: JSON.stringify(payload)
    },
    actions: [
      { action: 'tomar', title: '✅ Ya lo tomé' },
      { action: 'posponer', title: '⏳ Posponer 5 min' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'MediTime', options)
  );
});

// ─── NOTIFICATION CLICK (Fase 4) ─────────────────────────────
self.addEventListener('notificationclick', event => {
  console.log('[SW] Click en notificación:', event.action);
  const notification = event.notification;
  const action = event.action;
  
  notification.close();

  if (action === 'posponer') {
    // Solución aprobada: event.waitUntil + setTimeout en el SW
    // Mantiene el SW vivo durante 5 minutos para volver a mostrarla
    console.log('[SW] Notificación pospuesta por 5 minutos...');
    const originalData = notification.data;
    let payload = { title: notification.title, body: notification.body };
    if (originalData && originalData.payloadStr) {
      try { payload = JSON.parse(originalData.payloadStr); } catch(e){}
    }
    
    const promise = new Promise(resolve => {
      setTimeout(() => {
        self.registration.showNotification("⏰ RECORDATORIO POSPUESTO: " + payload.title, {
          body: payload.body,
          icon: '/assets/img/icons/icon-192.png',
          badge: '/assets/img/icons/icon-72.png',
          vibrate: [500, 200, 500],
          data: originalData,
          actions: [{ action: 'tomar', title: '✅ Ya lo tomé' }]
        }).then(resolve);
      }, 5 * 60 * 1000); // 5 minutos
    });

    event.waitUntil(promise);
  } else if (action === 'tomar') {
    // Si queremos marcar como tomado directamente, podríamos hacer un fetch() a la API aquí.
    // Por ahora redirigimos a la app.
    event.waitUntil(
      clients.openWindow('/pages/inicio.html')
    );
  } else {
    // Click normal en el cuerpo de la notificación
    event.waitUntil(
      clients.openWindow(notification.data?.url || '/pages/inicio.html')
    );
  }
});
