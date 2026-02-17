import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { PayDebtData, GetDebtsQuery } from "@/lib/validations/debt";

export type DebtStatus = "unpaid" | "partial" | "paid" | "cancelled";

export interface Debt {
  id: number;
  saleId: number;
  customerId: number;
  originalAmount: string;
  remainingAmount: string;
  status: DebtStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    name: string;
  };
  sale?: {
    id: number;
    invoiceNumber: string;
    createdAt: string;
  };
}

export interface DebtPayment {
  id: number;
  debtId: number;
  amountPaid: string;
  paymentDate: string;
  note: string | null;
}

export type GetDebtsParams = Partial<GetDebtsQuery>;

export const getDebts = async (
  params?: GetDebtsParams,
): Promise<ApiResponse<Debt[]>> => {
  const response = await axiosInstance.get("/debts", { params });
  return response.data;
};

export const payDebt = async ({
  debtId,
  data,
}: {
  debtId: number;
  data: PayDebtData;
}): Promise<ApiResponse<{ payment: DebtPayment; newRemaining: number }>> => {
  const response = await axiosInstance.post(`/debts/${debtId}/payment`, data);
  return response.data;
};
