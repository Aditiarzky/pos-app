import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Upload, X, Loader2 } from "lucide-react";
import { CategoryType, UnitType } from "@/drizzle/type";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Control,
  Controller,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { UnitSelect } from "@/components/ui/unit-select";
import { CategorySelect } from "@/components/ui/category-select";
import Image from "next/image";
import {
  InsertProductInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";
import { FormFieldErrors } from "../../../_hooks/use-product-form";

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
  control,
}: {
  register: UseFormRegister<InsertProductInputType | UpdateProductInputType>;
  errors: FormFieldErrors;
  categories: CategoryType[];
  units: UnitType[];
  setValue: UseFormSetValue<InsertProductInputType | UpdateProductInputType>;
  watch: UseFormWatch<InsertProductInputType | UpdateProductInputType>;
  imagePreview: string | null;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  uploadImage: (file: File) => void;
  clearImage: () => void;
  control: Control<InsertProductInputType | UpdateProductInputType>;
}) {
  const selectedUnitId = watch("baseUnitId");
  const selectedUnitName = units.find(
    (u: UnitType) => u.id === selectedUnitId,
  )?.name;
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
              SKU{" "}
              <p className="text-xs text-muted-foreground">(auto-generated)</p>
            </Label>
            <Input {...register("sku")} disabled />
            {errors.sku && (
              <p className="text-sm text-destructive">{errors.sku.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kategori</Label>
            <CategorySelect
              categories={categories}
              value={watch("categoryId") ?? undefined}
              onValueChange={(v: number) =>
                setValue("categoryId", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              placeholder="Pilih kategori"
            />
            {errors.categoryId && (
              <p className="text-sm text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Satuan Dasar <p className="text-red-500">*</p>
            </Label>
            <UnitSelect
              units={units}
              value={watch("baseUnitId")}
              onValueChange={(v: number) =>
                setValue("baseUnitId", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              placeholder="Pilih satuan"
            />
            {errors.baseUnitId && (
              <p className="text-sm text-destructive">
                {errors.baseUnitId.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Stok Minimal</Label>
            <Controller
              name="minStock"
              control={control}
              render={({ field }) => (
                <NumericInput
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Contoh: 10"
                  min={0}
                  suffix={selectedUnitName}
                  max={1000000}
                />
              )}
            />
            {errors.minStock && (
              <p className="text-sm text-destructive">
                {errors.minStock.message}
              </p>
            )}
          </div>
        </div>

        {/* Upload Image */}
        <div className="space-y-2">
          <Label>Gambar Produk (Opsional)</Label>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="relative w-32 h-32 border-2 border-dashed rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {imagePreview ? (
                <>
                  <Image
                    src={imagePreview}
                    alt="preview"
                    width={128}
                    height={128}
                    className="object-cover"
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
