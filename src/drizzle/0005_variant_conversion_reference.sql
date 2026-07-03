ALTER TABLE "product_variants" ADD COLUMN "conversion_reference_variant_id" integer;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_conversion_reference_variant_id_product_variants_id_fk" FOREIGN KEY ("conversion_reference_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL;
