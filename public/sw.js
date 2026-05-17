const CACHE = 'gmao-v1'

// Static shell to pre-cache on install
const PRECACHE = [
  '/dashboard',
  '/actifs',
  '/bons-de-travail',
  '/maintenance',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET from same origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Skip Clerk auth, Next.js internals
  if (url.pathname.startsWith('/sign-') || url.pathname.startsWith('/_next/webpack-hmr')) return

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/api/qr/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE).then((c) => c.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // Skip other API routes — always network
  if (url.pathname.startsWith('/api/')) return

  // Network-first for navigation: fall back to cached page or /dashboard
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((c) => c.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/dashboard')))
    )
  }
})
