import { useState } from "react"; // Import useState
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Import Dialog UI
import { Trash2, QrCode } from "lucide-react"; // Import Icon QrCode
import { InsertProductBarcodeType } from "@/drizzle/type";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { DialogTitle } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export function BarcodesTab({
  register,
  errors,
  barcodeFields,
  appendBarcode,
  removeBarcode,
}: any) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = (barcode: string) => {
    setIsScannerOpen(false);
    appendBarcode({ barcode });
  };

  return (
    <div className="space-y-4">
      <TabsContent value="barcodes" className="mt-4 space-y-3">
        {barcodeFields.map((field: InsertProductBarcodeType, index: number) => (
          <div key={field.id} className="flex w-full gap-2">
            <div className="w-full">
              <Input
                placeholder="Masukkan barcode (contoh: 8991234567890)"
                {...register(`barcodes.${index}.barcode` as const)}
              />
              {errors.barcodes?.[index]?.barcode && (
                <p className="text-red-500 mt-1">
                  {errors.barcodes?.[index]?.barcode?.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "hidden w-fit p-2 h-fit text-destructive",
                barcodeFields.length > 1 && "block",
              )}
              onClick={() => removeBarcode(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => appendBarcode({ barcode: "" })}
            className="flex-1"
          >
            Input Manual
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => setIsScannerOpen(true)}
            className="flex-1"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Scan Barcode
          </Button>
        </div>
      </TabsContent>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogTitle hidden>Scan Barcode Barang</DialogTitle>
        <DialogContent className="p-0 border-none max-w-lg max-h-[90vh]">
          <BarcodeScannerCamera
            onScanSuccess={handleScanSuccess}
            onClose={() => setIsScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
