import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, Noto_Serif, Manrope } from "next/font/google";
import "./globals.css";
import "./avalon.css";
import "./deception.css";

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-cormorant',
});

const notoSerif = Noto_Serif({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-noto-serif',
});

const manrope = Manrope({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-manrope',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avalon – The Resistance",
  description: "Trò chơi nhập vai chiến lược nhiều người chơi: The Resistance: Avalon",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Avalon",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${notoSerif.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        {/* iOS PWA: hides Safari UI completely when launched from home screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Android Chrome: enables fullscreen in manifest */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Viewport: use dvh to handle iOS URL bar correctly */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
