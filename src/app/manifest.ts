import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Korvia — GMAO pour PME québécoises',
    short_name: 'Korvia',
    description: 'Gérez vos actifs, bons de travail et maintenance préventive en français.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0F1C2E',
    theme_color: '#0F1C2E',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
    categories: ['productivity', 'business'],
  }
}
