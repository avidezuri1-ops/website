-- Sequential public order numbers. Starts at ADZ001 after the owner cleared existing orders.
CREATE TABLE IF NOT EXISTS order_number_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_value INTEGER NOT NULL CHECK (next_value >= 1)
);
INSERT OR IGNORE INTO order_number_sequence (id, next_value) VALUES (1, 1);

CREATE TABLE IF NOT EXISTS order_tracking_attempts (
  ip_hash TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts >= 1)
);
