"use client";
import { useState } from "react";
import BarcodeScannerCamera from "@/components/BarcodeScannerCamera";

export default function Home() {
  const [barcode, setBarcode] = useState<string | null>(null);
  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Aplikasi Scan Barcode</h1>
      <p style={{ textAlign: "center" }}>
        Pilih metode scan yang Anda inginkan.
      </p>

      <hr style={{ margin: "40px 0" }} />

      {/* Fitur Scan dari Kamera */}
      <BarcodeScannerCamera onScanSuccess={(barcode) => setBarcode(barcode)} />
      <p>{`Barcode yang di-scan: ${barcode}`}</p>
      <hr style={{ margin: "40px 0" }} />
    </main>
  );
}
