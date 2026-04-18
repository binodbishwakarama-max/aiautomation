import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import { PwaProvider } from "@/components/providers/PwaProvider";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "ReplySync | Automate WhatsApp",
  description: "WhatsApp automation and CRM dashboard",
  appleWebApp: {
    capable: true,
    title: 'ReplySync',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
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
