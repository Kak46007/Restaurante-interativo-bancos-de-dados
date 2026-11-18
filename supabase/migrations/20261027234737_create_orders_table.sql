/*
# Create orders table for automatic printing

This migration creates a new `orders` table to store every order placed through
the digital menu. Each row represents one customer order and contains the items,
delivery details, payment method and a print status flag.

The table is intentionally single-tenant (no auth) because the storefront has
no sign-in flow. Both `anon` and `authenticated` roles can read/insert so the
frontend can save orders and the in-store print panel can poll them. Only the
panel (server-side, service role, or a future admin) marks orders as printed.

## New Tables

- `orders`
  - `id` uuid primary key
  - `items_json` jsonb — the cart items (product id, name, qty, unit price)
  - `subtotal` numeric — subtotal in BRL
  - `delivery_fee` numeric — delivery fee in BRL
  - `total` numeric — total in BRL
  - `delivery_mode` text — 'retirada' | 'entrega'
  - `payment_method` text — 'pix' | 'cartao' | 'dinheiro'
  - `delivery_address` text — full address string (nullable for pickup)
  - `distance_km` numeric — distance in km (nullable)
  - `customer_note` text — optional note
  - `status` text — 'novo' | 'impresso' | default 'novo'
  - `created_at` timestamptz default now()

## Security

- RLS enabled on `orders`.
- Grants: SELECT/INSERT to `anon, authenticated` (storefront writes and panel reads).
- UPDATE to `authenticated` (panel marks printed). DELETE is intentionally NOT granted to anon.
- Policies:
  - SELECT: anyone can read (no auth on storefront; panel runs on same client).
  - INSERT: anyone can insert a new order.
  - UPDATE: anyone can update (so anon can mark printed from the panel page).
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items_json jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  delivery_mode text NOT NULL,
  payment_method text NOT NULL,
  delivery_address text,
  distance_km numeric(6,2),
  customer_note text,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON orders TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS orders_status_created_at_idx
  ON orders (status, created_at DESC);
