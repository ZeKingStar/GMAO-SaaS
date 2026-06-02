// Self-destruct service worker.
//
// A previous version (cache 'gmao-v1') served /_next/static/ bundles cache-first
// under a fixed, never-invalidated cache name. On installed PWAs (e.g. iOS
// home-screen) this pinned stale JS forever, so after server redeploys the old
// client kept POSTing dead Server Action IDs ("Failed to find Server Action").
//
// This version caches nothing, clears all caches, unregisters itself, and
// reloads open windows so existing installs self-heal on next launch.
// The browser always revalidates /sw.js from network, so this WILL be picked up.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((client) => client.navigate(client.url))
    })()
  )
})

// No fetch handler: all requests go straight to the network.
