import { NextFunction, Request, Response } from "express";
import {
  createSale,
  getActiveSaleProducts,
  getSaleById,
  getSales,
  SaleServiceError,
} from "../services/sale.service";
import { CreateSaleInput } from "../types/sale.types";
import { createSaleSchema, firstValidationError } from "../utils/validation";
import { getAuditRequestContext, recordAuditEvent } from "../services/audit.service";

export const listSaleProducts = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.status(200).json({ products: await getActiveSaleProducts() });
  } catch (error) {
    next(error);
  }
};

const parseSaleId = (value: string): number | null => {
  const saleId = Number(value);
  return Number.isInteger(saleId) && saleId > 0 ? saleId : null;
};

export const listSales = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  try {
    const sales = await getSales(request.authUser.role, request.authUser.id);
    response.status(200).json({ sales });
  } catch (error) {
    next(error);
  }
};

export const getSale = async (
  request: Request<{ saleId: string }>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  const saleId = parseSaleId(request.params.saleId);
  if (!saleId) {
    response.status(400).json({ message: "Sale ID must be a positive integer." });
    return;
  }

  try {
    const sale = await getSaleById(saleId, request.authUser.role, request.authUser.id);
    response.status(200).json({ sale });
  } catch (error) {
    if (error instanceof SaleServiceError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const completeSale = async (
  request: Request<Record<string, never>, unknown, CreateSaleInput>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  const validation = createSaleSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const sale = await createSale(request.authUser.id, validation.data);
    await recordAuditEvent({
      actorUserId: request.authUser.id,
      action: "SALE_COMPLETED",
      entityType: "sale",
      entityId: sale.id,
      outcome: "success",
      details: {
        receiptNumber: sale.receiptNumber,
        totalAmount: sale.totalAmount,
        itemCount: sale.items.reduce((total, item) => total + item.quantity, 0),
      },
      ...getAuditRequestContext(request),
    });
    response.status(201).json({ message: "Sale completed successfully.", sale });
  } catch (error) {
    if (error instanceof SaleServiceError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};
