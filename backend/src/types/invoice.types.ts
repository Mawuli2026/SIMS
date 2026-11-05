export interface CreateInvoiceItemInput {
  productId: number;
  quantity: number;
}

export interface CreateInvoiceInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CreateInvoiceItemInput[];
}

export interface SavedInvoiceItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface SavedInvoice {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  createdByName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: SavedInvoiceItem[];
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

export const createInvoiceNumber = (invoiceId: number) => `SIMS-PF-${String(invoiceId).padStart(8, "0")}`;
