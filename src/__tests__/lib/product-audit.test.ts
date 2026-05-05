import { describe, it, expect } from "vitest";
import { diffProduct } from "@/app/api/products/_lib/audit";

describe("diffProduct", () => {
  it("returns [] when nothing changed", () => {
    const product = {
      name: "Produk A",
      categoryId: 1,
      minStock: "10",
      image: null,
      variants: [{ id: 1, name: "Pcs", sellPrice: "5000" }],
      barcodes: [{ barcode: "123456" }],
    };
    expect(diffProduct(product, product)).toEqual([]);
  });

  it("detects variant sellPrice change", () => {
    const before = { variants: [{ id: 1, name: "Pcs", sellPrice: "5000" }] };
    const after = { variants: [{ id: 1, name: "Pcs", sellPrice: "6000" }] };
    const result = diffProduct(before, after);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("variant_1_sellPrice");
    expect(result[0].label).toBe("Harga Varian (Pcs)");
    expect(result[0].oldValue).toBe("5000");
    expect(result[0].newValue).toBe("6000");
  });

  it("detects barcode added", () => {
    const before = { barcodes: [{ barcode: "111" }] };
    const after = { barcodes: [{ barcode: "111" }, { barcode: "222" }] };
    const result = diffProduct(before, after);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("barcodes_added");
    expect(result[0].newValue).toBe("222");
  });

  it("detects multiple scalar field changes", () => {
    const before = { name: "A", minStock: "5" };
    const after = { name: "B", minStock: "5" };
    const result = diffProduct(before, after);
    expect(result).toHaveLength(1);
    const fields = result.map((r) => r.field);
    expect(fields).toContain("name");
    expect(fields).not.toContain("isActive");
  });

  it("detects new variant (id not in before)", () => {
    const before = { variants: [{ id: 1, name: "Pcs", sellPrice: "5000" }] };
    const after = {
      variants: [
        { id: 1, name: "Pcs", sellPrice: "5000" },
        { id: 2, name: "Box", sellPrice: "8000" },
      ],
    };
    const result = diffProduct(before, after);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("variant_2_sellPrice");
    expect(result[0].label).toBe("Harga Varian Baru (Box)");
    expect(result[0].oldValue).toBeNull();
  });
});
