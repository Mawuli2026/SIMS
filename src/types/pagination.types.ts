export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationRequest {
  page?: number;
  pageSize?: number;
  query?: string;
}
