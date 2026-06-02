'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    // We no longer register a caching service worker (it pinned stale JS bundles
    // on installed PWAs and broke server actions after redeploys). Defensively
    // unregister any leftover SW and purge its caches so clients self-heal.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {})
    }
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => keys.forEach((key) => caches.delete(key)))
        .catch(() => {})
    }
  }, [])

  return null
}
