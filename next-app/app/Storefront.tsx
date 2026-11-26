"use client";

import { useMemo, useState } from "react";

type Product = {
  name: string;
  slug: string;
  category: "budget" | "exclusive";
  isNew?: boolean;
  prices: [number, number, number];
};
const sizes = [30, 50, 100] as const;
const products: Product[] = [
  { name: "DE MARJ", slug: "de-marj", category: "exclusive", isNew: true, prices: [1750, 2550, 4500] },
  { name: "DE IGNITE OUD", slug: "de-ignite-oud", category: "exclusive", isNew: true, prices: [1750, 2550, 4500] },
  { name: "DE SUMMER OUD", slug: "de-summer-oud", category: "exclusive", isNew: true, prices: [1750, 2550, 4500] },
  { name: "DE WANTED", slug: "de-wanted", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE NIGHT", slug: "de-night", category: "exclusive", isNew: true, prices: [1750, 2550, 4500] },
  { name: "DE FLORA", slug: "de-flora", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE SWIM", slug: "de-swim", category: "exclusive", isNew: true, prices: [1750, 2550, 4500] },
  { name: "DE CREVENTUS", slug: "de-creventus", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE MOVEMENT", slug: "de-movement", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE ANGEL", slug: "de-angel", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE ALEE’SHA", slug: "de-aleesha", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE BOMB", slug: "de-bomb", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE OCEAN", slug: "de-ocean", category: "budget", prices: [1450, 1750, 2250] },
  { name: "IN DE SEA", slug: "in-de-sea", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE SAV WILD", slug: "de-sav-wild", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE TRUE BOND", slug: "de-true-bond", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE AQUA", slug: "de-aqua", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE CRISTAL ROUGE", slug: "de-cristal-rouge", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE DESIRE", slug: "de-desire", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE WOMEN", slug: "de-women", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE LEATHER", slug: "de-leather", category: "budget", prices: [1450, 1750, 2250] },
  { name: "DE FANTASY", slug: "de-fantasy", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE MOUNTAIN", slug: "de-mountain", category: "exclusive", prices: [1750, 2550, 4500] },
  { name: "DE BLACK", slug: "de-black", category: "exclusive", isNew: true, prices: [1750, 2550, 4500] },
  { name: "DE NOIR", slug: "de-noir", category: "exclusive", isNew: true, prices: [1750, 2550, 4500] },
];
type CartLine = { product: Product; sizeIndex: number; quantity: number };
const money = (value: number) => `Rs ${value.toLocaleString("en-PK")}`;
const deliveryZones = [
  { fee: 200, areas: ["Saddar", "Clifton", "DHA (Defence)", "PECHS", "Tariq Road", "Gulshan-e-Iqbal", "Gulistan-e-Jauhar", "North Nazimabad", "Nazimabad", "Federal B Area", "Garden", "Bahadurabad"] },
  { fee: 300, areas: ["Korangi", "Landhi", "Malir", "Shah Faisal Colony", "Scheme 33", "Gulshan-e-Maymar", "North Karachi", "New Karachi", "Orangi Town", "SITE", "Liaquatabad", "Lyari", "Baldia", "Keamari"] },
  { fee: 400, areas: ["Bin Qasim", "Steel Town", "Gadap", "Surjani Town", "Hawksbay", "Manghopir", "Bahria Town Karachi", "DHA City", "Gulshan-e-Hadeed", "Other area in Karachi"] },
];
const deliveryAreas = deliveryZones.flatMap((zone) => zone.areas.map((area) => ({ area, fee: zone.fee }))).sort((a, b) => a.area.localeCompare(b.area));
const arrivals = products.filter((product) => product.isNew);

export default function Storefront() {
  const [category, setCategory] = useState<"all" | "budget" | "exclusive">("all");
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState({ customer_name: "", phone: "", area: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ order_number: string; total_pkr: number } | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    return matchesCategory && product.name.toLowerCase().includes(search.trim().toLowerCase());
  }), [category, search]);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.product.prices[line.sizeIndex] * line.quantity, 0);
  const deliveryFee = deliveryAreas.find((entry) => entry.area === checkout.area)?.fee ?? 0;
  const orderTotal = subtotal + deliveryFee;

  function add(product: Product) {
    const sizeIndex = selectedSizes[product.slug] ?? 0;
    setCart((current) => {
      const existing = current.find((line) => line.product.slug === product.slug && line.sizeIndex === sizeIndex);
      if (existing) return current.map((line) => line === existing ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { product, sizeIndex, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function changeQuantity(slug: string, sizeIndex: number, delta: number) {
    setCart((current) => current.map((line) =>
      line.product.slug === slug && line.sizeIndex === sizeIndex ? { ...line, quantity: line.quantity + delta } : line
    ).filter((line) => line.quantity > 0));
  }

  async function submitOrder() {
    setCheckoutError("");
    if (!checkout.customer_name.trim() || checkout.phone.replace(/\\D/g, "").length < 7 || !checkout.area || !checkout.address.trim()) {
      setCheckoutError("Please complete your name, valid phone number, delivery area and address.");
      return;
    }
    if (!cart.length) {
      setCheckoutError("Add at least one fragrance to your bag.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: checkout.customer_name,
          phone: checkout.phone,
          city: "Karachi",
          area: checkout.area,
          address: checkout.address,
          notes: checkout.notes,
          items: cart.map((line) => ({ slug: line.product.slug, size_ml: sizes[line.sizeIndex], quantity: line.quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok || !data?.order?.order_number) {
        throw new Error(data?.error || "We could not save your preview order. Please try again.");
      }
      setOrderResult({ order_number: data.order.order_number, total_pkr: data.order.total_pkr });
      setCart([]);
      setCheckout({ customer_name: "", phone: "", area: "", address: "", notes: "" });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function productCard(product: Product, index: number, compact = false) {
    const sizeIndex = selectedSizes[product.slug] ?? 0;
    return (
      <article className={`fragrance-card reveal ${compact ? "arrival-card" : ""}`} key={product.slug}>
        <div className="fragrance-art">
          {product.isNew && <span className="new-label">JUST ARRIVED</span>}
          <img src={`https://avidezuri.com/images/${product.slug}.png`} alt={product.name} loading={index < 5 ? "eager" : "lazy"} />
          <span className="art-index">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="fragrance-info">
          <div className="fragrance-name-row"><div><h3>{product.name}</h3><p>{product.category === "exclusive" ? "EXCLUSIVE COLLECTION" : "EVERYDAY COLLECTION"}</p></div><span className="fragrance-price">{money(product.prices[sizeIndex])}</span></div>
          <div className="size-picker" aria-label={`Choose size for ${product.name}`}>
            {sizes.map((size, i) => <button type="button" key={size} aria-pressed={sizeIndex === i} onClick={() => setSelectedSizes((current) => ({ ...current, [product.slug]: i }))}>{size} ml</button>)}
          </div>
          <button className="add-button" type="button" onClick={() => add(product)}>ADD TO BAG <span>↗</span></button>
        </div>
      </article>
    );
  }

  return (
    <main className="plum-store">
      <div className="topline">A SIGNATURE FRAGRANCE · CASH ON DELIVERY ACROSS KARACHI</div>
      <header className="plum-header">
        <a className="plum-logo" href="#top" aria-label="Avi De Zuri home"><img src="/white%20logo.png" alt="Avi De Zuri" /></a>
        <nav aria-label="Main navigation">
          <a href="#arrivals">New arrivals</a>
          <a href="#collection" onClick={() => setCategory("all")}>Collection</a>
          <a href="#how-to-order">How to order</a>
        </nav>
        <button className="bag-trigger" type="button" onClick={() => setCartOpen(true)}>YOUR ORDER <span>{itemCount}</span></button>
      </header>

      <section className="plum-hero" id="top">
        <img className="hero-image" src="https://avidezuri.com/images/hero-banner.jpg" alt="" aria-hidden="true" />
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-orb orb-three" />
        <div className="hero-copy">
          <p className="eyebrow">AVIDEZURI · EXtrait DE PARFUM</p>
          <h1><span>Scent that stays</span><em>long after you’ve left.</em></h1>
          <p className="hero-description">A fragrance for every version of you. Discover your signature in 30ml, 50ml and 100ml.</p>
          <div className="hero-actions"><a className="button-light" href="#collection">SHOP THE COLLECTION</a><a className="button-outline" href="https://wa.me/923181230098" target="_blank" rel="noreferrer">MESSAGE US ↗</a></div>
        </div>
        <div className="hero-seal" aria-hidden="true"><span>THE ART OF FRAGRANCE</span><b>✦</b><span>KARACHI · PAKISTAN</span></div>
        <div className="hero-bottom-note"><span>01 / 03</span><span>FIND YOUR SIGNATURE SCENT</span></div>
      </section>

      <div className="marquee" aria-hidden="true"><div>{[...products, ...products].map((product, i) => <span key={i}>{product.name}<b>✦</b></span>)}</div></div>

      <section className="arrivals-section" id="arrivals">
        <div className="section-heading"><div><p className="eyebrow">FRESH FROM THE ATELIER</p><h2>New <em>arrivals.</em></h2></div><a href="#collection" onClick={() => setCategory("all")}>VIEW ALL FRAGRANCES ↗</a></div>
        <div className="arrivals-track">{arrivals.map((product, index) => productCard(product, index, true))}</div>
      </section>

      <section className="collection-section" id="collection">
        <div className="section-heading collection-heading"><div><p className="eyebrow">THE AVIDEZURI EDIT</p><h2>The <em>collection.</em></h2><p className="section-intro">A considered collection for every mood, moment and memory.</p></div>
          <label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fragrances" aria-label="Search fragrances" /></label>
        </div>
        <div className="collection-tools"><div className="filter-pills" aria-label="Filter fragrances">
          {(["all", "exclusive", "budget"] as const).map((value) => <button key={value} type="button" className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{value === "all" ? "All fragrances" : value === "exclusive" ? "Exclusive" : "Everyday"}</button>)}
        </div><span>{visibleProducts.length.toString().padStart(2, "0")} FRAGRANCES</span></div>
        {visibleProducts.length ? <div className="fragrance-grid">{visibleProducts.map((product, index) => productCard(product, index))}</div> : <p className="no-results">No fragrance matches that search. Try another name.</p>}
      </section>

      <section className="promise-section">
        <p className="eyebrow">THE AVIDEZURI PROMISE</p>
        <h2>Not simply worn.<br /><em>Remembered.</em></h2>
        <p>Explore a fragrance wardrobe made for your moments, your rituals and your unmistakable presence.</p>
        <a href="#collection">FIND YOUR SIGNATURE ↗</a>
      </section>

      <section className="story-section" id="how-to-order">
        <div className="story-label">01 — THE EXPERIENCE</div>
        <div className="story-content"><p className="eyebrow">A MORE PERSONAL KIND OF LUXURY</p><h2>Fragrance is more than a finishing touch.<br /><em>It becomes part of your story.</em></h2><p>Choose the scent that feels unmistakably yours. Select your preferred size, place your order and enjoy the ease of cash on delivery across Karachi.</p>
          <div className="order-steps"><div><b>01</b><strong>Choose your scent</strong><span>Explore 25 fragrances and three sizes.</span></div><div><b>02</b><strong>Place your order</strong><span>Share your delivery details securely.</span></div><div><b>03</b><strong>Pay on delivery</strong><span>Cash on delivery across Karachi.</span></div></div>
        </div><div className="story-monogram">A<span>.</span></div>
      </section>

      <footer className="plum-footer">
        <a className="footer-mark" href="#top"><img src="/white%20logo.png" alt="Avi De Zuri" /></a>
        <p>THE ART OF FRAGRANCE</p><a href="https://wa.me/923181230098" target="_blank" rel="noreferrer">WHATSAPP · 0318 1230098</a><span>© {new Date().getFullYear()} AVIDEZURI</span>
      </footer>

      {cartOpen && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <aside className="order-drawer" role="dialog" aria-modal="true" aria-label="Your order">
          <div className="drawer-heading"><div><p className="eyebrow">YOUR SELECTION</p><h2>Your order <em>({itemCount})</em></h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Close order">×</button></div>
          {orderResult ? <div className="order-success"><p className="eyebrow">ORDER SAVED</p><h3>Your preview order is confirmed.</h3><strong>{orderResult.order_number}</strong><p>Total: {money(orderResult.total_pkr)} · Cash on delivery</p><small>This test order is saved in the isolated preview database only. It has not been sent to the live store or WhatsApp.</small><button type="button" className="submit-order" onClick={() => { setOrderResult(null); setCartOpen(false); }}>CONTINUE SHOPPING ↗</button></div> :
          !cart.length ? <div className="drawer-empty"><p>Your order is waiting for a signature scent.</p><button type="button" onClick={() => { setCartOpen(false); document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }); }}>EXPLORE THE COLLECTION ↗</button></div> :
          <><div className="drawer-lines">{cart.map((line) => <div className="drawer-line" key={line.product.slug + line.sizeIndex}><img src={`https://avidezuri.com/images/${line.product.slug}.png`} alt={line.product.name} /><div className="drawer-line-info"><b>{line.product.name}</b><span>{sizes[line.sizeIndex]} ml · {money(line.product.prices[line.sizeIndex])}</span><div className="quantity-buttons"><button type="button" onClick={() => changeQuantity(line.product.slug, line.sizeIndex, -1)} aria-label="Decrease quantity">−</button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.product.slug, line.sizeIndex, 1)} aria-label="Increase quantity">+</button></div></div><strong>{money(line.product.prices[line.sizeIndex] * line.quantity)}</strong></div>)}</div>
          <div className="delivery-form"><p className="eyebrow">DELIVERY DETAILS</p>
            <label>Full name<input value={checkout.customer_name} onChange={(event) => setCheckout((current) => ({ ...current, customer_name: event.target.value }))} maxLength={100} autoComplete="name" placeholder="Your full name" /></label>
            <label>Contact number<input value={checkout.phone} onChange={(event) => setCheckout((current) => ({ ...current, phone: event.target.value }))} maxLength={30} inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" /></label>
            <label>Karachi delivery area<select value={checkout.area} onChange={(event) => setCheckout((current) => ({ ...current, area: event.target.value }))}><option value="">Select your area</option>{deliveryAreas.map((entry) => <option key={entry.area} value={entry.area}>{entry.area} · {money(entry.fee)} delivery</option>)}</select></label>
            <label>Complete delivery address<textarea value={checkout.address} onChange={(event) => setCheckout((current) => ({ ...current, address: event.target.value }))} maxLength={500} rows={3} autoComplete="street-address" placeholder="House / flat, street, block and nearby landmark" /></label>
            <label>Order notes <span className="optional">OPTIONAL</span><textarea value={checkout.notes} onChange={(event) => setCheckout((current) => ({ ...current, notes: event.target.value }))} maxLength={500} rows={2} placeholder="Any delivery instructions?" /></label>
          </div>
          <div className="drawer-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Delivery {checkout.area ? `· ${checkout.area}` : ""}</span><strong>{checkout.area ? money(deliveryFee) : "Select area"}</strong></div><div className="grand-total"><span>Total · Cash on delivery</span><strong>{money(orderTotal)}</strong></div></div>
          {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}<button type="button" className="submit-order" onClick={submitOrder} disabled={submitting}>{submitting ? "SAVING YOUR ORDER…" : "PLACE TEST ORDER ↗"}</button>
          <p className="preview-note">Preview checkout only · Orders are saved to the isolated test database.</p></>}
        </aside>
      </div>}
    </main>
  );
}
