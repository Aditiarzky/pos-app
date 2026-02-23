import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as schema from "./schema";

export type UserType = InferSelectModel<typeof schema.users>;
export type UserRolesType = InferSelectModel<typeof schema.userRoles>;
export type InsertUserType = InferInsertModel<typeof schema.users>;
export type InsertUserRolesType = InferInsertModel<typeof schema.userRoles>;
export type UserRoleEnumType = (typeof schema.userRole.enumValues)[number];
export type CategoryType = InferSelectModel<typeof schema.categories>;
export type InsertCategoryType = InferInsertModel<typeof schema.categories>;
export type UnitType = InferSelectModel<typeof schema.units>;
export type InsertUnitType = InferInsertModel<typeof schema.units>;
export type SupplierType = InferSelectModel<typeof schema.suppliers>;
export type InsertSupplierType = InferInsertModel<typeof schema.suppliers>;
export type ProductType = InferSelectModel<typeof schema.products>;
export type InsertProductType = InferInsertModel<typeof schema.products>;
export type PurchaseOrderType = InferSelectModel<typeof schema.purchaseOrders>;
export type InsertPurchaseOrderType = InferInsertModel<
  typeof schema.purchaseOrders
>;
export type PurchaseItemType = InferSelectModel<typeof schema.purchaseItems>;
export type InsertPurchaseItemType = InferInsertModel<
  typeof schema.purchaseItems
>;
export type SaleType = InferSelectModel<typeof schema.sales>;
export type InsertSaleType = InferInsertModel<typeof schema.sales>;
export type SaleItemType = InferSelectModel<typeof schema.saleItems>;
export type InsertSaleItemType = InferInsertModel<typeof schema.saleItems>;
export type SaleStatusEnumType = (typeof schema.saleStatus.enumValues)[number];
export type SupplierReturnType = InferSelectModel<
  typeof schema.supplierReturns
>;
export type InsertSupplierReturnType = InferInsertModel<
  typeof schema.supplierReturns
>;
export type StockMutationType = InferSelectModel<typeof schema.stockMutations>;
export type InsertStockMutationType = InferInsertModel<
  typeof schema.stockMutations
>;
export type MutationEnumType =
  (typeof schema.stockMutationType.enumValues)[number];
export type ProductBarcodeType = InferSelectModel<
  typeof schema.productBarcodes
>;
export type InsertProductBarcodeType = InferInsertModel<
  typeof schema.productBarcodes
>;
export type CustomerReturnType = InferInsertModel<
  typeof schema.customerReturns
>;
export type CustomerReturnItemType = InferInsertModel<
  typeof schema.customerReturnItems
>;
export type CustomerReturnExchangeItemType = InferInsertModel<
  typeof schema.customerExchangeItems
>;
export type DebtType = InferSelectModel<typeof schema.debts>;
export type InsertDebtType = InferInsertModel<typeof schema.debts>;
export type DebtPaymentType = InferSelectModel<typeof schema.debtPayments>;
export type InsertDebtPaymentType = InferInsertModel<
  typeof schema.debtPayments
>;
export type DebtStatusEnumType =
  (typeof schema.debtStatusEnum.enumValues)[number];
export type CompensationTypeEnumType =
  (typeof schema.compensationType.enumValues)[number];
