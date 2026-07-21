import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/#replysync-pwa',
    name: 'ReplySync Enterprise WhatsApp Dispatch',
    short_name: 'ReplySync',
    description: 'Automated WhatsApp Support & AI Signal Dispatch Engine',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0B1215',
    theme_color: '#0B1215',
    orientation: 'portrait',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
