import { PaginationMeta, PaginationOptions } from "../types/pagination.types";

export const DEFAULT_PAGE_SIZE = 20;
export const MAXIMUM_PAGE_SIZE = 100;

const firstQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  return typeof value === "string" ? value : "";
};

const positiveInteger = (value: unknown, fallback: number, maximum?: number): number => {
  const parsed = Number(firstQueryValue(value));
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
};

export const parsePaginationQuery = (query: Record<string, unknown>): PaginationOptions => ({
  page: positiveInteger(query.page, 1),
  pageSize: positiveInteger(query.pageSize, DEFAULT_PAGE_SIZE, MAXIMUM_PAGE_SIZE),
  searchQuery: firstQueryValue(query.q).trim().slice(0, 100),
});

export const createPaginationMeta = (totalItems: number, page: number, pageSize: number): PaginationMeta => ({
  page,
  pageSize,
  totalItems,
  totalPages: Math.ceil(totalItems / pageSize),
});
