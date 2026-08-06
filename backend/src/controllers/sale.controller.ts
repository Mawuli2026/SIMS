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
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination";

const parseDateQuery = (value: unknown): string | null => {
  const date = typeof value === "string" ? value.trim() : "";
  if (!date) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date;
};

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
    const options = parsePaginationQuery(request.query as Record<string, unknown>);
    const date = parseDateQuery(request.query.date);
    if (date === null) {
      response.status(400).json({ message: "Sale date must use the YYYY-MM-DD format." });
      return;
    }
    const result = await getSales(request.authUser.role, request.authUser.id, { ...options, date });
    response.status(200).json({
      sales: result.sales,
      summary: result.summary,
      pagination: createPaginationMeta(result.totalItems, options.page, options.pageSize),
    });
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
