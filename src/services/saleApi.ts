import { CreateSaleRequest, CreateSaleResponse, SaleProductsResponse, SaleResponse, SalesResponse } from "../types/sale.types";
import { apiRequest, bearerHeaders } from "./apiClient";

export const getSaleProducts = (token: string) => apiRequest<SaleProductsResponse>("/api/sales/products", {
  headers: bearerHeaders(token),
});

export const completeSale = (token: string, values: CreateSaleRequest) => apiRequest<CreateSaleResponse>("/api/sales", {
  method: "POST",
  headers: bearerHeaders(token),
  body: JSON.stringify(values),
});

export const getSales = (token: string) => apiRequest<SalesResponse>("/api/sales", {
  headers: bearerHeaders(token),
});

export const getSale = (token: string, saleId: number) => apiRequest<SaleResponse>(`/api/sales/${saleId}`, {
  headers: bearerHeaders(token),
});
