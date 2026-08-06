import { query as dbQuery } from "../config/db";
import { PaginationOptions } from "../types/pagination.types";
import { Product, ProductInput, ProductRow, ProductStatus } from "../types/product.types";

export class ProductServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "ProductServiceError";
  }
}

interface ProductListResult {
  products: Product[];
  totalItems: number;
}

interface ProductCountRow {
  total: string;
}

const productColumns = `id, name, category, cost_price, selling_price,
  quantity_in_stock, reorder_level, status`;

export const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  category: row.category ?? "",
  costPrice: Number(row.cost_price),
  sellingPrice: Number(row.selling_price),
  quantityInStock: row.quantity_in_stock,
  reorderLevel: row.reorder_level,
  status: row.status === "active" ? "Active" : "Inactive",
});

const listProducts = async (
  { page, pageSize, searchQuery }: PaginationOptions,
  lowStockOnly: boolean,
): Promise<ProductListResult> => {
  const lowStockFilter = lowStockOnly
    ? "AND status = 'active' AND quantity_in_stock <= reorder_level"
    : "";
  const searchFilter = "($1::text IS NULL OR name ILIKE '%' || $1 || '%' OR category ILIKE '%' || $1 || '%')";
  const offset = (page - 1) * pageSize;
  const params = [searchQuery || null, pageSize, offset];

  const [productsResult, countResult] = await Promise.all([
    dbQuery<ProductRow>(
      `SELECT ${productColumns}
       FROM products
       WHERE ${searchFilter}
         ${lowStockFilter}
       ORDER BY ${lowStockOnly ? "quantity_in_stock ASC," : ""} name ASC, id ASC
       LIMIT $2 OFFSET $3`,
      params,
    ),
    dbQuery<ProductCountRow>(
      `SELECT COUNT(*) AS total
       FROM products
       WHERE ${searchFilter}
         ${lowStockFilter}`,
      [searchQuery || null],
    ),
  ]);

  return {
    products: productsResult.rows.map(toProduct),
    totalItems: Number(countResult.rows[0].total),
  };
};

export const getProducts = (options: PaginationOptions): Promise<ProductListResult> =>
  listProducts(options, false);

export const getLowStockProducts = (options: PaginationOptions): Promise<ProductListResult> =>
  listProducts(options, true);

export const createProduct = async (input: ProductInput): Promise<Product> => {
  const result = await dbQuery<ProductRow>(
    `INSERT INTO products (
       name, category, cost_price, selling_price, quantity_in_stock, reorder_level
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${productColumns}`,
    [input.name, input.category, input.costPrice, input.sellingPrice, input.quantityInStock, input.reorderLevel],
  );
  return toProduct(result.rows[0]);
};

export const updateProduct = async (productId: number, input: ProductInput): Promise<Product> => {
  const result = await dbQuery<ProductRow>(
    `UPDATE products
     SET name = $1,
         category = $2,
         cost_price = $3,
         selling_price = $4,
         quantity_in_stock = $5,
         reorder_level = $6,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING ${productColumns}`,
    [input.name, input.category, input.costPrice, input.sellingPrice, input.quantityInStock, input.reorderLevel, productId],
  );

  if (!result.rowCount) throw new ProductServiceError("Product not found.", 404);
  return toProduct(result.rows[0]);
};

export const updateProductStatus = async (productId: number, status: ProductStatus): Promise<Product> => {
  const result = await dbQuery<ProductRow>(
    `UPDATE products
     SET status = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING ${productColumns}`,
    [status.toLowerCase(), productId],
  );

  if (!result.rowCount) throw new ProductServiceError("Product not found.", 404);
  return toProduct(result.rows[0]);
};
