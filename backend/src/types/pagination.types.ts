export interface PaginationOptions {
  page: number;
  pageSize: number;
  searchQuery: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
