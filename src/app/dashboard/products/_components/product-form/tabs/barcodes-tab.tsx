import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { InsertProductBarcodeType } from "@/drizzle/type";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function BarcodesTab({
  register,
  errors,
  barcodeFields,
  appendBarcode,
  removeBarcode,
}: any) {
  return (
    <div className="space-y-4">
      <TabsContent value="barcodes" className="mt-4 space-y-3">
        {barcodeFields.map((field: InsertProductBarcodeType, index: number) => (
          <div key={field.id} className="flex gap-2">
            <Input
              placeholder="Masukkan barcode (contoh: 8991234567890)"
              {...register(`barcodes.${index}.barcode` as const)}
            />
            {barcodeFields.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeBarcode(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => appendBarcode({ barcode: "" })}
        >
          Tambah Barcode
        </Button>
      </TabsContent>
    </div>
  );
}
