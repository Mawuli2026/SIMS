import {
  ProductFormValues,
  ProductMutationResponse,
  ProductsResponse,
  ProductStatus,
} from "../types/product.types";
import { apiRequest, bearerHeaders } from "./apiClient";
import { PaginationRequest } from "../types/pagination.types";

const authenticatedRequest = <T>(path: string, token: string, options: RequestInit = {}) =>
  apiRequest<T>(path, {
    ...options,
    headers: { ...bearerHeaders(token), ...options.headers },
  });

const productListPath = (path: string, options: PaginationRequest) => {
  const query = new URLSearchParams();
  if (options.page) query.set("page", String(options.page));
  if (options.pageSize) query.set("pageSize", String(options.pageSize));
  if (options.query?.trim()) query.set("q", options.query.trim());
  const encoded = query.toString();
  return `${path}${encoded ? `?${encoded}` : ""}`;
};

export const getProducts = (token: string, options: PaginationRequest = {}) =>
  authenticatedRequest<ProductsResponse>(productListPath("/api/products", options), token);

export const getLowStockProducts = (token: string, options: PaginationRequest = {}) =>
  authenticatedRequest<ProductsResponse>(productListPath("/api/products/low-stock", options), token);

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
