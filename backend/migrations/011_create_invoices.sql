CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  created_by INTEGER NOT NULL REFERENCES users (id),
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL DEFAULT '',
  customer_phone VARCHAR(50) NOT NULL DEFAULT '',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices (created_by);

CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products (id),
  product_name VARCHAR(150) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);
