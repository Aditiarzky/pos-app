"use client";

import { useRef, useCallback, useState } from "react";

export function usePrintReceipt() {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content) return;

    setIsPrinting(true);

    // Buat iframe jika belum ada
    let frame = document.getElementById("print-iframe") as HTMLIFrameElement;
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = "print-iframe";
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "none";
      document.body.appendChild(frame);
    }

    const doc = frame.contentWindow?.document;
    if (!doc) return;

    // Ambil konten HTML
    const htmlContent = content.innerHTML;

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            /* Reset dasar agar tidak blank */
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              background: #fff;
              color: #000;
            }
            /* Copy inline styles agar tetap bekerja */
            .print-content { width: 100% !important; padding: 8px !important; }
            
            /* Sembunyikan elemen yang tidak perlu saat print */
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { width: 80mm; }
            }

            /* Paksa Barcode Muncul */
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${htmlContent}
          </div>
          <script>
            // Pastikan semua aset (seperti barcode SVG) sudah render
            window.onload = () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();

    // Berikan delay sedikit sebelum mengizinkan klik cetak lagi
    setTimeout(() => setIsPrinting(false), 1000);
  }, []);

  return { receiptRef, handlePrint, isPrinting };
}
