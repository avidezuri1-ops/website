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
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState({ customer_name: "", phone: "", area: "", address: "", notes: "" });

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

  function changeQuantity(slug: string, sizeIndex: number, delta: number) {
    setCart((current) => current
      .map((line) => line.product.slug === slug && line.sizeIndex === sizeIndex ? { ...line, quantity: line.quantity + delta } : line)
      .filter((line) => line.quantity > 0));
  }

  return (
    <main>
      <div className="announcement">COMPLIMENTARY FRAGRANCE EXPERIENCE · CASH ON DELIVERY IN KARACHI</div>
      <header className="store-header">
        <a className="store-logo" href="#" aria-label="Avidezuri home">AVIDEZURI<span>®</span></a>
        <nav aria-label="Main navigation">
          <a href="#collections">Collections</a><a href="#catalogue">Shop all</a><a href="#story">Our story</a>
        </nav>
        <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${itemCount} items`}>BAG <span>{itemCount}</span></button>
      </header>

      <section className="editorial-hero" id="story">
        <div className="hero-copy">
          <p className="kicker">THE ART OF FRAGRANCE · EST. AVIDEZURI</p>
          <h1>A scent that<br />speaks <i>before you.</i></h1>
          <p className="hero-intro">Discover a signature that stays long after the moment has passed. Crafted for presence, made to be remembered.</p>
          <a className="dark-link" href="#catalogue">EXPLORE THE COLLECTION <span>↗</span></a>
          <div className="hero-footnote">SCENT IS THE MOST<br />INTIMATE FORM OF MEMORY.</div>
        </div>
        <div className="hero-visual" aria-label="Fragrance-inspired sculptural still life">
          <div className="visual-orbit orbit-a" /><div className="visual-orbit orbit-b" />
          <div className="visual-pedestal" /><div className="visual-bottle"><div className="bottle-cap" /><div className="bottle-neck" /><div className="bottle-body"><span>AVIDEZURI</span></div></div>
          <span className="visual-label">EAU DE PARFUM<br />A PERSONAL SIGNATURE</span>
        </div>
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

      <footer className="store-footer"><a className="store-logo" href="#">AVIDEZURI<span>®</span></a><span>THE ART OF FRAGRANCE</span><span>© {new Date().getFullYear()} AVIDEZURI</span></footer>

      {cartOpen && <div className="cart-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <aside className="cart-panel" role="dialog" aria-modal="true" aria-label="Shopping bag">
          <div className="cart-heading"><div><p className="kicker">YOUR SELECTION</p><h2>Your bag <span>({itemCount})</span></h2></div><button className="close-cart" onClick={() => setCartOpen(false)} aria-label="Close bag">×</button></div>
          {cart.length === 0 ? <div className="cart-empty"><p>Your bag is waiting for a signature scent.</p><button onClick={() => { setCartOpen(false); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" }); }}>EXPLORE FRAGRANCES ↗</button></div> :
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
              <button className="checkout-placeholder" disabled>ORDER SUBMISSION LOCKED IN PREVIEW</button>
              <p className="checkout-note">Preview only. No order will be submitted, saved, or sent to WhatsApp until the isolated test order service is connected and verified.</p>
            </section></>}
        </aside>
      </div>}
    </main>
  );
}
