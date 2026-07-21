import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import { PwaProvider } from "@/components/providers/PwaProvider";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "ReplySync | Automate WhatsApp",
  description: "Enterprise WhatsApp automation and AI signal dispatch engine. Manage chats, active bots, and broadcasting effortlessly.",
  metadataBase: new URL("https://aiautomation-two.vercel.app"),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'ReplySync',
    statusBarStyle: 'black-translucent',
    startupImage: ['/icons/icon-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/icons/icon-192x192.png'],
  },
  openGraph: {
    title: "ReplySync | Automate WhatsApp",
    description: "Enterprise WhatsApp automation and AI signal dispatch engine. Manage chats, active bots, and broadcasting effortlessly.",
    url: "https://aiautomation-two.vercel.app",
    siteName: "ReplySync",
    images: [
      {
        url: "/screenshots/desktop.png",
        width: 1024,
        height: 576,
        alt: "ReplySync Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplySync | Automate WhatsApp",
    description: "Enterprise WhatsApp automation and AI signal dispatch engine. Manage chats, active bots, and broadcasting effortlessly.",
    images: ["/screenshots/desktop.png"],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B1215',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents iOS input zooming
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${sora.variable} ${dmSans.variable} antialiased`}>
        <PwaProvider>
          {children}
        </PwaProvider>
      </body>
    </html>
  );
}
