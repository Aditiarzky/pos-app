import { sql } from "drizzle-orm";
import { db } from "./db";
import { sales, purchaseOrders, stockMutations, customerReturns, supplierReturns } from "@/drizzle/schema";

export interface CleanExpiredResult {
  success: boolean;
  deleted?: {
    sales: number;
    purchases: number;
    stockMutations: number;
    customerReturns: number;
    supplierReturns: number;
  };
  archived?: {
    sales: number;
    purchases: number;
    customerReturns: number;
  };
  error?: string;
}

export async function cleanExpiredData(): Promise<CleanExpiredResult> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  try {
    const salesResult = await db.delete(sales).where(
      sql`${sales.createdAt} < ${oneYearAgo} AND ${sales.isArchived} = false`
    ).returning({ id: sales.id });

    const purchaseResult = await db.delete(purchaseOrders).where(
      sql`${purchaseOrders.createdAt} < ${oneYearAgo} AND ${purchaseOrders.isArchived} = false`
    ).returning({ id: purchaseOrders.id });

    const stockMutationsResult = await db.delete(stockMutations).where(
      sql`${stockMutations.createdAt} < ${oneMonthAgo}`
    ).returning({ id: stockMutations.id });

    const customerReturnResult = await db.delete(customerReturns).where(
      sql`${customerReturns.createdAt} < ${oneYearAgo} AND ${customerReturns.isArchived} = false`
    ).returning({ id: customerReturns.id });

    const supplierReturnResult = await db.delete(supplierReturns).where(
      sql`${supplierReturns.createdAt} < ${oneYearAgo}`
    ).returning({ id: supplierReturns.id });

    return {
      success: true,
      deleted: {
        sales: salesResult.length,
        purchases: purchaseResult.length,
        stockMutations: stockMutationsResult.length,
        customerReturns: customerReturnResult.length,
        supplierReturns: supplierReturnResult.length,
      }
    };
  } catch (error) {
    console.error('Error cleaning expired data:', error);
    return { success: false, error: String(error) };
  }
}

export async function cleanExpiredDataWithArchive(): Promise<CleanExpiredResult> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  try {
    const salesResult = await db.update(sales)
      .set({ isArchived: true })
      .where(sql`${sales.createdAt} < ${oneYearAgo} AND ${sales.isArchived} = false`)
      .returning({ id: sales.id });

    const purchaseResult = await db.update(purchaseOrders)
      .set({ isArchived: true })
      .where(sql`${purchaseOrders.createdAt} < ${oneYearAgo} AND ${purchaseOrders.isArchived} = false`)
      .returning({ id: purchaseOrders.id });

    const customerReturnResult = await db.update(customerReturns)
      .set({ isArchived: true })
      .where(sql`${customerReturns.createdAt} < ${oneYearAgo} AND ${customerReturns.isArchived} = false`)
      .returning({ id: customerReturns.id });

    return {
      success: true,
      archived: {
        sales: salesResult.length,
        purchases: purchaseResult.length,
        customerReturns: customerReturnResult.length
      }
    };
  } catch (error) {
    console.error('Error archiving expired data:', error);
    return { success: false, error: String(error) };
  }
}
