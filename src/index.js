const ALLOWED_ORIGINS = new Set(["https://avidezuri.com", "https://www.avidezuri.com", "https://admin.avidezuri.com"]);
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
function encode64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replaceAll("+", "-").replaceAll("/", "_");
}
function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const part = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return part ? part.slice(name.length + 1) : "";
}
async function sessionKey(env) {
  if (!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) return null;
  return crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function makeSession(email, env) {
  const key = await sessionKey(env);
  if (!key) throw new Error("Admin session secret is not configured.");
  const payload = encode64url(new TextEncoder().encode(JSON.stringify({ email, exp: Math.floor(Date.now()/1000) + 8*60*60 })));
  const data = new TextEncoder().encode(payload);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return payload + "." + encode64url(new Uint8Array(signature));
}
async function verifySession(request, env) {
  const token = cookieValue(request, "avz_admin_session");
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const key = await sessionKey(env);
    if (!key) return null;
    const valid = await crypto.subtle.verify("HMAC", key, b64url(parts[1]), new TextEncoder().encode(parts[0]));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64url(parts[0])));
    if (payload.email !== String(env.ADMIN_EMAIL || "").toLowerCase() || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now()/1000)) return null;
    return payload.email;
  } catch { return null; }
}
async function adminAuth(request, env, url) {
  if (url.pathname === "/api/admin/login" && request.method === "POST") {
    if (request.headers.get("origin") !== "https://admin.avidezuri.com") return fail("Login must be submitted from the admin site.", 403);
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) {
      // Temporary diagnostic: log presence only, never secret values.
      console.warn("Admin login configuration check", {
        emailConfigured: Boolean(env.ADMIN_EMAIL),
        passwordConfigured: Boolean(env.ADMIN_PASSWORD),
        sessionSecretConfigured: Boolean(env.ADMIN_SESSION_SECRET),
        sessionSecretLength: typeof env.ADMIN_SESSION_SECRET === "string" ? env.ADMIN_SESSION_SECRET.length : 0
      });
      return fail("Admin login is not configured yet.", 503);
    }
    let body;
    try { body = await request.json(); } catch { return fail("Invalid login details."); }
    const email = safeText(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (email !== env.ADMIN_EMAIL.toLowerCase() || password !== env.ADMIN_PASSWORD) return fail("Incorrect email or password.", 401);
    const token = await makeSession(email, env);
    return json({ ok: true, email }, 200, { "set-cookie": "avz_admin_session=" + token + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800" });
  }
  if (url.pathname === "/api/admin/logout" && request.method === "POST") {
    if (request.headers.get("origin") !== "https://admin.avidezuri.com") return fail("Logout must be submitted from the admin site.", 403);
    return json({ ok: true }, 200, { "set-cookie": "avz_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" });
  }
  if (url.pathname === "/api/admin/session" && request.method === "GET") {
    const email = await verifySession(request, env);
    return email ? json({ authenticated: true, email }) : fail("Authentication required.", 401);
  }
  return null;
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
  const adminEmail = await verifySession(request, env);
  if (!adminEmail) return fail("Authentication required.", 401);
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
  const detailMatch = url.pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
  if (request.method === "GET" && detailMatch) {
    const id = Number(detailMatch[1]);
    const order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
    if (!order) return fail("Order not found.", 404);
    const [items, history] = await Promise.all([
      env.DB.prepare("SELECT product_name,size_ml,unit_price_pkr,quantity,line_total_pkr FROM order_items WHERE order_id=? ORDER BY id").bind(id).all(),
      env.DB.prepare("SELECT old_status,new_status,changed_at,changed_by FROM order_status_history WHERE order_id=? ORDER BY changed_at DESC,id DESC").bind(id).all()
    ]);
    return json({ order, items: items.results || [], history: history.results || [] });
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
      env.DB.prepare("INSERT INTO order_status_history (order_id,old_status,new_status,changed_by) VALUES (?,?,?,?)").bind(id, current.status, next, ("admin:" + adminEmail))
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
      if ((request.method === "POST" || request.method === "PATCH") && origin !== "https://admin.avidezuri.com") {
        return fail("Admin requests must come from the admin site.", 403);
      }
      const authResponse = await adminAuth(request, env, url);
      const response = authResponse || await adminApi(request, env, url);
      Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
      return response;
    }
    if (url.hostname.toLowerCase() === "admin.avidezuri.com" && url.pathname === "/" && request.method === "GET" && env.ASSETS) {
      return env.ASSETS.fetch(new Request(new URL("/admin/index.html", url), request));
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return fail("Not found.", 404);
  }
};