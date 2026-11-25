import { getCloudflareContext } from "@opennextjs/cloudflare";

type Statement = {
  bind: (...values: unknown[]) => Statement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<unknown>;
};
type PreviewDb = {
  prepare: (sql: string) => Statement;
  batch: (statements: Statement[]) => Promise<unknown[]>;
};

const SIZES = new Set([30, 50, 100]);
const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return response({ error: "Cross-origin order requests are not allowed." }, 403);
      }
    } catch {
      return response({ error: "Invalid request origin." }, 403);
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return response({ error: "Could not read order details." }, 400);
  }
  if (new TextEncoder().encode(raw).byteLength > 32_768) {
    return response({ error: "Order request is too large." }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return response({ error: "Invalid order details." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response({ error: "Invalid order details." }, 400);
  }

  const customerName = clean(body.customer_name, 100);
  const phone = clean(body.phone, 30);
  const area = clean(body.area, 100);
  const address = clean(body.address, 500);
  const notes = clean(body.notes, 500);
  const city = "Karachi";

  if (!customerName || phone.replace(/\\D/g, "").length < 7 || !area || !address) {
    return response({ error: "Please provide your name, a valid phone number, delivery area and address." }, 400);
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) {
    return response({ error: "Your bag must contain between 1 and 30 item lines." }, 400);
  }

  const context = getCloudflareContext() as unknown as { env: { DB?: PreviewDb } };
  const db = context.env.DB;
  if (!db) return response({ error: "The isolated preview order database is not configured." }, 503);

  const normalized: Array<{
    product_id: number;
    product_name: string;
    size_ml: number;
    unit_price_pkr: number;
    quantity: number;
    line_total_pkr: number;
  }> = [];

  for (const candidate of body.items) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return response({ error: "One or more bag items are invalid." }, 400);
    }
    const item = candidate as Record<string, unknown>;
    const slug = clean(item.slug, 100);
    const size = Number(item.size_ml);
    const quantity = Number(item.quantity);
    if (!slug || !SIZES.has(size) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return response({ error: "One or more bag items have invalid details." }, 400);
    }
    const product = await db.prepare(
      "SELECT p.id, p.name, p.active, pp.price_pkr FROM products p JOIN product_prices pp ON pp.product_id=p.id WHERE p.slug=? AND pp.size_ml=?"
    ).bind(slug, size).first<{
      id: number; name: string; active: number; price_pkr: number;
    }>();
    if (!product || product.active !== 1) {
      return response({ error: "A selected fragrance is unavailable. Please refresh the catalogue." }, 409);
    }
    const lineTotal = Number(product.price_pkr) * quantity;
    if (!Number.isSafeInteger(lineTotal)) {
      return response({ error: "An item total is invalid." }, 400);
    }
    normalized.push({
      product_id: Number(product.id),
      product_name: product.name,
      size_ml: size,
      unit_price_pkr: Number(product.price_pkr),
      quantity,
      line_total_pkr: lineTotal,
    });
  }

  const zone = await db.prepare(
    "SELECT fee_pkr FROM delivery_zones WHERE city=? AND area=? AND active=1"
  ).bind(city, area).first<{ fee_pkr: number }>();
  if (!zone) return response({ error: "The selected Karachi delivery area is unavailable." }, 422);

  const subtotal = normalized.reduce((sum, item) => sum + item.line_total_pkr, 0);
  const deliveryFee = Number(zone.fee_pkr);
  const total = subtotal + deliveryFee;
  if (!Number.isSafeInteger(total) || total < 1 || total > 10_000_000) {
    return response({ error: "The order total is outside the allowed range." }, 400);
  }

  let sequence: { sequence: number } | null;
  try {
    sequence = await db.prepare(
      "UPDATE order_number_sequence SET next_value=next_value+1 WHERE id=1 RETURNING next_value-1 AS sequence"
    ).first<{ sequence: number }>();
  } catch {
    return response({ error: "Preview order numbering is not initialized. Run the preview database migrations first." }, 503);
  }
  if (!sequence || !Number.isSafeInteger(Number(sequence.sequence))) {
    return response({ error: "Preview order numbering is not initialized." }, 503);
  }

  const orderNumber = "ADZ" + String(sequence.sequence).padStart(3, "0");
  let inserted: { id: number; order_number: string; created_at: string } | null = null;
  try {
    inserted = await db.prepare(
      "INSERT INTO orders (order_number,customer_name,phone,city,area,address,notes,subtotal_pkr,delivery_fee_pkr,total_pkr,payment_method,status) VALUES (?,?,?,?,?,?,?,?,?,?, 'COD','Pending') RETURNING id,order_number,created_at"
    ).bind(orderNumber, customerName, phone, city, area, address, notes || null, subtotal, deliveryFee, total)
      .first<{ id: number; order_number: string; created_at: string }>();
    if (!inserted) throw new Error("Order insert returned no row.");

    const statements = normalized.map((item) => db.prepare(
      "INSERT INTO order_items (order_id,product_id,product_name,size_ml,unit_price_pkr,quantity,line_total_pkr) VALUES (?,?,?,?,?,?,?)"
    ).bind(inserted!.id, item.product_id, item.product_name, item.size_ml, item.unit_price_pkr, item.quantity, item.line_total_pkr));
    statements.push(db.prepare(
      "INSERT INTO order_status_history (order_id,old_status,new_status,changed_by) VALUES (?,NULL,'Pending','preview_checkout')"
    ).bind(inserted.id));
    await db.batch(statements);
  } catch {
    if (inserted?.id) {
      try { await db.prepare("DELETE FROM orders WHERE id=?").bind(inserted.id).run(); } catch { /* best-effort cleanup */ }
    }
    return response({ error: "Could not save the preview order. Please try again." }, 500);
  }

  return response({
    ok: true,
    preview_only: true,
    order: {
      order_number: inserted.order_number,
      subtotal_pkr: subtotal,
      delivery_fee_pkr: deliveryFee,
      total_pkr: total,
      payment_method: "COD",
      status: "Pending",
      created_at: inserted.created_at,
    },
  }, 201);
}
