import { db } from "@/lib/db";
import { productAuditLogs } from "@/drizzle/schema";
import { ChangeEntry, ProductAuditActionEnumType } from "@/drizzle/type";

const FIELD_LABELS: Record<string, string> = {
  name: "Nama Produk",
  categoryId: "Kategori",
  minStock: "Stok Minimum",
  isActive: "Status Aktif",
  image: "Gambar",
};

type BeforeAfterProduct = {
  name?: string | null;
  categoryId?: number | null;
  minStock?: string | number | null;
  isActive?: boolean | null;
  image?: string | null;
  variants?: Array<{ id: number; sellPrice: string | number }>;
  barcodes?: Array<{ barcode: string }>;
};

// Normalize a value to string, treating null/undefined as the same
// Coerce string booleans back to actual booleans, string numbers to numbers
function normalize(v: unknown): string {
  if (v === null || v === undefined) return "__null";

  // Handle string booleans
  if (v === "true") return "true";
  if (v === "false") return "false";
  if (v === true) return "true";
  if (v === false) return "false";

  // Handle numeric strings vs numbers - convert to string number for comparison
  if (typeof v === "number") return String(v);
  if (typeof v === "string" && !isNaN(Number(v))) {
    const num = Number(v);
    // Keep the numeric representation consistent
    return String(num);
  }

  return String(v);
}

export function diffProduct(
  before: BeforeAfterProduct,
  after: BeforeAfterProduct,
): ChangeEntry[] {
  const changes: ChangeEntry[] = [];

  // Scalar fields — compare as strings to avoid type mismatch (e.g. "true" vs true, "10500" vs 10500)
  const scalarFields = ["name", "categoryId", "minStock", "isActive", "image"] as const;
  for (const field of scalarFields) {
    const oldVal = before[field];
    const newVal = after[field];

    // Skip if newVal is undefined (field not sent from frontend = no intentional change)
    if (newVal === undefined) continue;

    if (normalize(oldVal) !== normalize(newVal)) {
      changes.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  // Variants: compare sellPrice by id
  if (before.variants || after.variants) {
    const beforeMap = new Map<number, { original: string | number; normalized: string }>();

    for (const v of before.variants ?? []) {
      beforeMap.set(v.id, {
        original: v.sellPrice,
        normalized: String(Number(v.sellPrice)),
      });
    }

    for (const v of after.variants ?? []) {
      const oldData = beforeMap.get(v.id);
      const newPrice = String(Number(v.sellPrice));

      if (oldData === undefined) {
        // New variant
        changes.push({
          field: `variant_${v.id}_sellPrice`,
          label: `Harga Varian Baru (ID ${v.id})`,
          oldValue: null,
          newValue: v.sellPrice,
        });
      } else if (oldData.normalized !== newPrice) {
        changes.push({
          field: `variant_${v.id}_sellPrice`,
          label: `Harga Varian (ID ${v.id})`,
          oldValue: oldData.original,
          newValue: v.sellPrice,
        });
      }
    }
  }

  // Barcodes: set diff
  if (before.barcodes || after.barcodes) {
    const beforeSet = new Set((before.barcodes ?? []).map((b) => b.barcode));
    const afterSet = new Set((after.barcodes ?? []).map((b) => b.barcode));

    const added = [...afterSet].filter((b) => !beforeSet.has(b));
    const removed = [...beforeSet].filter((b) => !afterSet.has(b));

    if (added.length > 0) {
      changes.push({
        field: "barcodes_added",
        label: "Barcode Ditambah",
        oldValue: null,
        newValue: added.join(", "),
      });
    }
    if (removed.length > 0) {
      changes.push({
        field: "barcodes_removed",
        label: "Barcode Dihapus",
        oldValue: removed.join(", "),
        newValue: null,
      });
    }
  }

  return changes;
}

type RecordAuditParams = {
  productId: number | null;
  userId: number | null;
  action: ProductAuditActionEnumType;
  changes?: ChangeEntry[] | null;
  snapshot?: Record<string, unknown> | null;
};

type TxType = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recordProductAudit(
  tx: TxType,
  { productId, userId, action, changes, snapshot }: RecordAuditParams,
): Promise<void> {
  // Skip insert for update with no changes
  if (action === "update" && (!changes || changes.length === 0)) return;

  await tx.insert(productAuditLogs).values({
    productId,
    userId,
    action,
    changes: changes ?? null,
    snapshot: snapshot ?? null,
  });
}
