import { query } from "../config/db";
import { Product, ProductInput, ProductRow, ProductStatus } from "../types/product.types";

export class ProductServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "ProductServiceError";
  }
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

export const getProducts = async (): Promise<Product[]> => {
  const result = await query<ProductRow>(
    `SELECT ${productColumns}
     FROM products
     ORDER BY name ASC, id ASC`,
  );
  return result.rows.map(toProduct);
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  const result = await query<ProductRow>(
    `SELECT ${productColumns}
     FROM products
     WHERE status = 'active'
       AND quantity_in_stock <= reorder_level
     ORDER BY quantity_in_stock ASC, name ASC`,
  );
  return result.rows.map(toProduct);
};

export const createProduct = async (input: ProductInput): Promise<Product> => {
  const result = await query<ProductRow>(
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
  const result = await query<ProductRow>(
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
  const result = await query<ProductRow>(
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
