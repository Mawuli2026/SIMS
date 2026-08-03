import {
  ProductFormValues,
  ProductMutationResponse,
  ProductsResponse,
  ProductStatus,
} from "../types/product.types";
import { apiRequest, bearerHeaders } from "./apiClient";

const authenticatedRequest = <T>(path: string, token: string, options: RequestInit = {}) =>
  apiRequest<T>(path, {
    ...options,
    headers: { ...bearerHeaders(token), ...options.headers },
  });

export const getProducts = (token: string) =>
  authenticatedRequest<ProductsResponse>("/api/products", token);

export const getLowStockProducts = (token: string) =>
  authenticatedRequest<ProductsResponse>("/api/products/low-stock", token);

export const createProduct = (token: string, values: ProductFormValues) =>
  authenticatedRequest<ProductMutationResponse>("/api/products", token, {
    method: "POST",
    body: JSON.stringify(values),
  });

export const updateProduct = (token: string, productId: number, values: ProductFormValues) =>
  authenticatedRequest<ProductMutationResponse>(`/api/products/${productId}`, token, {
    method: "PATCH",
    body: JSON.stringify(values),
  });

export const updateProductStatus = (token: string, productId: number, status: ProductStatus) =>
  authenticatedRequest<ProductMutationResponse>(`/api/products/${productId}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
