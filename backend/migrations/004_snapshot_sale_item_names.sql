ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS product_name VARCHAR(150);

UPDATE sale_items
SET product_name = products.name
FROM products
WHERE sale_items.product_id = products.id
  AND sale_items.product_name IS NULL;

ALTER TABLE sale_items
ALTER COLUMN product_name SET NOT NULL;
