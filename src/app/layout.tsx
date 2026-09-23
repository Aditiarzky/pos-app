import QueryProvider from "@/components/providers/QueryProvider";
import ThemeInitializer from "@/components/providers/ThemeInitializer";
import DataCleaner from "@/components/DataCleaner";
import ServiceWorkerRegister from "@/components/providers/ServiceWorkerRegister";
import { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ConfirmProvider } from "@/contexts/ConfirmDialog";
import ProvidersProgressBar from "@/components/providers/ProgressBar";

export const metadata: Metadata = {
  title: "Gunung Muria || Point of Sale",
  description: "Point of Sale for Gunung Muria grosir snack",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS App",
  },
  icons: {
    icon: [
      { url: "/gm-icon.png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f766e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="POS App" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Instrument+Serif:ital@0;1&family=Inter:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" crossOrigin="anonymous" />
      </head>
      <body className="font-geist antialiased">
        <ServiceWorkerRegister />
        <Suspense fallback={null}>
          <ProvidersProgressBar />
        </Suspense>
        <QueryProvider>
          <ThemeInitializer />
          <DataCleaner />
          <ConfirmProvider>{children}</ConfirmProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
