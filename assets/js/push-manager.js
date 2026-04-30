/**
 * Push Manager
 * 
 * Gestiona el registro del Service Worker, la obtención de permisos,
 * la solicitud de claves VAPID al servidor y la suscripción push.
 */
class PushManager {
    constructor(apiUrl = 'https://api.dariblue.dev/api') {
        this.apiUrl = apiUrl;
        this.vapidPublicKey = null;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    }

    async init() {
        if (!this.isSupported) {
            console.warn('Push messaging no está soportado.');
            return false;
        }
        
        try {
            await this.registerServiceWorker();
            await this.fetchVapidKey();
            return true;
        } catch (error) {
            console.error('Error inicializando PushManager:', error);
            return false;
        }
    }

    async registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[PushManager] SW registrado.', registration.scope);
        return registration;
    }

    async fetchVapidKey() {
        const response = await fetch(`${this.apiUrl}/PushSubscriptions/vapid-public-key`);
        if (!response.ok) {
            throw new Error('No se pudo obtener la VAPID public key');
        }
        const data = await response.json();
        this.vapidPublicKey = data.publicKey;
        return this.vapidPublicKey;
    }

    // Convertidor de clave base64 a Uint8Array (requerido por la Push API)
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async subscribe(userId) {
        if (!this.vapidPublicKey) {
            console.error('VAPID public key no disponible.');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Primero pedimos permiso
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Permiso de notificaciones denegado.');
                return null;
            }

            // Nos suscribimos
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            console.log('[PushManager] Suscripción obtenida:', subscription);

            // Extraemos P256dh y Auth de la suscripción
            const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))));
            const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))));

            // Enviamos al backend
            const response = await fetch(`${this.apiUrl}/PushSubscriptions/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idUsuario: userId,
                    endpoint: subscription.endpoint,
                    p256dh: p256dh,
                    auth: auth
                })
            });

            if (response.ok) {
                console.log('[PushManager] Suscripción guardada en el servidor.');
                return subscription;
            } else {
                console.error('[PushManager] Error al guardar en el servidor:', await response.text());
                return null;
            }

        } catch (error) {
            console.error('[PushManager] Error al suscribir:', error);
            return null;
        }
    }

    async unsubscribe(userId) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                const endpoint = subscription.endpoint;
                await subscription.unsubscribe();
                
                // Avisar al backend para que la borre
                await fetch(`${this.apiUrl}/PushSubscriptions/unsubscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idUsuario: userId, // Aunque el endpoint es suficiente, lo mandamos para el modelo
                        endpoint: endpoint,
                        p256dh: "",
                        auth: ""
                    })
                });
                
                console.log('[PushManager] Desuscripción exitosa.');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[PushManager] Error al desuscribir:', error);
            return false;
        }
    }
}

// Instancia global
window.pushManagerInstance = new PushManager();
