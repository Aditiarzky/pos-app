"use client";
import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image";

export function usePrintReceipt() {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const receiptWidthMm = 80;
  const receiptPaddingMm = 2;

  const captureReceiptAsBlob = useCallback(async (): Promise<Blob | null> => {
    const content = receiptRef.current;
    if (!content) return null;

    const dataUrl = await toPng(content, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    });

    // Convert dataURL ke Blob
    const res = await fetch(dataUrl);
    return res.blob();
  }, []);

  const handleShareAsImage = useCallback(async () => {
    setIsSharing(true);
    try {
      const blob = await captureReceiptAsBlob();
      if (!blob) return;

      const file = new File([blob], "nota-penjualan.png", {
        type: "image/png",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Nota Penjualan",
          text: "Nota penjualan toko Gunung Muria Grosir Snack",
        });
      } else {
        // Fallback: auto-download PNG for manual sharing
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nota-penjualan.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      // User cancelled share — bukan error nyata, abaikan
      if ((error as Error)?.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    } finally {
      setIsSharing(false);
    }
  }, [captureReceiptAsBlob]);

  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content) return;

    setIsPrinting(true);

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

    const htmlContent = content.innerHTML;

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
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
            .print-content {
              width: ${receiptWidthMm}mm !important;
              max-width: ${receiptWidthMm}mm !important;
              padding: ${receiptPaddingMm}mm !important;
            }
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
            svg, img, canvas { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${htmlContent}
          </div>
          <script>
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

  return {
    receiptRef,
    handlePrint,
    isPrinting,
    handleShareAsImage,
    isSharing,
  };
}
