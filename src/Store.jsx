import './Store.css';

export default function Store({ categories }) {
  return (
    <div className="store">
      <header className="store-header">
        <h1 className="store-title">קטגוריות</h1>
        <p className="store-subtitle">בחרו קטגוריה ותת־קטגוריה</p>
      </header>

      <main className="store-main">
        {categories.map((cat, index) => (
          <section key={cat.id} className="category-card">
            <div className="category-header">
              <span className="category-number">{index + 1}</span>
              {cat.icon && <span className="category-icon" aria-hidden>{cat.icon}</span>}
              <h2 className="category-name">{cat.name_he}</h2>
            </div>
            {cat.subcategories && cat.subcategories.length > 0 ? (
              <ul className="subcategories">
                {cat.subcategories.map((sub, subIndex) => (
                  <li key={sub.id} className="subcategory-item">
                    <span className="subcategory-dot" />
                    <span className="subcategory-name">{sub.name_he}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="subcategories-empty">אין תת־קטגוריות</p>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
