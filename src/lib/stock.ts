import { db } from "./db";
import { productUnits } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function convertToBaseUnit(
  productId: number,
  unitId: number,
  qty: number
) {
  const unit = await db.query.productUnits.findFirst({
    where: eq(productUnits.productId, productId),
  });

  if (!unit) throw new Error("Unit not found");

  return Number(qty) * Number(unit.conversionToBase);
}
