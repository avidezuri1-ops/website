"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  name: string;
  slug: string;
  category: "budget" | "exclusive";
  isNew?: boolean;
  prices: [number, number, number];
};

const sizes = [30, 50, 100] as const;
const products: Product[] = [
  { name: "DE MARJ", slug: "de-marj", category: "exclusive", isNew: true, prices: [1750,2550,4500] },
  { name: "DE IGNITE OUD", slug: "de-ignite-oud", category: "exclusive", isNew: true, prices: [1750,2550,4500] },
  { name: "DE SUMMER OUD", slug: "de-summer-oud", category: "exclusive", isNew: true, prices: [1750,2550,4500] },
  { name: "DE WANTED", slug: "de-wanted", category: "budget", prices: [1450,1750,2250] },
  { name: "DE NIGHT", slug: "de-night", category: "exclusive", isNew: true, prices: [1750,2550,4500] },
  { name: "DE FLORA", slug: "de-flora", category: "budget", prices: [1450,1750,2250] },
  { name: "DE SWIM", slug: "de-swim", category: "exclusive", isNew: true, prices: [1750,2550,4500] },
  { name: "DE CREVENTUS", slug: "de-creventus", category: "budget", prices: [1450,1750,2250] },
  { name: "DE MOVEMENT", slug: "de-movement", category: "budget", prices: [1450,1750,2250] },
  { name: "DE ANGEL", slug: "de-angel", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE ALEE’SHA", slug: "de-aleesha", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE BOMB", slug: "de-bomb", category: "budget", prices: [1450,1750,2250] },
  { name: "DE OCEAN", slug: "de-ocean", category: "budget", prices: [1450,1750,2250] },
  { name: "IN DE SEA", slug: "in-de-sea", category: "budget", prices: [1450,1750,2250] },
  { name: "DE SAV WILD", slug: "de-sav-wild", category: "budget", prices: [1450,1750,2250] },
  { name: "DE TRUE BOND", slug: "de-true-bond", category: "budget", prices: [1450,1750,2250] },
  { name: "DE AQUA", slug: "de-aqua", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE CRISTAL ROUGE", slug: "de-cristal-rouge", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE DESIRE", slug: "de-desire", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE WOMEN", slug: "de-women", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE LEATHER", slug: "de-leather", category: "budget", prices: [1450,1750,2250] },
  { name: "DE FANTASY", slug: "de-fantasy", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE MOUNTAIN", slug: "de-mountain", category: "exclusive", prices: [1750,2550,4500] },
  { name: "DE BLACK", slug: "de-black", category: "exclusive", isNew: true, prices: [1750,2550,4500] },
  { name: "DE NOIR", slug: "de-noir", category: "exclusive", isNew: true, prices: [1750,2550,4500] },
];

type CartLine = { product: Product; sizeIndex: number; quantity: number };
const money = (value: number) => `Rs ${value.toLocaleString("en-PK")}`;

const deliveryZones = [
  { fee: 200, areas: ["Saddar", "Clifton", "DHA (Defence)", "PECHS", "Tariq Road", "Gulshan-e-Iqbal", "Gulistan-e-Jauhar", "North Nazimabad", "Nazimabad", "Federal B Area", "Garden", "Bahadurabad"] },
  { fee: 300, areas: ["Korangi", "Landhi", "Malir", "Shah Faisal Colony", "Scheme 33", "Gulshan-e-Maymar", "North Karachi", "New Karachi", "Orangi Town", "SITE", "Liaquatabad", "Lyari", "Baldia", "Keamari"] },
  { fee: 400, areas: ["Bin Qasim", "Steel Town", "Gadap", "Surjani Town", "Hawksbay", "Manghopir", "Bahria Town Karachi", "DHA City", "Gulshan-e-Hadeed", "Other area in Karachi"] },
];
const deliveryAreas = deliveryZones.flatMap((zone) => zone.areas.map((area) => ({ area, fee: zone.fee }))).sort((a, b) => a.area.localeCompare(b.area));

export default function Storefront() {
  const [category, setCategory] = useState<"all" | "budget" | "exclusive">("all");
  const [cursor, setCursor] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const move = (event: PointerEvent) => setCursor({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
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
    return matchesCategory && product.name.toLowerCase().includes(search.toLowerCase().trim());
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

  async function submitOrder() {
    setCheckoutError("");
    if (!checkout.customer_name.trim() || checkout.phone.replace(/\D/g, "").length < 7 || !checkout.area || !checkout.address.trim()) {
      setCheckoutError("Please complete your name, valid phone number, delivery area and address.");
      return;
    }
    if (cart.length === 0) {
      setCheckoutError("Add at least one fragrance to your bag.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: checkout.customer_name,
          phone: checkout.phone,
          city: "Karachi",
          area: checkout.area,
          address: checkout.address,
          notes: checkout.notes,
          items: cart.map((line) => ({
            slug: line.product.slug,
            size_ml: sizes[line.sizeIndex],
            quantity: line.quantity,
          })),
        }),
      });
      const data = await result.json();
      if (!result.ok || !data?.ok || !data?.order?.order_number) {
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

  function changeQuantity(slug: string, sizeIndex: number, delta: number) {
    setCart((current) => current
      .map((line) => line.product.slug === slug && line.sizeIndex === sizeIndex ? { ...line, quantity: line.quantity + delta } : line)
      .filter((line) => line.quantity > 0));
  }

  return (
    <main>
      <div className="mouse-arrow" style={{ left: cursor.x, top: cursor.y }} aria-hidden="true"><span>↗</span></div>
      <div className="announcement">COMPLIMENTARY FRAGRANCE EXPERIENCE · CASH ON DELIVERY IN KARACHI</div>
      <header className="store-header">
        <a className="store-logo" href="#" aria-label="Avidezuri home"><img src="/golden%20logo.png" alt="AVIDEZURI" fetchPriority="high" /></a>
        <nav aria-label="Main navigation">
          <a href="#catalogue" onClick={() => setCategory("all")}>All fragrances</a><a href="#catalogue" onClick={() => setCategory("exclusive")}>Exclusive</a><a href="#catalogue" onClick={() => setCategory("budget")}>Everyday</a>
        </nav>
        <div className="header-actions">
          <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${itemCount} items`}>BAG <span>{itemCount}</span></button>
        </div>
      </header>

      <section className="hero-banner" id="story" aria-label="Avidezuri fragrance campaign">
        <img src="https://avidezuri.com/images/hero-banner.jpg" alt="Avidezuri fragrance collection campaign" />
      </section>

      <section className="collection-strip" id="collections">
        <div><span className="kicker">A WORLD OF ITS OWN</span><h2>Find your <i>fragrance.</i></h2></div>
        <a href="#catalogue" onClick={() => setCategory("exclusive")}><span>01 / EXCLUSIVE</span><b>Discover the exceptional ↗</b></a>
        <a href="#catalogue" onClick={() => setCategory("budget")}><span>02 / EVERYDAY SIGNATURES</span><b>Find your everyday ↗</b></a>
      </section>

      <section className="catalogue-section" id="catalogue">
        <div className="catalogue-heading">
          <div><p className="kicker">THE AVIDEZURI EDIT</p><h2>Our fragrances</h2><p className="catalogue-subtitle">A considered collection for every version of you.</p></div>
          <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a fragrance" aria-label="Search fragrances" /></label>
        </div>
        <div className="catalogue-toolbar">
          <div className="filter-tabs" aria-label="Filter fragrances">
            {(["all", "exclusive", "budget"] as const).map((value) => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{value === "all" ? "All fragrances" : value === "budget" ? "Everyday" : "Exclusive"}</button>)}
          </div>
          <span className="result-count">{visibleProducts.length.toString().padStart(2, "0")} FRAGRANCES</span>
        </div>
        <div className="product-grid">
          {visibleProducts.map((product, index) => {
            const sizeIndex = selectedSizes[product.slug] ?? 0;
            return <article className="product-card" key={product.slug}>
              <div className="product-art">
                {product.isNew && <span className="new-tag">NEW ARRIVAL</span>}
                <img src={`https://avidezuri.com/images/${product.slug}.png`} alt={product.name} loading={index < 8 ? "eager" : "lazy"} />
                <span className="product-category">{product.category === "exclusive" ? "EXCLUSIVE" : "EVERYDAY"}</span>
              </div>
              <div className="product-info">
                <div className="product-title-row"><h3>{product.name}</h3><span>{String(index + 1).padStart(2, "0")}</span></div>
                <div className="size-options" aria-label={`Choose size for ${product.name}`}>
                  {sizes.map((size, i) => <button key={size} className={sizeIndex === i ? "selected" : ""} onClick={() => setSelectedSizes((current) => ({ ...current, [product.slug]: i }))}>{size} ml</button>)}
                </div>
                <div className="product-buy-row"><strong>{money(product.prices[sizeIndex])}</strong><button onClick={() => add(product)}>ADD TO BAG <span>+</span></button></div>
              </div>
            </article>;
          })}
        </div>
        {visibleProducts.length === 0 && <p className="empty-state">No fragrances found. Try another search.</p>}
      </section>

      <section className="brand-note">
        <p className="kicker">THE AVIDEZURI PROMISE</p><h2>Not simply worn.<br /><i>Remembered.</i></h2><p>Explore a fragrance wardrobe made for your moments, your rituals and your unmistakable presence.</p>
        <a className="light-link" href="#catalogue">FIND YOUR SIGNATURE ↗</a>
      </section>

      <section className="brand-story" id="our-story">
        <div className="story-index">01 — OUR STORY</div>
        <div className="story-copy">
          <p className="kicker">THE AVIDEZURI POINT OF VIEW</p>
          <h2>Fragrance is more than a finishing touch.<br /><i>It becomes part of your story.</i></h2>
          <p>We believe a signature scent should feel personal — an expression of mood, memory and presence. Explore the collection and find the fragrance that feels unmistakably yours.</p>
          <a href="#catalogue" className="story-link">DISCOVER YOUR SIGNATURE <span>↗</span></a>
        </div>
        <div className="story-mark" aria-hidden="true">A<span>.</span></div>
      </section>

      <section className="instagram-section" aria-label="Avidezuri Instagram-style post slider">
        <div className="instagram-heading">
          <div><p className="kicker">A GLIMPSE INTO OUR WORLD</p><h2>The Avidezuri <i>journal.</i></h2></div>
          <span className="instagram-handle">INSTAGRAM EDIT · 01—05</span>
        </div>
        <div className="instagram-track">
          {[
            { slug: "de-marj", name: "DE MARJ", caption: "A signature in the making" },
            { slug: "de-ignite-oud", name: "DE IGNITE OUD", caption: "Depth, warmth, presence" },
            { slug: "de-summer-oud", name: "DE SUMMER OUD", caption: "A brighter kind of bold" },
            { slug: "de-night", name: "DE NIGHT", caption: "Made for after hours" },
            { slug: "de-cristal-rouge", name: "DE CRISTAL ROUGE", caption: "An unmistakable impression" },
          ].map((post, index) => <a className="instagram-post" href="#catalogue" key={post.slug}>
            <div className="instagram-image"><img src={`https://avidezuri.com/images/${post.slug}.png`} alt={post.name} loading="lazy" /><span className="instagram-number">0{index + 1}</span><span className="instagram-glyph" aria-hidden="true">◎</span></div>
            <div className="instagram-caption"><b>{post.name}</b><span>{post.caption}</span></div>
          </a>)}
        </div>
      </section>

      <footer className="store-footer">
        <a className="store-logo footer-logo" href="#" aria-label="Avidezuri home"><img src="/golden%20logo.png" alt="AVIDEZURI" loading="lazy" /></a>
        <span>THE ART OF FRAGRANCE</span><span>© {new Date().getFullYear()} AVIDEZURI</span>
      </footer>

      {cartOpen && <div className="cart-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <aside className="cart-panel" role="dialog" aria-modal="true" aria-label="Shopping bag">
          <div className="cart-heading"><div><p className="kicker">YOUR SELECTION</p><h2>Your bag <span>({itemCount})</span></h2></div><button className="close-cart" onClick={() => setCartOpen(false)} aria-label="Close bag">×</button></div>
          {orderResult ? <div className="cart-empty"><p>Your preview order has been saved successfully.</p><strong>{orderResult.order_number}</strong><p>Total: {money(orderResult.total_pkr)} · Cash on delivery</p><p className="checkout-note">This is a test order in the isolated preview database only. It has not been sent to the live store or WhatsApp.</p><button onClick={() => { setOrderResult(null); setCartOpen(false); }}>CONTINUE SHOPPING ↗</button></div> : cart.length === 0 ? <div className="cart-empty"><p>Your bag is waiting for a signature scent.</p><button onClick={() => { setCartOpen(false); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>EXPLORE FRAGRANCES ↗</button></div> :
            <><div className="cart-lines">{cart.map((line) => <div className="cart-line" key={line.product.slug + line.sizeIndex}><img className="cart-line-image" src={`https://avidezuri.com/images/${line.product.slug}.png`} alt={line.product.name} loading="lazy" /><div className="cart-line-details"><b>{line.product.name}</b><span>{sizes[line.sizeIndex]} ml · {money(line.product.prices[line.sizeIndex])}</span><div className="quantity-control"><button onClick={() => changeQuantity(line.product.slug, line.sizeIndex, -1)} aria-label="Decrease quantity">−</button><span>{line.quantity}</span><button onClick={() => changeQuantity(line.product.slug, line.sizeIndex, 1)} aria-label="Increase quantity">+</button></div></div><strong>{money(line.product.prices[line.sizeIndex] * line.quantity)}</strong></div>)}</div>
            <section className="checkout-form" aria-label="Preview checkout details">
              <p className="kicker">DELIVERY DETAILS</p>
              <label>Full name
                <input value={checkout.customer_name} onChange={(event) => setCheckout((current) => ({ ...current, customer_name: event.target.value }))} maxLength={100} placeholder="Your full name" autoComplete="name" />
              </label>
              <label>Phone number
                <input value={checkout.phone} onChange={(event) => setCheckout((current) => ({ ...current, phone: event.target.value }))} maxLength={30} placeholder="03XX XXXXXXX" inputMode="tel" autoComplete="tel" />
              </label>
              <label>Karachi delivery area
                <select value={checkout.area} onChange={(event) => setCheckout((current) => ({ ...current, area: event.target.value }))}>
                  <option value="">Select your area</option>
                  {deliveryAreas.map((entry) => <option key={entry.area} value={entry.area}>{entry.area} · {money(entry.fee)} delivery</option>)}
                </select>
              </label>
              <label>Complete delivery address
                <textarea value={checkout.address} onChange={(event) => setCheckout((current) => ({ ...current, address: event.target.value }))} maxLength={500} rows={3} placeholder="House / flat, street, block and nearby landmark" autoComplete="street-address" />
              </label>
              <label>Order notes <span className="optional-label">Optional</span>
                <textarea value={checkout.notes} onChange={(event) => setCheckout((current) => ({ ...current, notes: event.target.value }))} maxLength={500} rows={2} placeholder="Any delivery instructions?" />
              </label>
              <div className="cart-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div className="cart-total"><span>Delivery {checkout.area ? `· ${checkout.area}` : ""}</span><strong>{checkout.area ? money(deliveryFee) : "Select area"}</strong></div>
              <div className="cart-total order-grand-total"><span>Total · Cash on delivery</span><strong>{money(orderTotal)}</strong></div>
              {checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}
              <button className="checkout-placeholder" onClick={submitOrder} disabled={submitting || cart.length === 0 || !checkout.customer_name.trim() || checkout.phone.replace(/\D/g, "").length < 7 || !checkout.area || !checkout.address.trim()}>{submitting ? "SAVING PREVIEW ORDER…" : "PLACE TEST ORDER"}</button>
              <p className="checkout-note">Isolated preview test only. Orders are saved to the separate preview database and are never sent to the live store or WhatsApp.</p>
            </section></>}
        </aside>
      </div>}
    </main>
  );
}
