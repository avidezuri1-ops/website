const collections = [
  { number: "01", title: "The Signature Collection", note: "Distinctive scents. Lasting impressions." },
  { number: "02", title: "The Exclusive Collection", note: "Compositions for those who stand apart." },
  { number: "03", title: "New Arrivals", note: "Meet the latest expressions of Avidezuri." },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Avidezuri home">AVIDEZURI<span>®</span></a>
        <nav aria-label="Main navigation">
          <a href="#collections">Collections</a>
          <a href="#story">Our Story</a>
          <a href="#contact">Contact</a>
        </nav>
        <span className="header-note">THE ART OF FRAGRANCE</span>
      </header>

      <section className="hero" id="story">
        <div className="hero-copy">
          <p className="eyebrow">A STUDY IN SCENT · EST. AVIDEZURI</p>
          <h1>Leave a<br /><em>lasting</em> impression.</h1>
          <p className="hero-description">
            Fragrance is more than a note. It is a presence, a memory,
            an expression of who you are.
          </p>
          <a className="text-link" href="#collections">DISCOVER THE COLLECTION <span>↗</span></a>
        </div>
        <div className="hero-art" aria-label="Abstract sculptural fragrance-inspired artwork">
          <div className="halo halo-one" />
          <div className="halo halo-two" />
          <div className="stone stone-back" />
          <div className="stone stone-front" />
          <div className="hero-caption">SCENT AS AN<br />ART FORM</div>
        </div>
        <div className="hero-index"><span>01</span> / 03</div>
      </section>

      <section className="collections" id="collections">
        <div className="section-heading">
          <p className="eyebrow">EXPLORE AVIDEZURI</p>
          <h2>Composed to be <em>remembered.</em></h2>
        </div>
        <div className="collection-grid">
          {collections.map((item) => (
            <article className="collection-card" key={item.number}>
              <span className="card-number">{item.number}</span>
              <div className="card-mark">A.</div>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
              <span className="card-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <footer id="contact">
        <span className="wordmark">AVIDEZURI<span>®</span></span>
        <p>THE ART OF FRAGRANCE</p>
        <span>© {new Date().getFullYear()} AVIDEZURI</span>
      </footer>
    </main>
  );
}
