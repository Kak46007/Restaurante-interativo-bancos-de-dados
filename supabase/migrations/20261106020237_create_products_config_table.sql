/*
# Create products_config table

1. New Tables
- `products_config`
  - `product_id` (text, primary key) — matches the static Product.id from the codebase
  - `sold_out` (boolean, default false) — whether the item is marked as sold out / unavailable
  - `price` (numeric, nullable) — optional override for the product price
  - `price_label` (text, nullable) — optional override for a custom price label (e.g. "Consulte o valor")
  - `name` (text, nullable) — optional override for the product name
  - `description` (text, nullable) — optional override for the short description
  - `long_description` (text, nullable) — optional override for the detailed description
  - `updated_at` (timestamptz) — last modification timestamp

2. Security
- Enable RLS on `products_config`.
- Grant CRUD to `anon` + `authenticated` so the Data API can reach the table.
- Allow anon + authenticated CRUD because this is a single-tenant app with no sign-in.
*/

CREATE TABLE IF NOT EXISTS products_config (
  product_id text PRIMARY KEY,
  sold_out boolean NOT NULL DEFAULT false,
  price numeric(10,2),
  price_label text,
  name text,
  description text,
  long_description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products_config ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON products_config TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_products_config" ON products_config;
CREATE POLICY "anon_select_products_config" ON products_config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products_config" ON products_config;
CREATE POLICY "anon_insert_products_config" ON products_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products_config" ON products_config;
CREATE POLICY "anon_update_products_config" ON products_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products_config" ON products_config;
CREATE POLICY "anon_delete_products_config" ON products_config FOR DELETE
  TO anon, authenticated USING (true);
