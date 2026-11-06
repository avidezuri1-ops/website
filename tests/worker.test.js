import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const origin = "https://avidezuri.com";
function req(path, options = {}) {
  return new Request("https://avidezuri.com" + path, {
    method: options.method || "GET",
    headers: {
      ...(options.origin ? { origin: options.origin } : {}),
      ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(options.headers || {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
}

function dbMock() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() {
          calls.push({ sql, args });
          if (sql.includes("FROM products")) return { id: 1, name: "DE FLORA", active: 1, price_pkr: 1450 };
          if (sql.includes("FROM delivery_zones")) return { fee_pkr: 200 };
          if (sql.includes("INSERT INTO orders")) return { id: 9, order_number: "AVZ-TEST", total_pkr: 1650, created_at: "2026-11-06" };
          return null;
        },
        async all() { return { results: [] }; },
        async run() { return { success: true }; }
      };
    },
    async batch(statements) { calls.push({ batch: statements.length }); return []; }
  };
}

test("health endpoint returns service status and security headers", async () => {
  const response = await worker.fetch(req("/api/health"), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, "avidezuri-api");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("untrusted origins are rejected", async () => {
  const response = await worker.fetch(req("/api/health", { origin: "https://untrusted.example" }), {});
  assert.equal(response.status, 403);
});

test("checkout rejects invalid origin and content type", async () => {
  const db = dbMock();
  const wrongOrigin = await worker.fetch(req("/api/orders", { method: "POST", origin: "https://untrusted.example", body: {} }), { DB: db });
  assert.equal(wrongOrigin.status, 403);
  const wrongType = await worker.fetch(req("/api/orders", { method: "POST", origin, headers: { "content-type": "text/plain" }, body: {} }), { DB: db });
  assert.equal(wrongType.status, 415);
});

test("checkout rejects missing customer details before querying D1", async () => {
  const db = dbMock();
  const response = await worker.fetch(req("/api/orders", { method: "POST", origin, body: { items: [] } }), { DB: db });
  assert.equal(response.status, 400);
  assert.equal(db.calls.length, 0);
});

test("checkout rejects invalid size and quantity", async () => {
  const db = dbMock();
  const response = await worker.fetch(req("/api/orders", {
    method: "POST", origin,
    body: { customer_name: "Test", phone: "03001234567", area: "Saddar", address: "Test address", items: [{ slug: "de-flora", size_ml: 500, quantity: 1 }] }
  }), { DB: db });
  assert.equal(response.status, 400);
  assert.equal(db.calls.length, 0);
});

test("valid checkout uses D1 prices and delivery fee for its total", async () => {
  const db = dbMock();
  const response = await worker.fetch(req("/api/orders", {
    method: "POST", origin,
    body: { customer_name: "Test", phone: "03001234567", area: "Saddar", address: "Test address", items: [{ slug: "de-flora", size_ml: 30, quantity: 1 }] }
  }), { DB: db });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.order.subtotal_pkr, 1450);
  assert.equal(payload.order.delivery_fee_pkr, 200);
  assert.equal(payload.order.total_pkr, 1650);
  assert.equal(db.calls.at(-1).batch, 2);
});

test("existing migration keeps core order and catalogue tables", async () => {
  const fs = await import("node:fs/promises");
  const sql = await fs.readFile(new URL("../migrations/0001_order_management.sql", import.meta.url), "utf8");
  for (const name of ["products", "product_prices", "delivery_zones", "orders", "order_items", "order_status_history"]) {
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS " + name));
  }
});
