// Service Worker for ExploreNow PWA
const CACHE_NAME = 'explorenow-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip Chrome DevTools requests to avoid CSP issues
  if (url.includes('.well-known/appspecific/com.chrome.devtools.json') ||
      url.includes('chrome-devtools://') ||
      url.includes('devtools://')) {
    return;
  }
  
  // Skip all Vite development server requests
  if (url.includes('localhost:5173') || 
      url.includes('localhost:5000') ||
      url.includes('/api/') ||
      url.includes('/graphql') ||
      url.includes('@vite/') ||
      url.includes('@react-refresh') ||
      url.includes('@fs/') ||
      url.includes('?v=') ||
      url.includes('&v=') ||
      url.includes('?t=') ||
      url.includes('&t=')) {
    return;
  }
  
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip development mode entirely
  if (url.includes('localhost')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, try to serve from cache
      return caches.match(event.request);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});