import { db } from "@/lib/db";
import { stockMutations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(_: Request, { params }: any) {
  const rows = await db
    .select({
      qty: stockMutations.qtyBaseUnit,
    })
    .from(stockMutations)
    .where(eq(stockMutations.productId, Number(params.productId)));

  const total = rows.reduce((a, b) => a + Number(b.qty), 0);

  return Response.json({ stockBaseUnit: total });
}
