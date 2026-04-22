// NitroQuiz Service Worker
// Strategy:
//   - Static assets (images, fonts, JS, CSS): Cache First
//   - HTML Navigation: Network First (with offline fallback)
//   - API calls: Network Only (no caching for live game data)

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `nitroquiz-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `nitroquiz-runtime-${CACHE_VERSION}`;

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/logo/logo1.png',
  '/assets/logo/logo2.png',
  '/assets/logo/faviconR.webp',
];

// --- Install: Pre-cache core assets ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// --- Activate: Clean up old caches ---
self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !allowedCaches.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// --- Fetch: Route-based caching strategy ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET or non-HTTP(S) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip Supabase API / realtime / external calls — always network only
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.io') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return;
  }

  // Next.js static assets (_next/static) — Cache First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // HTML Navigation — Network First, fallback to cache then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a copy of the navigated page
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: try cached version first
          const cached = await caches.match(request);
          if (cached) return cached;

          // Last resort: return cached home page
          const home = await caches.match('/');
          return home || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // Everything else — Stale While Revalidate
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
