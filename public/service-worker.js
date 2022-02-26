const CACHE_NAME = 'budget-tracker-cache';
const DATA_CACHE_NAME = 'budget-cache';
const config = {
    checkInterval: 30
}

let onlineCheckInterval;

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/js/index.js',
    '/js/db.js',
    '/css/styles.css',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
];

self.addEventListener('install', function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE)
            .catch(err => {
                console.warn('err', err);
                console.log('caches', caches);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(evt) {
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches
            .open(DATA_CACHE_NAME)
            .then(cache => {
                return fetch(evt.request)
                .then(response => {
                    if (response.status === 200) {
                        cache.put(evt.request.url, response.clone());
                    }
                    return response;
                })
                .catch(err => {
                    return cache.match(evt.request);
                });
            })
            .catch(err => console.log(err))
        );
    } else { 
        evt.respondWith(
            fetch(evt.request)
            .catch(function() {
                return caches.match(evt.request).then(function(response) {
                    if (response) {
                        return response;
                    } else if (evt.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/');
                    }
                });
            })
        );
    }
});

