
-- Avidezuri order management schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exclusive','budget')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_prices (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_ml INTEGER NOT NULL CHECK (size_ml IN (30,50,100)),
  price_pkr INTEGER NOT NULL CHECK (price_pkr >= 0),
  PRIMARY KEY (product_id, size_ml)
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL DEFAULT 'Karachi',
  area TEXT NOT NULL UNIQUE,
  fee_pkr INTEGER NOT NULL CHECK (fee_pkr BETWEEN 0 AND 100000),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Karachi',
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  subtotal_pkr INTEGER NOT NULL CHECK (subtotal_pkr >= 0),
  delivery_fee_pkr INTEGER NOT NULL CHECK (delivery_fee_pkr >= 0),
  total_pkr INTEGER NOT NULL CHECK (total_pkr = subtotal_pkr + delivery_fee_pkr),
  payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method = 'COD'),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Packed','Shipped','Delivered','Cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  size_ml INTEGER NOT NULL CHECK (size_ml IN (30,50,100)),
  unit_price_pkr INTEGER NOT NULL CHECK (unit_price_pkr >= 0),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  line_total_pkr INTEGER NOT NULL CHECK (line_total_pkr = unit_price_pkr * quantity)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by TEXT NOT NULL DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS store_price_policy (
  size_ml INTEGER PRIMARY KEY CHECK (size_ml IN (30,50,100)),
  price_pkr INTEGER NOT NULL
);

INSERT OR REPLACE INTO store_price_policy(size_ml,price_pkr) VALUES
  (30,1750),(50,2550),(100,4500);
