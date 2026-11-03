-- v0.4: tienda oversize NOX $499, entrega Tala y DHL nacional.
-- Repetible, no modifica inventario reservado ni unidades vendidas.
UPDATE designs SET price_cents=49900 WHERE id~'^nox-0[1-6]$'
  AND price_cents IS NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zone text
 CHECK(shipping_zone IN('tala','national'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0
 CHECK(discount_cents >= 0);
-- No se actualizan pedidos históricos ni cantidades iniciales tras ventas.

-- Datos exclusivamente para cumplimiento operativo; no deben exponerse a clientes terceros.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_address jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
