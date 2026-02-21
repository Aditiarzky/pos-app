"use client";

import { useRef, useCallback, useState } from "react";

export function usePrintReceipt() {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptWidthMm = 80;
  const receiptPaddingMm = 2;

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
             html, body {
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: ${receiptWidthMm}mm;
              margin: 0 auto;
            }
            /* Copy inline styles agar tetap bekerja */
            .print-content {
              width: ${receiptWidthMm}mm !important;
              max-width: ${receiptWidthMm}mm !important;
              padding: ${receiptPaddingMm}mm !important;
            }
            
            /* Sembunyikan elemen yang tidak perlu saat print */
            @media print {
               @page {
                size: ${receiptWidthMm}mm auto;
                margin: 0;
              }

              html, body {
                width: ${receiptWidthMm}mm;
                margin: 0 !important;
                padding: 0 !important;
              }

              .print-content {
                width: ${receiptWidthMm}mm !important;
                max-width: ${receiptWidthMm}mm !important;
                padding: ${receiptPaddingMm}mm !important;
              }
            }

            /* Paksa Barcode Muncul */
            svg, img, canvas { max-width: 100%; height: auto; }
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
            
            window.onafterprint = () => {
              window.parent.postMessage({ type: 'RECEIPT_PRINT_DONE' }, '*');
            };
          </script>
        </body>
      </html>
    `);
    doc.close();

    const handlePrintDone = (event: MessageEvent) => {
      if (event.data?.type !== "RECEIPT_PRINT_DONE") return;

      setIsPrinting(false);
      window.removeEventListener("message", handlePrintDone);
    };

    window.addEventListener("message", handlePrintDone);

    setTimeout(() => {
      setIsPrinting(false);
      window.removeEventListener("message", handlePrintDone);
    }, 2000);
  }, [receiptPaddingMm, receiptWidthMm]);

  return { receiptRef, handlePrint, isPrinting };
}
