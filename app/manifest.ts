import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ReplySync Enterprise',
    short_name: 'ReplySync',
    description: 'WhatsApp AI Signal Dispatch & Lead Orchestration Engine',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1215',
    theme_color: '#0B1215',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  };
}
