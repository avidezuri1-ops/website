const ALLOWED_ORIGINS = new Set(["https://avidezuri.com", "https://www.avidezuri.com"]);
const STATUSES = new Set(["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]);
const SIZES = new Set([30, 50, 100]);

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}
function corsHeaders(origin) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return { "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,PATCH,OPTIONS", "access-control-allow-headers": "content-type", "vary": "Origin" };
}
function fail(message, status = 400) { return json({ error: message }, status); }
function safeText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function slugify(value) {
  return String(value).toLowerCase().replace(/[\u2019']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function orderNumber() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return "AVZ-" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
function b64url(input) {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
}
async function verifyAccess(request, env) {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64url(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(b64url(parts[1])));
    const issuer = "https://" + env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (header.alg !== "RS256" || claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || claims.exp <= now || (claims.nbf && claims.nbf > now + 60)) return false;
    const jwksUrl = issuer + "/cdn-cgi/access/certs";
    const response = await fetch(jwksUrl, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!response.ok) return false;
    const jwks = await response.json();
    const jwk = jwks.keys?.find(k => k.kid === header.kid && k.kty === "RSA");
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  } catch { return false; }
}
async function createOrder(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail("Invalid JSON body."); }
  const customerName = safeText(body.customer_name, 100);
  const phone = safeText(body.phone, 30);
  const city = safeText(body.city || "Karachi", 80);
  const area = safeText(body.area, 100);
  const address = safeText(body.address, 500);
  const notes = safeText(body.notes, 500);
  if (!customerName || !phone || phone.replace(/\D/g, "").length < 7 || !area || !address) return fail("Please provide a name, valid phone, delivery area and address.");
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) return fail("Order must contain between 1 and 30 item lines.");
  const normalized = [];
  for (const item of body.items) {
    const slug = safeText(item.slug, 100);
    const size = Number(item.size_ml);
    const quantity = Number(item.quantity);
    if (!slug || !SIZES.has(size) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return fail("One or more order items are invalid.");
    const row = await env.DB.prepare(
      "SELECT p.id, p.name, p.active, pp.price_pkr FROM products p JOIN product_prices pp ON pp.product_id=p.id WHERE p.slug=? AND pp.size_ml=?"
    ).bind(slug, size).first();
    if (!row || row.active !== 1) return fail("A selected perfume is unavailable. Please refresh the catalogue.", 409);
    normalized.push({ product_id: row.id, product_name: row.name, size_ml: size, unit_price_pkr: row.price_pkr, quantity, line_total_pkr: row.price_pkr * quantity });
  }
  const zone = await env.DB.prepare("SELECT fee_pkr FROM delivery_zones WHERE city=? AND area=? AND active=1").bind(city, area).first();
  if (!zone) return fail("The selected delivery area is unavailable. Please contact Avidezuri.", 422);
  const subtotal = normalized.reduce((sum, item) => sum + item.line_total_pkr, 0);
  const total = subtotal + zone.fee_pkr;
  if (!Number.isSafeInteger(total) || total > 10000000) return fail("Order total is outside the allowed range.");
  const number = orderNumber();
  let inserted = null;
  try {
    inserted = await env.DB.prepare(
      "INSERT INTO orders (order_number,customer_name,phone,city,area,address,notes,subtotal_pkr,delivery_fee_pkr,total_pkr,payment_method,status) VALUES (?,?,?,?,?,?,?,?,?,?, 'COD','Pending') RETURNING id, order_number, total_pkr, created_at"
    ).bind(number, customerName, phone, city, area, address, notes || null, subtotal, zone.fee_pkr, total).first();
    const statements = normalized.map(item => env.DB.prepare(
      "INSERT INTO order_items (order_id,product_id,product_name,size_ml,unit_price_pkr,quantity,line_total_pkr) VALUES (?,?,?,?,?,?,?)"
    ).bind(inserted.id, item.product_id, item.product_name, item.size_ml, item.unit_price_pkr, item.quantity, item.line_total_pkr));
    statements.push(env.DB.prepare("INSERT INTO order_status_history (order_id,old_status,new_status,changed_by) VALUES (?,NULL,'Pending','checkout')").bind(inserted.id));
    await env.DB.batch(statements);
    return json({ ok: true, order: { order_number: inserted.order_number, subtotal_pkr: subtotal, delivery_fee_pkr: zone.fee_pkr, total_pkr: total, payment_method: "COD", created_at: inserted.created_at }, items: normalized });
  } catch (error) {
    // If line-item/history insertion fails after the order row is created,
    // remove the incomplete order so the customer is not left with a partial record.
    if (inserted?.id) {
      try {
        await env.DB.prepare("DELETE FROM orders WHERE id=?").bind(inserted.id).run();
      } catch (cleanupError) {
        console.error("Order cleanup failed for order id:", inserted.id);
      }
    }
    return fail("Could not save your order. Please try again or contact Avidezuri.", 500);
  }
}
async function adminApi(request, env, url) {
  if (!(await verifyAccess(request, env))) return fail("Authentication required.", 401);
  if (request.method === "GET" && url.pathname === "/api/admin/orders") {
    const q = safeText(url.searchParams.get("q"), 100);
    const status = safeText(url.searchParams.get("status"), 20);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 100);
    let sql = "SELECT id,order_number,customer_name,phone,city,area,subtotal_pkr,delivery_fee_pkr,total_pkr,payment_method,status,created_at,updated_at FROM orders";
    const where = [], values = [];
    if (q) { where.push("(order_number LIKE ? OR phone LIKE ? OR customer_name LIKE ?)"); values.push("%"+q+"%", "%"+q+"%", "%"+q+"%"); }
    if (status && STATUSES.has(status)) { where.push("status=?"); values.push(status); }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY created_at DESC LIMIT ?";
    values.push(limit);
    const result = await env.DB.prepare(sql).bind(...values).all();
    return json({ orders: result.results || [] });
  }
  const match = url.pathname.match(/^\/api\/admin\/orders\/(\d+)\/status$/);
  if (request.method === "PATCH" && match) {
    let body;
    try { body = await request.json(); } catch { return fail("Invalid JSON body."); }
    const next = safeText(body.status, 20);
    if (!STATUSES.has(next)) return fail("Invalid order status.");
    const id = Number(match[1]);
    const current = await env.DB.prepare("SELECT status FROM orders WHERE id=?").bind(id).first();
    if (!current) return fail("Order not found.", 404);
    if (current.status === next) return json({ ok: true, status: next });
    await env.DB.batch([
      env.DB.prepare("UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next, id),
      env.DB.prepare("INSERT INTO order_status_history (order_id,old_status,new_status,changed_by) VALUES (?,?,?,?)").bind(id, current.status, next, "cloudflare-access")
    ]);
    return json({ ok: true, status: next });
  }
  return fail("Not found.", 404);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") {
      if (!cors["access-control-allow-origin"]) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) return fail("Origin not allowed.", 403);
    if (url.pathname === "/api/health" && request.method === "GET") return json({ ok: true, service: "avidezuri-api" }, 200, cors);
    if (url.pathname === "/api/orders" && request.method === "POST") {
      const response = await createOrder(request, env);
      Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
      return response;
    }
    if (url.pathname.startsWith("/api/admin/")) {
      const response = await adminApi(request, env, url);
      Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
      return response;
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return fail("Not found.", 404);
  }
};