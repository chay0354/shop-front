import { Link, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import './CategoryPage.css';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const { getCategory } = useStore();
  const category = getCategory(categoryId);

  if (!category) return <Navigate to="/" replace />;

  const subcategories = category.subcategories || [];
  const totalProducts = subcategories.reduce((s, sub) => s + (sub.products?.length || 0), 0);

  return (
    <div className="category-page">
      <div className="category-page-bg" aria-hidden />

      {/* Top nav */}
      <nav className="category-nav">
        <Link to="/" className="category-back">
          <span className="category-back-arrow">←</span>
          <span>חזרה לקטגוריות</span>
        </Link>
      </nav>

      {/* Category hero */}
      <header className="category-hero">
        <div className="category-hero-icon-wrap">
          {category.image_url ? (
            <img src={category.image_url} alt="" className="category-hero-image" />
          ) : category.icon ? (
            <span className="category-hero-icon" aria-hidden>{category.icon}</span>
          ) : null}
        </div>
        <h1 className="category-hero-title">{category.name_he}</h1>
        <p className="category-hero-subtitle">בחרו תת־קטגוריה והתחילו לגלוש במוצרים</p>
        {totalProducts > 0 && (
          <p className="category-hero-meta">{subcategories.length} תת־קטגוריות • {totalProducts} מוצרים</p>
        )}
      </header>

      {/* Subcategories grid */}
      <main className="category-main">
        {subcategories.length === 0 ? (
          <p className="category-empty">אין תת־קטגוריות בקטגוריה זו.</p>
        ) : (
          <>
            <h2 className="category-section-title">תת־קטגוריות</h2>
            <div className="subcategories-grid">
              {subcategories.map((sub, index) => {
                const products = sub.products || [];
                const previewNames = products.slice(0, 3).map((p) => p.name_he).filter(Boolean);
                const previewText = previewNames.length > 0 ? previewNames.join(' • ') : null;
                return (
                <Link
                  key={sub.id}
                  to={`/subcategory/${sub.id}`}
                  className="subcategory-card"
                  style={{ '--delay': `${index * 0.04}s` }}
                >
                  <span className="subcategory-card-accent" />
                  {sub.image_url && (
                    <div className="subcategory-card-image-wrap">
                      <img src={sub.image_url} alt="" className="subcategory-card-image" />
                    </div>
                  )}
                  <div className="subcategory-card-top">
                    <span className="subcategory-card-name">{sub.name_he}</span>
                  </div>
                  {previewText && (
                    <p className="subcategory-card-preview" title={previewText}>{previewText}</p>
                  )}
                  {products.length === 0 && (
                    <p className="subcategory-card-empty">עדיין אין מוצרים בתת־קטגוריה זו</p>
                  )}
                  <span className="subcategory-card-cta">לחצו לגלוש ←</span>
                </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
