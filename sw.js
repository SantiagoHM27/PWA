// Plantilla de Service Worker

// 1. Nombre y archivos a cachear
// ¡IMPORTANTE! Hemos incrementado la versión a v4 para forzar la actualización.
const CACHE_NAME = "mi-pwa-cache-v4"; 

// CORRECCIÓN CLAVE: La ruta base debe ser el nombre del repositorio en GitHub Pages.
const BASE_PATH = "/PWA/"; 
const OFFLINE_FALLBACK_URL = `${BASE_PATH}offline.html`; 

// La lista de URLs debe usar la nueva ruta base
const urlsToCache = [
    // La raíz de la PWA (https://usuario.github.io/PWA/)
    `${BASE_PATH}`, 
    // Archivos principales
    `${BASE_PATH}index.html`,
    `${BASE_PATH}login.html`, // Añadido login.html para que no salga 404 offline
    `${BASE_PATH}manifest.json`,
    OFFLINE_FALLBACK_URL, 
    // Iconos
    `${BASE_PATH}icons/icon-192x192.png`,
    `${BASE_PATH}icons/icon-512x512.png`,
    // Agrega aquí cualquier otro archivo JS o CSS estático
];

// 2. INSTALL -> El evento que se ejecuta cuando se instala el SW
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Cacheando recursos esenciales y fallback.');
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting(); // Fuerza la activación inmediata
});

// 3. ACTIVATE -> Limpiar cachés viejas
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('Service Worker: Eliminando caché antigua:', key);
                        return caches.delete(key);
                    })
            )
        )
    );
    return self.clients.claim(); // Tomar control de las páginas existentes
});

// 4. FETCH -> Interceptar las peticiones de la PWA (Lógica Corregida)
self.addEventListener("fetch", event => {
    // Comprobamos si es una petición de navegación (navegando a una nueva página HTML)
    const isNavigation = event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'));

    if (isNavigation) {
        // Estrategia: Network First con Fallback al Offline Page
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    // Si la red falla (error), devolvemos la página offline cacheada
                    console.log('Fallo de red detectado en navegación. Sirviendo offline.html');
                    return caches.match(OFFLINE_FALLBACK_URL);
                })
        );
    } else {
        // Estrategia para Recursos (CSS, JS, imágenes): Cache First, luego Network
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Si está en caché, lo devuelve. Si no, va a la red.
                    return response || fetch(event.request);
                })
        );
    }
});

// 5. PUSH y 6. SYNC (Se dejaron igual, puedes eliminarlas si no las usas)
self.addEventListener("push", event => {
    const data = event.data ? event.data.text() : "Notificación sin datos";
    event.waitUntil(
        self.registration.showNotification("Mi PWA", { body: data })
    );
});

self.addEventListener("sync", event => {
    if (event.tag === 'mi-sincronizacion') {
        // Debes definir la función 'sincronizarDatos' si usas esto
        // event.waitUntil(sincronizarDatos()); 
    }
});