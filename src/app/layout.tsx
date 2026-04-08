import QueryProvider from "@/components/providers/QueryProvider";
import ThemeInitializer from "@/components/providers/ThemeInitializer";
import { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ConfirmProvider } from "@/contexts/ConfirmDialog";
import ProvidersProgressBar from "@/components/providers/ProgressBar";

export const metadata: Metadata = {
  icons: {
    icon: "/gm-icon.png",
  },
  title: "Gunung Muria || Point of Sale",
  description: "Point of Sale for Gunung Muria grosir snack",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Instrument+Serif:ital@0;1&family=Inter:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" crossOrigin="anonymous" />
      </head>
      <body className="font-geist antialiased">
        <Suspense fallback={null}>
          <ProvidersProgressBar />
        </Suspense>
        <QueryProvider>
          <ThemeInitializer />
          <ConfirmProvider>{children}</ConfirmProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
