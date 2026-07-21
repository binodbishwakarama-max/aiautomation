import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import { PwaProvider } from "@/components/providers/PwaProvider";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "ReplySync | Automate WhatsApp",
  description: "WhatsApp automation and CRM dashboard",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'ReplySync',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon', sizes: '192x192', type: 'image/png' },
      { url: '/icon', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/icon'],
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
      <body className={`${sora.variable} ${dmSans.variable} antialiased`}>
        <PwaProvider>
          {children}
        </PwaProvider>
      </body>
    </html>
  );
}
