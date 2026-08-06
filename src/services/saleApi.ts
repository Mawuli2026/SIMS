import { CreateSaleRequest, CreateSaleResponse, SaleProductsResponse, SaleResponse, SalesRequest, SalesResponse } from "../types/sale.types";
import { apiRequest, bearerHeaders } from "./apiClient";

export const getSaleProducts = (token: string) => apiRequest<SaleProductsResponse>("/api/sales/products", {
  headers: bearerHeaders(token),
});

export const completeSale = (token: string, values: CreateSaleRequest) => apiRequest<CreateSaleResponse>("/api/sales", {
  method: "POST",
  headers: bearerHeaders(token),
  body: JSON.stringify(values),
});

export const getSales = (token: string, options: SalesRequest = {}) => {
  const query = new URLSearchParams();
  if (options.page) query.set("page", String(options.page));
  if (options.pageSize) query.set("pageSize", String(options.pageSize));
  if (options.query?.trim()) query.set("q", options.query.trim());
  if (options.date) query.set("date", options.date);
  const encoded = query.toString();
  return apiRequest<SalesResponse>(`/api/sales${encoded ? `?${encoded}` : ""}`, {
    headers: bearerHeaders(token),
  });
};

export const getSale = (token: string, saleId: number) => apiRequest<SaleResponse>(`/api/sales/${saleId}`, {
  headers: bearerHeaders(token),
});
