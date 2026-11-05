import { NextFunction, Request, Response } from "express";
import { CreateInvoiceInput } from "../types/invoice.types";
import { createInvoice, getInvoiceById, getInvoices, InvoiceServiceError } from "../services/invoice.service";
import { createInvoiceSchema, firstValidationError } from "../utils/validation";
import { getAuditRequestContext, recordAuditEvent } from "../services/audit.service";

const parseInvoiceId = (value: string): number | null => {
  const invoiceId = Number(value);
  return Number.isInteger(invoiceId) && invoiceId > 0 ? invoiceId : null;
};

const handleServiceError = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof InvoiceServiceError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }
  next(error);
};

export const listInvoices = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.status(200).json({ invoices: await getInvoices() });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (request: Request<{ invoiceId: string }>, response: Response, next: NextFunction) => {
  const invoiceId = parseInvoiceId(request.params.invoiceId);
  if (!invoiceId) {
    response.status(400).json({ message: "Invoice ID must be a positive integer." });
    return;
  }

  try {
    response.status(200).json({ invoice: await getInvoiceById(invoiceId) });
  } catch (error) {
    handleServiceError(error, response, next);
  }
};

export const createProFormaInvoice = async (
  request: Request<Record<string, never>, unknown, CreateInvoiceInput>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const validation = createInvoiceSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const invoice = await createInvoice(request.authUser.id, validation.data);
    await recordAuditEvent({
      actorUserId: request.authUser.id,
      action: "INVOICE_CREATED",
      entityType: "invoice",
      entityId: invoice.id,
      outcome: "success",
      details: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalAmount: invoice.totalAmount,
        itemCount: invoice.items.reduce((total, item) => total + item.quantity, 0),
      },
      ...getAuditRequestContext(request),
    });
    response.status(201).json({ message: "Pro forma invoice created successfully.", invoice });
  } catch (error) {
    handleServiceError(error, response, next);
  }
};
