
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">THE NEW COLLECTION / 2026</span>
          <h1>WEAR YOUR<br /><em>OWN STORY.</em></h1>
          <p>
            Discover everyday essentials, oversized fits,
            and modern streetwear made for your style.
          </p>
          <Link to="/shop" className="btn btn-white">
            SHOP COLLECTION <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-art">
          <span>SS / 26</span>
          <ShoppingArtwork />
        </div>
      </section>

      <section className="section center">
        <span className="eyebrow dark">EXPLORE SHOP SQUARE</span>
        <h2>Find your next favourite fit.</h2>
        <p className="muted">Clean silhouettes. Effortless style.</p>

        <div className="category-grid">
          {["T-Shirts", "Hoodies", "Pants", "Accessories"].map(category => (
            <Link
              key={category}
              to={`/shop?category=${encodeURIComponent(category)}`}
              className="category-card"
            >
              <div className="category-symbol">
                {category === "T-Shirts" ? "TEE" :
                 category === "Hoodies" ? "HD" :
                 category === "Pants" ? "PT" : "AC"}
              </div>
              <h3>{category}</h3>
              <span>EXPLORE →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="promo-section">
        <span className="eyebrow">YOUR STYLE, YOUR RULES</span>
        <h2>LESS ORDINARY.<br />MORE YOU.</h2>
        <Link to="/shop" className="btn btn-white">
          EXPLORE THE STORE <ArrowRight size={18} />
        </Link>
      </section>

      <section className="benefits">
        <div><Truck /><h3>Easy Shopping</h3><p>Browse and order online</p></div>
        <div><ShieldCheck /><h3>Secure Experience</h3><p>Account security in development</p></div>
        <div><RotateCcw /><h3>Manage Your Cart</h3><p>Edit items before checkout</p></div>
      </section>
    </>
  );
}

function ShoppingArtwork() {
  return (
    <div className="hero-graphic">
      <div className="graphic-circle" />
      <div className="graphic-text">SQUARE</div>
      <div className="graphic-label">EVERYDAY STREETWEAR</div>
    </div>
  );
}
