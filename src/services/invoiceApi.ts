import { CreateInvoiceRequest, CreateInvoiceResponse, InvoiceListResponse, InvoiceResponse } from "../types/invoice.types";
import { apiRequest, bearerHeaders } from "./apiClient";

export const getInvoices = (token: string) => apiRequest<InvoiceListResponse>("/api/invoices", {
  headers: bearerHeaders(token),
});

export const getInvoice = (token: string, invoiceId: number) => apiRequest<InvoiceResponse>(`/api/invoices/${invoiceId}`, {
  headers: bearerHeaders(token),
});

export const createInvoice = (token: string, values: CreateInvoiceRequest) => apiRequest<CreateInvoiceResponse>("/api/invoices", {
  method: "POST",
  headers: bearerHeaders(token),
  body: JSON.stringify(values),
});
