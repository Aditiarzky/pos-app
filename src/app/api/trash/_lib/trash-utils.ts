export type TrashEntityType = "product" | "sale" | "purchase" | "customer";

export type TrashItemInput = {
  id: number;
  type: TrashEntityType;
};

export type TrashPayload = TrashItemInput | { items: TrashItemInput[] };

export class TrashValidationError extends Error { }

const VALID_TYPES: TrashEntityType[] = [
  "product",
  "sale",
  "purchase",
  "customer",
];

function isValidType(type: string): type is TrashEntityType {
  return VALID_TYPES.includes(type as TrashEntityType);
}

export function parseTrashPayload(payload: unknown): TrashItemInput[] {
  if (!payload || typeof payload !== "object") {
    throw new TrashValidationError("Payload tidak valid");
  }

  let rawItems: unknown[];

  // Check if the payload matches the { items: TrashItemInput[] } structure
  if ("items" in payload && Array.isArray((payload as { items: unknown[] }).items)) {
    rawItems = (payload as { items: unknown[] }).items;
  } else {
    // Otherwise, treat the payload itself as a single TrashItemInput
    rawItems = [payload];
  }

  if (!rawItems.length) {
    throw new TrashValidationError("Tidak ada data yang dipilih");
  }

  const normalized = rawItems.map((item: unknown) => { // Explicitly type item as unknown
    if (typeof item !== "object" || item === null) {
      throw new TrashValidationError("Item data tidak valid (bukan objek)");
    }

    // Now that item is known to be an object, we can safely access its potential properties
    const itemObj = item as { id?: unknown; type?: unknown }; // Cast to an object with optional properties

    const id = Number(itemObj.id);
    const type = String(itemObj.type || "");

    if (Number.isNaN(id) || id <= 0) {
      throw new TrashValidationError("ID data tidak valid");
    }

    if (!isValidType(type)) {
      throw new TrashValidationError(`Tipe data tidak valid: ${type}`);
    }

    return { id, type };
  });

  const unique = new Map<string, TrashItemInput>();
  for (const item of normalized) {
    unique.set(`${item.type}:${item.id}`, item);
  }

  return [...unique.values()];
}

export class RestoreIntegrityError extends Error {
  reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.reason = reason;
    this.name = "RestoreIntegrityError";
  }
}
