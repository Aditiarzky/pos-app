import QueryProvider from "@/components/providers/QueryProvider";
import { Metadata } from "next";
import "./globals.css";
import { ConfirmProvider } from "@/contexts/ConfirmDialog";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Gunung Muria || Point of Sale",
  description: "Point of Sale for Gunung Muria grosir snack",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ConfirmProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </ConfirmProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
