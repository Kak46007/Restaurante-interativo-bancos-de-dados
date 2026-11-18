/*
# Add customer contact details to orders

1. Purpose
- Store the customer's name and phone number when an order is finalized.
- Keep existing orders intact by adding nullable columns for historical rows.

2. Modified Tables
- `orders`
- `customer_name` (text): customer name supplied at checkout.
- `customer_phone` (text): customer phone number supplied at checkout.

3. Security
- Existing RLS remains enabled on `orders`.
- Existing anon and authenticated grants and policies continue to govern these new columns.

4. Important Notes
- Existing orders are not changed or deleted.
- New orders created by the storefront will include both contact fields.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;