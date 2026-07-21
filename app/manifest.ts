import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'replysync-pwa',
    name: 'ReplySync Automation',
    short_name: 'ReplySync',
    description: 'WhatsApp AI Automation & Signal Dispatch Engine',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1215',
    theme_color: '#0B1215',
    orientation: 'portrait',
    scope: '/',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
