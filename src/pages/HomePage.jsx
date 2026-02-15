import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import './HomePage.css';

export default function HomePage() {
  const { categories } = useStore();

  return (
    <div className="home-page">
      {/* Top announcement strip */}
      <div className="home-announce">
        <span className="home-announce-dot" />
        <span>משלוח חינם בהזמנה מעל ₪99</span>
        <span className="home-announce-sep">•</span>
        <span>הכל במקום אחד</span>
      </div>

      {/* Hero */}
      <header className="home-hero">
        <div className="home-hero-bg" aria-hidden />
        <h1 className="home-hero-title">
          <span className="home-hero-title-main">
            קריות-מרקט
            <br />
            online
          </span>
          <span className="home-hero-title-sub">גלו קטגוריות ומצאו את מה שצריך</span>
        </h1>
        <p className="home-hero-tagline">
          משקאות, מזווה, טיפוח, אלקטרוניקה ועוד – בחירה נוחה וממוקדת.
        </p>
      </header>

      {/* Customer pull – same design, different content */}
      <section className="home-stats">
        <div className="home-stat">
          <span className="home-stat-value">משלוח חינם</span>
          <span className="home-stat-label">בהזמנה מעל ₪99</span>
        </div>
        <div className="home-stat-sep" />
        <div className="home-stat">
          <span className="home-stat-value">מגוון רחב</span>
          <span className="home-stat-label">הכל במקום אחד</span>
        </div>
        <div className="home-stat-sep" />
        <div className="home-stat">
          <span className="home-stat-value">שירות מהיר</span>
          <span className="home-stat-label">משלוח עד הדלת</span>
        </div>
      </section>

      {/* Section label */}
      <div className="home-section-head">
        <h2 className="home-section-title">בחרו קטגוריה</h2>
        <p className="home-section-desc">לחצו על כרטיס כדי לראות תת־קטגוריות ומוצרים</p>
      </div>

      {/* Category grid */}
      <main className="home-categories-wrap">
        <div className="categories-grid">
          {categories.map((cat, index) => {
            const subCount = cat.subcategories?.length || 0;
            const productCount = cat.subcategories?.reduce((s, sub) => s + (sub.products?.length || 0), 0) || 0;
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="category-tile"
                style={{ '--delay': `${index * 0.05}s` }}
              >
                <span className="category-tile-number">{index + 1}</span>
                <span className="category-tile-icon-wrap">
                  {cat.icon && <span className="category-tile-icon" aria-hidden>{cat.icon}</span>}
                </span>
                <h2 className="category-tile-name">{cat.name_he}</h2>
                <div className="category-tile-meta">
                  <span>{subCount} תת־קטגוריות</span>
                  {productCount > 0 && <span>{productCount} מוצרים</span>}
                </div>
                <span className="category-tile-arrow">←</span>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Bottom trust line */}
      <footer className="home-footer">
        <span>משלוחים מהירים</span>
        <span className="home-footer-dot" />
        <span>תשלום מאובטח</span>
        <span className="home-footer-dot" />
        <span>שירות לקוחות</span>
      </footer>
    </div>
  );
}
