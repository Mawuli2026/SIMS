CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  cashier_id INTEGER NOT NULL REFERENCES users (id),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales (cashier_id);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products (id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id);
