import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Upload, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryType, UnitType } from "@/drizzle/type";

export function BasicInfoTab({
  register,
  errors,
  categories,
  units,
  setValue,
  watch,
  imagePreview,
  uploading,
  inputRef,
  uploadImage,
  clearImage,
}: any) {
  return (
    <div className="space-y-4">
      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Nama Produk <p className="text-red-500">*</p>
            </Label>
            <Input {...register("name")} placeholder="Contoh: Indomie Goreng" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              SKU <p className="text-red-500">*</p>
            </Label>
            <Input {...register("sku")} placeholder="INDM-GRG-001" />
            {errors.sku && (
              <p className="text-sm text-destructive">{errors.sku.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              onValueChange={(v) =>
                setValue("categoryId", Number(v), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              defaultValue={watch("categoryId")?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {/* Isi dinamis dari API categories */}
                {categories.map((category: CategoryType) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Satuan Dasar <p className="text-red-500">*</p>
            </Label>
            <Select
              onValueChange={(v) =>
                setValue("baseUnitId", Number(v), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              defaultValue={watch("baseUnitId")?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih satuan" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit: UnitType) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.baseUnitId && (
              <p className="text-sm text-destructive">
                {errors.baseUnitId.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Stok Minimum</Label>
          <Input type="number" step="0.001" {...register("minStock")} />
          {errors.minStock && (
            <p className="text-sm text-destructive">
              {errors.minStock.message}
            </p>
          )}
        </div>

        {/* Upload Image */}
        <div className="space-y-2">
          <Label>Gambar Produk (Opsional)</Label>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="relative w-32 h-32 border-2 border-dashed rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      clearImage();
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Upload className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                ref={inputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: JPG, PNG, WebP • Maks. 5MB
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </div>
  );
}
