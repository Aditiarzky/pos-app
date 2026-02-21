import QueryProvider from "@/components/providers/QueryProvider";
import { Metadata } from "next";
import { Instrument_Serif, Inter, Geist } from "next/font/google";
import "./globals.css";
import { ConfirmProvider } from "@/contexts/ConfirmDialog";

export const metadata: Metadata = {
  icons: {
    icon: "/gm-icon.png",
  },
  title: "Gunung Muria || Point of Sale",
  description: "Point of Sale for Gunung Muria grosir snack",
};

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument",
});

const inter = Inter({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  weight: "400",
  style: ["normal"],
  display: "swap",
  variable: "--font-geist",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${instrumentSerif.variable} ${inter.variable} font-geist`}
      >
        <QueryProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
