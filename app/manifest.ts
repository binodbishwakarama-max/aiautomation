import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ReplySync CRM',
    short_name: 'ReplySync',
    description: 'WhatsApp AI Automation & B2B CRM Dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b', // hsl(240, 10%, 4%) which matches --background
    theme_color: '#3b82f6', // Matches primary blue
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
  };
}
