import { NextFunction, Request, Response } from "express";
import {
  createProduct as createProductRecord,
  getLowStockProducts,
  getProducts,
  ProductServiceError,
  updateProduct as updateProductRecord,
  updateProductStatus as updateProductStatusRecord,
} from "../services/product.service";
import { ProductInput } from "../types/product.types";
import { AuditAction } from "../types/audit.types";
import { firstValidationError, productSchema, productStatusSchema } from "../utils/validation";
import { getAuditRequestContext, recordAuditEvent } from "../services/audit.service";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination";

const parseProductId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const handleServiceError = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof ProductServiceError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }
  next(error);
};

const auditProductMutation = (
  request: Request,
  product: { id: number; name: string; status: string; quantityInStock: number },
  action: AuditAction,
) => {
  if (!request.authUser) return Promise.resolve();
  return recordAuditEvent({
    actorUserId: request.authUser.id,
    action,
    entityType: "product",
    entityId: product.id,
    outcome: "success",
    details: { name: product.name, status: product.status, quantityInStock: product.quantityInStock },
    ...getAuditRequestContext(request),
  });
};

export const listProducts = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const options = parsePaginationQuery(request.query as Record<string, unknown>);
    const result = await getProducts(options);
    response.status(200).json({
      products: result.products,
      pagination: createPaginationMeta(result.totalItems, options.page, options.pageSize),
    });
  } catch (error) {
    next(error);
  }
};

export const listLowStockProducts = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const options = parsePaginationQuery(request.query as Record<string, unknown>);
    const result = await getLowStockProducts(options);
    response.status(200).json({
      products: result.products,
      pagination: createPaginationMeta(result.totalItems, options.page, options.pageSize),
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  request: Request<Record<string, never>, unknown, ProductInput>,
  response: Response,
  next: NextFunction,
) => {
  const validation = productSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const product = await createProductRecord(validation.data);
    await auditProductMutation(request, product, "PRODUCT_CREATED");
    response.status(201).json({ message: "Product created successfully.", product });
  } catch (error) {
    handleServiceError(error, response, next);
  }
};

export const updateProduct = async (
  request: Request<{ productId: string }, unknown, ProductInput>,
  response: Response,
  next: NextFunction,
) => {
  const productId = parseProductId(request.params.productId);
  if (!productId) {
    response.status(400).json({ message: "Product ID must be a positive integer." });
    return;
  }

  const validation = productSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const product = await updateProductRecord(productId, validation.data);
    await auditProductMutation(request, product, "PRODUCT_UPDATED");
    response.status(200).json({ message: "Product updated successfully.", product });
  } catch (error) {
    handleServiceError(error, response, next);
  }
};

export const updateProductStatus = async (
  request: Request<{ productId: string }, unknown, { status: unknown }>,
  response: Response,
  next: NextFunction,
) => {
  const productId = parseProductId(request.params.productId);
  if (!productId) {
    response.status(400).json({ message: "Product ID must be a positive integer." });
    return;
  }

  const validation = productStatusSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const product = await updateProductStatusRecord(productId, validation.data.status);
    await auditProductMutation(request, product, "PRODUCT_STATUS_CHANGED");
    const action = validation.data.status === "Active" ? "activated" : "deactivated";
    response.status(200).json({ message: `Product ${action} successfully.`, product });
  } catch (error) {
    handleServiceError(error, response, next);
  }
};
