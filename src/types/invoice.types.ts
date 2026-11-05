export interface InvoiceItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  createdByName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  totalAmount: number;
}

export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  createdByName: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
}

export interface CreateInvoiceRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<Pick<InvoiceItem, "productId" | "quantity">>;
}

export interface InvoiceListResponse {
  invoices: InvoiceSummary[];
}

export interface InvoiceResponse {
  invoice: Invoice;
}

export interface CreateInvoiceResponse extends InvoiceResponse {
  message: string;
}
