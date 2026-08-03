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
import { firstValidationError, productSchema, productStatusSchema } from "../utils/validation";

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

export const listProducts = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.status(200).json({ products: await getProducts() });
  } catch (error) {
    next(error);
  }
};

export const listLowStockProducts = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.status(200).json({ products: await getLowStockProducts() });
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
    const action = validation.data.status === "Active" ? "activated" : "deactivated";
    response.status(200).json({ message: `Product ${action} successfully.`, product });
  } catch (error) {
    handleServiceError(error, response, next);
  }
};
