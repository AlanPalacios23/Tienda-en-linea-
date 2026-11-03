-- NOX: seis diseños de playera, con tres M y dos L por diseño.
CREATE TABLE IF NOT EXISTS designs (
  id text PRIMARY KEY CHECK (id ~ '^nox-0[1-6]$'),
  name text NOT NULL,
  description text NOT NULL,
  artwork_path text NOT NULL,
  price_cents integer CHECK (price_cents IS NULL OR price_cents > 0),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS inventory (
  sku text PRIMARY KEY,
  design_id text NOT NULL REFERENCES designs(id),
  size text NOT NULL CHECK (size IN ('M','L')),
  total integer NOT NULL CHECK (total >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  sold integer NOT NULL DEFAULT 0 CHECK (sold >= 0),
  UNIQUE(design_id,size),
  CHECK (reserved+sold<=total)
);
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  request_id uuid UNIQUE NOT NULL,
  status text NOT NULL CHECK(status IN ('creating','pending','payment_pending','paid','expired','failed','needs_review')),
  currency text NOT NULL DEFAULT 'mxn' CHECK(currency='mxn'),
  items_cents integer NOT NULL CHECK(items_cents>0),
  shipping_cents integer NOT NULL CHECK(shipping_cents>=0),
  amount_cents integer NOT NULL CHECK(amount_cents=items_cents+shipping_cents),
  checkout_expires_at timestamptz NOT NULL,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
  order_id uuid REFERENCES orders(id),
  sku text REFERENCES inventory(sku),
  quantity integer NOT NULL CHECK(quantity>0),
  unit_price_cents integer NOT NULL CHECK(unit_price_cents>0),
  PRIMARY KEY(order_id,sku)
);
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_pending_expiry ON orders(checkout_expires_at)
 WHERE status IN ('creating','pending','payment_pending');
INSERT INTO designs(id,name,description,artwork_path,price_cents) VALUES
  ('nox-01','NOX ECLIPSE','Gráfico circular original en una playera de concepto.','/assets/nox-01.svg',NULL),
  ('nox-02','NOX STATIC','Patrón de franjas geométricas sobre una playera.','/assets/nox-02.svg',NULL),
  ('nox-03','NOX ORBIT','Órbitas que se encuentran en una composición minimalista.','/assets/nox-03.svg',NULL),
  ('nox-04','NOX PULSE','Trazo rítmico y silueta limpia.','/assets/nox-04.svg',NULL),
  ('nox-05','NOX SHIFT','Tipografía y bloques desplazados.','/assets/nox-05.svg',NULL),
  ('nox-06','NOX VOID','Estrella abstracta y contraste monocromático.','/assets/nox-06.svg',NULL)
ON CONFLICT(id) DO NOTHING;
INSERT INTO inventory(sku,design_id,size,total)
 SELECT id||'-M',id,'M',3 FROM designs ON CONFLICT(sku) DO NOTHING;
INSERT INTO inventory(sku,design_id,size,total)
 SELECT id||'-L',id,'L',2 FROM designs ON CONFLICT(sku) DO NOTHING;
-- Migraciones repetidas no restablecen stock que haya sido reservado o vendido.
