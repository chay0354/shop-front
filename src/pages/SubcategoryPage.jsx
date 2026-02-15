import { Link, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { useCart } from '../CartContext';
import './SubcategoryPage.css';

export default function SubcategoryPage() {
  const { subcategoryId } = useParams();
  const { getSubcategory } = useStore();
  const { addItem } = useCart();
  const found = getSubcategory(subcategoryId);

  if (!found) return <Navigate to="/" replace />;

  const { category, subcategory } = found;
  const products = subcategory.products || [];

  return (
    <div className="subcategory-page">
      <header className="page-header">
        <Link to={`/category/${category.id}`} className="back-link">← חזרה ל־{category.name_he}</Link>
        <h1 className="page-title">{subcategory.name_he}</h1>
        <p className="page-subtitle">מוצרים בתת־קטגוריה</p>
      </header>

      <main className="products-grid">
        {products.length === 0 ? (
          <p className="empty-message">אין מוצרים בתת־קטגוריה זו.</p>
        ) : (
          products.map((product) => {
            const imageUrl = product.image_url || product.imageUrl || null;
            return (
            <article key={product.id} className="product-card">
              <div className="product-card-image-wrap">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="product-card-image" />
                ) : (
                  <div className="product-card-image-placeholder" aria-hidden>אין תמונה</div>
                )}
              </div>
              <div className="product-card-body">
                <h3 className="product-card-name">{product.name_he}</h3>
                {product.description_he && (
                  <p className="product-card-desc">{product.description_he}</p>
                )}
                <p className="product-card-price">
                  ₪{Number(product.price).toFixed(2)}
                </p>
                <button
                  type="button"
                  className="product-card-add"
                  onClick={() => addItem(product)}
                >
                  הוסף לסל
                </button>
              </div>
            </article>
            );
          })
        )}
      </main>
    </div>
  );
}
