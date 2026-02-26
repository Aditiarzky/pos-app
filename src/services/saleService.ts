import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { insertSaleType } from "@/lib/validations/sale";
import { DebtStatusEnumType, SaleItemType, SaleType } from "@/drizzle/type";

export interface SaleResponse extends SaleType {
  user?: { id: number; name: string };
  customer?: { id: number; name: string };
  items?: Array<
    SaleItemType & {
      product?: {
        id?: number;
        name: string;
      };
      productVariant?: { id?: number; name: string };
    }
  >;
  debt?: {
    id: number;
    remainingAmount: number;
    isActive: boolean;
    status: DebtStatusEnumType;
  };
}

export const getSales = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  customerId?: number;
}): Promise<ApiResponse<SaleResponse[]>> => {
  const response = await axiosInstance.get("/sales", { params });
  return response.data;
};

export const createSale = async (
  data: insertSaleType,
): Promise<ApiResponse<SaleResponse>> => {
  const response = await axiosInstance.post("/sales", data);
  return response.data;
};

export const getSaleById = async (
  id: number,
): Promise<ApiResponse<SaleResponse>> => {
  const response = await axiosInstance.get(`/sales/${id}`);
  return response.data;
};

export const getSaleByInvoice = async (
  invoiceNumber: string,
): Promise<SaleResponse | null> => {
  const response = await axiosInstance.get("/sales", {
    params: { search: invoiceNumber, limit: 1 },
  });
  const data = response.data as ApiResponse<SaleResponse[]>;
  if (data.success && data.data && data.data.length > 0) {
    return data.data[0];
  }
  return null;
};

export const deleteSale = async (id: number): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/sales/${id}`);
  return response.data;
};
