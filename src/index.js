const ALLOWED_ORIGINS = new Set(["https://avidezuri.com", "https://www.avidezuri.com", "https://admin.avidezuri.com"]);
function isTrustedAdminOrigin(origin, request) {
  if (!origin) return false;
  let parsed;
  try { parsed = new URL(origin); } catch { return false; }
  if (parsed.origin !== origin || parsed.origin !== new URL(request.url).origin) return false;
  return parsed.hostname === "admin.avidezuri.com" ||
    /^(?:(?:fix|feature)-[a-z0-9-]+|[a-f0-9]{8})\.avidezuri\.com$/i.test(parsed.hostname) ||
    /^(?:(?:fix|feature)-[a-z0-9-]+|[a-f0-9]{8})-website\.avidezuri1\.workers\.dev$/i.test(parsed.hostname);
}
function isAllowedOrigin(origin, request) {
  return ALLOWED_ORIGINS.has(origin) || isTrustedAdminOrigin(origin, request);
}
const STATUSES = new Set(["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]);
const SIZES = new Set([30, 50, 100]);

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000"
};

function secureResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function json(data, status = 200, headers = {}) {
  const responseHeaders = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers
  });
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) responseHeaders.set(name, value);
  return new Response(JSON.stringify(data), { status, headers: responseHeaders });
}
function corsHeaders(origin, request) {
  if (!origin || !(ALLOWED_ORIGINS.has(origin) || isTrustedAdminOrigin(origin, request))) return {};
  return { "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,PATCH,OPTIONS", "access-control-allow-headers": "content-type, x-csrf-token", "vary": "Origin" };
}
function fail(message, status = 400) { return json({ error: message }, status); }
function safeText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function slugify(value) {
  return String(value).toLowerCase().replace(/[\u2019']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
async function orderNumber(env) {
  const row = await env.DB.prepare(
    "UPDATE order_number_sequence SET next_value = next_value + 1 WHERE id = 1 RETURNING next_value - 1 AS sequence"
  ).first();
  if (!row || !Number.isSafeInteger(Number(row.sequence)) || Number(row.sequence) < 1) {
    throw new Error("Order number sequence is not initialized.");
  }
  return "ADZ" + String(row.sequence).padStart(3, "0");
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

const ROLE_PERMISSIONS = {
  super_admin: ["orders.read","orders.update","customers.read","products.read","products.manage","inventory.read","inventory.manage","reports.read","admins.manage","settings.manage","audit.read"],
  order_manager: ["orders.read","orders.update","customers.read"],
  product_manager: ["products.read","products.manage"],
  inventory_manager: ["inventory.read","inventory.manage"],
  analyst: ["reports.read"]
};
const SUPER_ONLY = new Set(["admins.manage","settings.manage","audit.read"]);
function randomToken(bytes=32) { return encode64url(crypto.getRandomValues(new Uint8Array(bytes))); }
async function passwordHash(password, salt, iterations=100000) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations,hash:"SHA-256"}, material, 256);
  return new Uint8Array(bits);
}
function constantEqual(a,b) {
  if (a.length !== b.length) return false;
  let diff=0; for(let i=0;i<a.length;i++) diff |= a[i]^b[i];
  return diff===0;
}
async function verifyPassword(password,user) {
  try {
    const actual=await passwordHash(password,b64url(user.password_salt),Number(user.password_iterations)||100000);
    return constantEqual(actual,b64url(user.password_hash));
  } catch { return false; }
}
async function bootstrapSuperAdmin(env) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return null;
  const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM admin_users").first();
  if (Number(count?.total)>0) return null;
  const email=String(env.ADMIN_EMAIL).trim().toLowerCase();
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iterations=100000;
  const hash=await passwordHash(env.ADMIN_PASSWORD,salt,iterations);
  await env.DB.prepare("INSERT OR IGNORE INTO admin_users (email,display_name,password_hash,password_salt,password_iterations,role,is_active,must_change_password) VALUES (?,?,?,?,?,'super_admin',1,0)")
    .bind(email,email.split("@")[0],encode64url(hash),encode64url(salt),iterations).run();
  return await env.DB.prepare("SELECT * FROM admin_users WHERE email=?").bind(email).first();
}
async function makeSession(admin, env) {
  const key=await sessionKey(env);
  if(!key) throw new Error("Admin session secret is not configured.");
  const csrf=randomToken(24);
  const payload=encode64url(new TextEncoder().encode(JSON.stringify({id:admin.id,email:admin.email,sv:admin.session_version,csrf,exp:Math.floor(Date.now()/1000)+8*60*60})));
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload));
  return {token:payload+"."+encode64url(new Uint8Array(signature)),csrf};
}
async function verifySession(request,env) {
  const parts=cookieValue(request,"avz_admin_session").split(".");
  if(parts.length!==2) return null;
  try {
    const key=await sessionKey(env);
    if(!key || !await crypto.subtle.verify("HMAC",key,b64url(parts[1]),new TextEncoder().encode(parts[0]))) return null;
    const payload=JSON.parse(new TextDecoder().decode(b64url(parts[0])));
    if(!Number.isInteger(payload.id)||!Number.isFinite(payload.exp)||payload.exp<=Math.floor(Date.now()/1000)||typeof payload.csrf!=="string") return null;
    const admin=await env.DB.prepare("SELECT id,email,display_name,role,is_active,must_change_password,session_version FROM admin_users WHERE id=?").bind(payload.id).first();
    if(!admin || admin.is_active!==1 || Number(admin.session_version)!==Number(payload.sv)) return null;
    const overrides=await env.DB.prepare("SELECT permission,allowed FROM admin_permission_overrides WHERE admin_id=?").bind(admin.id).all();
    const permissions=new Set(ROLE_PERMISSIONS[admin.role]||[]);
    for(const row of overrides.results||[]) {
      if(SUPER_ONLY.has(row.permission) && admin.role!=="super_admin") continue;
      if(row.allowed===1) permissions.add(row.permission); else permissions.delete(row.permission);
    }
    return {...admin,csrf:payload.csrf,permissions:[...permissions]};
  } catch { return null; }
}
async function adminAuth(request,env,url) {
  if(url.pathname==="/api/admin/login" && request.method==="POST") {
    if(!isTrustedAdminOrigin(request.headers.get("origin"),request)) return fail("Login must be submitted from the admin site.",403);
    if(!env.DB || !env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length<32) return fail("Admin login is not configured yet.",503);
    let body; try{body=await request.json()}catch{return fail("Invalid login details.");}
    const email=safeText(body.email,254).toLowerCase(), password=typeof body.password==="string"?body.password:"";
    if(!email || !password || password.length>1024) return fail("Incorrect email or password.",401);
    const now=Math.floor(Date.now()/1000);
    const attempt=await env.DB.prepare("SELECT attempts,window_started_at,locked_until FROM admin_login_attempts WHERE email_key=?").bind(email).first();
    if(attempt && Number(attempt.locked_until)>now) return fail("Too many sign-in attempts. Try again later.",429);
    let admin=await env.DB.prepare("SELECT * FROM admin_users WHERE email=?").bind(email).first();
    if(!admin) {
      const total=await env.DB.prepare("SELECT COUNT(*) AS total FROM admin_users").first();
      if(Number(total?.total)===0 && email===String(env.ADMIN_EMAIL||"").toLowerCase()) {
        await bootstrapSuperAdmin(env);
        admin=await env.DB.prepare("SELECT * FROM admin_users WHERE email=?").bind(email).first();
      }
    }
    if(!admin || admin.is_active!==1 || !await verifyPassword(password,admin)) {
      const within=attempt && now-Number(attempt.window_started_at)<900;
      const attempts=within?Number(attempt.attempts)+1:1;
      await env.DB.prepare("INSERT INTO admin_login_attempts (email_key,attempts,window_started_at,locked_until) VALUES (?,?,?,?) ON CONFLICT(email_key) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at,locked_until=excluded.locked_until")
        .bind(email,attempts,within?Number(attempt.window_started_at):now,attempts>=5?now+900:0).run();
      return fail(attempts>=5?"Too many sign-in attempts. Try again in 15 minutes.":"Incorrect email or password.",attempts>=5?429:401);
    }
    await env.DB.prepare("DELETE FROM admin_login_attempts WHERE email_key=?").bind(email).run();
    await env.DB.prepare("UPDATE admin_users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?").bind(admin.id).run();
    const session=await makeSession(admin,env);
    const permissions=ROLE_PERMISSIONS[admin.role]||[];
    return json({ok:true,email:admin.email,display_name:admin.display_name,role:admin.role,permissions,must_change_password:admin.must_change_password===1,csrf:session.csrf},200,{"set-cookie":"avz_admin_session="+session.token+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800"});
  }
  if(url.pathname==="/api/admin/logout" && request.method==="POST") {
    if(!isTrustedAdminOrigin(request.headers.get("origin"),request)) return fail("Logout must be submitted from the admin site.",403);
    const admin=await verifySession(request,env);
    if(admin && request.headers.get("x-csrf-token")!==admin.csrf) return fail("Security token expired. Refresh and try again.",403);
    return json({ok:true},200,{"set-cookie":"avz_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"});
  }
  if(url.pathname==="/api/admin/session" && request.method==="GET") {
    const admin=await verifySession(request,env);
    return admin?json({authenticated:true,email:admin.email,display_name:admin.display_name,role:admin.role,permissions:admin.permissions,must_change_password:admin.must_change_password===1,csrf:admin.csrf}):fail("Authentication required.",401);
  }
  return null;
}

async function createOrder(request, env) {
  let rawBody;
  try { rawBody = await request.text(); } catch { return fail("Could not read order details."); }
  if (new TextEncoder().encode(rawBody).byteLength > 32768) return fail("Order request is too large.", 413);
  let body;
  try { body = JSON.parse(rawBody); } catch { return fail("Invalid JSON body."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid order details.");
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
  let number;
  try { number = await orderNumber(env); } catch (error) {
    console.error("Order number sequence unavailable.");
    return fail("Orders are temporarily unavailable. Please try again shortly.", 503);
  }
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

async function writeAudit(env,actor,target,action,details={}) {
  await env.DB.prepare("INSERT INTO admin_audit_log (actor_admin_id,target_admin_id,action,details_json) VALUES (?,?,?,?)")
    .bind(actor.id,target||null,action,JSON.stringify(details)).run();
}
function hasPermission(admin,permission) { return admin.role==="super_admin" || admin.permissions.includes(permission); }
async function adminApi(request,env,url) {
  const admin=await verifySession(request,env);
  if(!admin) return fail("Authentication required.",401);
  if(["POST","PATCH","DELETE"].includes(request.method) && request.headers.get("x-csrf-token")!==admin.csrf) return fail("Security token expired. Refresh and try again.",403);
  if(admin.must_change_password && !["/api/admin/session","/api/admin/logout","/api/admin/password"].includes(url.pathname)) return fail("Change your temporary password before continuing.",403);
  if(request.method==="POST" && url.pathname==="/api/admin/password") {
    let body;try{body=await request.json()}catch{return fail("Invalid password request.");}
    const password=typeof body.password==="string"?body.password:"";
    if(password.length<12 || password.length>256) return fail("Password must be between 12 and 256 characters.");
    const salt=crypto.getRandomValues(new Uint8Array(16)),iterations=100000,hash=await passwordHash(password,salt,iterations);
    await env.DB.prepare("UPDATE admin_users SET password_hash=?,password_salt=?,password_iterations=?,must_change_password=0,session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(encode64url(hash),encode64url(salt),iterations,admin.id).run();
    await writeAudit(env,admin,admin.id,"admin.password_changed");
    return json({ok:true},200,{"set-cookie":"avz_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"});
  }
  if(request.method==="GET" && url.pathname==="/api/admin/analytics") {
    if(!hasPermission(admin,"reports.read")) return fail("You do not have permission to view sales analytics.",403);
    const start=safeText(url.searchParams.get("start"),10),end=safeText(url.searchParams.get("end"),10);
    const period=safeText(url.searchParams.get("period"),10)||"day";
    const validDate=value=>/^\\d{4}-\\d{2}-\\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+"T00:00:00Z"));
    if(!validDate(start)||!validDate(end)||start>end) return fail("Choose a valid date range.");
    if(!["day","week","month"].includes(period)) return fail("Choose a valid chart interval.");
    const range="date(created_at) BETWEEN date(?) AND date(?)";
    const totals=await env.DB.prepare(
      "SELECT COUNT(*) AS total_orders, SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) AS pending_orders, SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) AS delivered_orders, SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) AS cancelled_orders, COALESCE(SUM(CASE WHEN status!='Cancelled' THEN total_pkr ELSE 0 END),0) AS revenue_pkr, COALESCE(SUM(CASE WHEN status='Delivered' THEN total_pkr ELSE 0 END),0) AS delivered_revenue_pkr FROM orders WHERE "+range
    ).bind(start,end).first();
    const dateFormat=period==="month"?"%Y-%m":period==="week"?"%Y-W%W":"%Y-%m-%d";
    const trend=await env.DB.prepare(
      "SELECT strftime(?,created_at) AS bucket, COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status!='Cancelled' THEN total_pkr ELSE 0 END),0) AS revenue_pkr FROM orders WHERE "+range+" GROUP BY bucket ORDER BY bucket"
    ).bind(dateFormat,start,end).all();
    const products=await env.DB.prepare(
      "SELECT oi.product_name, oi.size_ml, SUM(oi.quantity) AS units_sold, SUM(oi.line_total_pkr) AS revenue_pkr FROM order_items oi INNER JOIN orders o ON o.id=oi.order_id WHERE o.status!='Cancelled' AND "+range.replaceAll("created_at","o.created_at")+" GROUP BY oi.product_name,oi.size_ml ORDER BY units_sold DESC,revenue_pkr DESC LIMIT 8"
    ).bind(start,end).all();
    return json({start,end,period,totals:totals||{},trend:trend.results||[],top_products:products.results||[]});
  }
  if(request.method==="GET" && url.pathname==="/api/admin/orders") {
    if(!hasPermission(admin,"orders.read")) return fail("You do not have permission to view orders.",403);
    const q=safeText(url.searchParams.get("q"),100),status=safeText(url.searchParams.get("status"),20);
    const limit=Math.min(Math.max(Number(url.searchParams.get("limit"))||50,1),100);
    let sql="SELECT id,order_number,customer_name,phone,city,area,subtotal_pkr,delivery_fee_pkr,total_pkr,payment_method,status,created_at,updated_at FROM orders";
    const where=[],values=[];
    if(q){where.push("(order_number LIKE ? OR phone LIKE ? OR customer_name LIKE ?)");values.push("%"+q+"%","%"+q+"%","%"+q+"%");}
    if(status&&STATUSES.has(status)){where.push("status=?");values.push(status);}
    if(where.length)sql+=" WHERE "+where.join(" AND ");
    sql+=" ORDER BY created_at DESC LIMIT ?";values.push(limit);
    const result=await env.DB.prepare(sql).bind(...values).all();
    return json({orders:result.results||[]});
  }
  const detailMatch=url.pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
  if(request.method==="GET" && detailMatch) {
    if(!hasPermission(admin,"orders.read")) return fail("You do not have permission to view orders.",403);
    const id=Number(detailMatch[1]),order=await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
    if(!order)return fail("Order not found.",404);
    const [items,history]=await Promise.all([
      env.DB.prepare("SELECT product_name,size_ml,unit_price_pkr,quantity,line_total_pkr FROM order_items WHERE order_id=? ORDER BY id").bind(id).all(),
      env.DB.prepare("SELECT old_status,new_status,changed_at,changed_by FROM order_status_history WHERE order_id=? ORDER BY changed_at DESC,id DESC").bind(id).all()
    ]);
    return json({order,items:items.results||[],history:history.results||[]});
  }
  const statusMatch=url.pathname.match(/^\/api\/admin\/orders\/(\d+)\/status$/);
  if(request.method==="PATCH" && statusMatch) {
    if(!hasPermission(admin,"orders.update"))return fail("You do not have permission to update orders.",403);
    let body;try{body=await request.json()}catch{return fail("Invalid JSON body.");}
    const next=safeText(body.status,20);if(!STATUSES.has(next))return fail("Invalid order status.");
    const id=Number(statusMatch[1]),current=await env.DB.prepare("SELECT status FROM orders WHERE id=?").bind(id).first();
    if(!current)return fail("Order not found.",404);
    if(current.status===next)return json({ok:true,status:next});
    await env.DB.batch([
      env.DB.prepare("UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next,id),
      env.DB.prepare("INSERT INTO order_status_history (order_id,old_status,new_status,changed_by) VALUES (?,?,?,?)").bind(id,current.status,next,"admin:"+admin.email)
    ]);
    await writeAudit(env,admin,null,"order.status_changed",{order_id:id,status:next});
    return json({ok:true,status:next});
  }
  if(url.pathname==="/api/admin/users" && request.method==="GET") {
    if(admin.role!=="super_admin")return fail("Super Admin access required.",403);
    const result=await env.DB.prepare("SELECT id,email,display_name,role,is_active,must_change_password,created_at,last_login_at FROM admin_users ORDER BY created_at DESC").all();
    return json({users:result.results||[]});
  }
  if(url.pathname==="/api/admin/users" && request.method==="POST") {
    if(admin.role!=="super_admin")return fail("Super Admin access required.",403);
    let body;try{body=await request.json()}catch{return fail("Invalid account details.");}
    const email=safeText(body.email,254).toLowerCase(),name=safeText(body.display_name,100),role=safeText(body.role,40);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!name||!ROLE_PERMISSIONS[role]||role==="super_admin")return fail("Provide a valid email, name and non-super-admin role.");
    const temporaryPassword=randomToken(18),salt=crypto.getRandomValues(new Uint8Array(16)),iterations=100000,hash=await passwordHash(temporaryPassword,salt,iterations);
    try {
      const result=await env.DB.prepare("INSERT INTO admin_users (email,display_name,password_hash,password_salt,password_iterations,role,is_active,must_change_password) VALUES (?,?,?,?,?,?,1,1) RETURNING id")
        .bind(email,name,encode64url(hash),encode64url(salt),iterations,role).first();
      await writeAudit(env,admin,result.id,"admin.created",{email,role});
      return json({ok:true,user_id:result.id,temporary_password:temporaryPassword},201);
    } catch {return fail("Could not create account. Check whether this email is already registered.",409);}
  }
  const userMatch=url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  if(request.method==="PATCH" && userMatch) {
    if(admin.role!=="super_admin")return fail("Super Admin access required.",403);
    const id=Number(userMatch[1]);if(id===admin.id)return fail("You cannot modify your own account permissions here.",403);
    let body;try{body=await request.json()}catch{return fail("Invalid account update.");}
    const target=await env.DB.prepare("SELECT id,role,is_active FROM admin_users WHERE id=?").bind(id).first();
    if(!target)return fail("Administrator not found.",404);
    if(body.role!==undefined) {
      if(!ROLE_PERMISSIONS[body.role]||body.role==="super_admin")return fail("Invalid role.");
      await env.DB.prepare("UPDATE admin_users SET role=?,session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.role,id).run();
    }
    if(body.is_active!==undefined) {
      if(typeof body.is_active!=="boolean")return fail("Invalid active state.");
      await env.DB.prepare("UPDATE admin_users SET is_active=?,session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.is_active?1:0,id).run();
    }
    if(body.permissions!==undefined) {
      if(!body.permissions||typeof body.permissions!=="object"||Array.isArray(body.permissions))return fail("Invalid permission overrides.");
      for(const [permission,allowed] of Object.entries(body.permissions)) {
        if(!Object.values(ROLE_PERMISSIONS).flat().includes(permission)||SUPER_ONLY.has(permission)||typeof allowed!=="boolean")return fail("Invalid permission override.");
        await env.DB.prepare("INSERT INTO admin_permission_overrides (admin_id,permission,allowed,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(admin_id,permission) DO UPDATE SET allowed=excluded.allowed,updated_at=CURRENT_TIMESTAMP").bind(id,permission,allowed?1:0).run();
      }
      await env.DB.prepare("UPDATE admin_users SET session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
    }
    await writeAudit(env,admin,id,"admin.updated",{role:body.role,is_active:body.is_active,permissions:body.permissions?Object.keys(body.permissions):[]});
    return json({ok:true});
  }
  if(request.method==="POST" && url.pathname.match(/^\/api\/admin\/users\/\d+\/reset-password$/)) {
    if(admin.role!=="super_admin")return fail("Super Admin access required.",403);
    const id=Number(url.pathname.match(/\d+/)?.[0]);if(id===admin.id)return fail("Use your own password-change flow.",403);
    const target=await env.DB.prepare("SELECT id FROM admin_users WHERE id=?").bind(id).first();
    if(!target)return fail("Administrator not found.",404);
    const temporaryPassword=randomToken(18),salt=crypto.getRandomValues(new Uint8Array(16)),iterations=100000,hash=await passwordHash(temporaryPassword,salt,iterations);
    const result=await env.DB.prepare("UPDATE admin_users SET password_hash=?,password_salt=?,password_iterations=?,must_change_password=1,session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(encode64url(hash),encode64url(salt),iterations,id).run();
    if(!result.success)return fail("Could not reset administrator password.",500);
    await writeAudit(env,admin,id,"admin.password_reset");
    return json({ok:true,temporary_password:temporaryPassword});
  }
  if(request.method==="GET" && url.pathname==="/api/admin/audit") {
    if(admin.role!=="super_admin")return fail("Super Admin access required.",403);
    const result=await env.DB.prepare("SELECT id,actor_admin_id,target_admin_id,action,details_json,created_at FROM admin_audit_log ORDER BY created_at DESC,id DESC LIMIT 100").all();
    return json({events:result.results||[]});
  }
  return fail("Not found.",404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin, request);
    if (request.method === "OPTIONS") {
      if (!cors["access-control-allow-origin"]) return secureResponse(new Response(null, { status: 403 }));
      return secureResponse(new Response(null, { status: 204, headers: cors }));
    }
    if (origin && !isAllowedOrigin(origin, request)) return fail("Origin not allowed.", 403);
    if (url.pathname === "/api/health" && request.method === "GET") return json({ ok: true, service: "avidezuri-api" }, 200, cors);
    if (url.pathname === "/api/track-order" && request.method === "GET") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ipDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
      const ipHash = Array.from(new Uint8Array(ipDigest), byte => byte.toString(16).padStart(2, "0")).join("");
      const rate = await env.DB.prepare(
        "INSERT INTO order_tracking_attempts (ip_hash, window_started_at, attempts) VALUES (?, CAST(strftime('%s','now') AS INTEGER), 1) ON CONFLICT(ip_hash) DO UPDATE SET attempts = CASE WHEN CAST(strftime('%s','now') AS INTEGER) - window_started_at >= 900 THEN 1 ELSE attempts + 1 END, window_started_at = CASE WHEN CAST(strftime('%s','now') AS INTEGER) - window_started_at >= 900 THEN CAST(strftime('%s','now') AS INTEGER) ELSE window_started_at END RETURNING attempts"
      ).bind(ipHash).first();
      if (Number(rate?.attempts) > 20) return fail("Too many tracking attempts. Please try again in 15 minutes.", 429);
      const number = safeText(url.searchParams.get("number"), 20).toUpperCase();
      if (!/^ADZ\d{3,}$/.test(number)) return fail("Please enter a valid order number, such as ADZ001.");
      const order = await env.DB.prepare(
        "SELECT id, order_number, status, created_at, updated_at FROM orders WHERE order_number = ?"
      ).bind(number).first();
      if (!order) return fail("We could not find that order. Please check the order number.", 404);
      const history = await env.DB.prepare(
        "SELECT new_status, changed_at FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC, id ASC"
      ).bind(order.id).all();
      return json({
        order: { order_number: order.order_number, status: order.status, created_at: order.created_at, updated_at: order.updated_at },
        history: (history.results || []).map(entry => ({ status: entry.new_status, changed_at: entry.changed_at }))
      }, 200, cors);
    }
    if (url.pathname === "/api/orders" && request.method === "POST") {
      if (origin !== "https://avidezuri.com" && origin !== "https://www.avidezuri.com") {
        return fail("Orders must be submitted from the Avidezuri storefront.", 403);
      }
      const contentType = request.headers.get("content-type") || "";
      if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
        return fail("Order requests must use JSON.", 415);
      }
      const response = await createOrder(request, env);
      Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
      return response;
    }
    if (url.pathname.startsWith("/api/admin/")) {
      if ((request.method === "POST" || request.method === "PATCH") && !isTrustedAdminOrigin(origin, request)) {
        return fail("Admin requests must come from the admin site.", 403);
      }
      const authResponse = await adminAuth(request, env, url);
      const response = authResponse || await adminApi(request, env, url);
      Object.entries(cors).forEach(([k,v]) => response.headers.set(k,v));
      return response;
    }
    if (url.hostname.toLowerCase() === "admin.avidezuri.com" && url.pathname === "/" && request.method === "GET" && env.ASSETS) {
      return secureResponse(await env.ASSETS.fetch(new Request(new URL("/admin/index.html", url), request)));
    }
    if (env.ASSETS) return secureResponse(await env.ASSETS.fetch(request));
    return fail("Not found.", 404);
  }
};
