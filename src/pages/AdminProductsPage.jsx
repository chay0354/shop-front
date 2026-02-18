import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AdminAddProductPage.css';
import './AdminProductsPage.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const loadProducts = () =>
    fetch(`${API}/admin/products`)
      .then((r) => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => setProducts([]));

  const loadCategories = () =>
    fetch(`${API}/categories`)
      .then((r) => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => setCategories([]));

  useEffect(() => {
    Promise.all([loadProducts(), loadCategories()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!filterCategory) {
      setSubcategories([]);
      setFilterSubcategory('');
      return;
    }
    fetch(`${API}/subcategories?category_id=${encodeURIComponent(filterCategory)}`)
      .then((r) => r.json())
      .then(setSubcategories)
      .catch(() => setSubcategories([]));
    setFilterSubcategory('');
  }, [filterCategory]);

  const filtered = products.filter((p) => {
    if (filterCategory && p.category_id !== filterCategory) return false;
    if (filterSubcategory && p.subcategory_id !== filterSubcategory) return false;
    return true;
  });

  const openEdit = (product) => {
    setEditing({
      id: product.id,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id,
      name_he: product.name_he || '',
      description_he: product.description_he || '',
      price: String(product.price ?? ''),
      image_url: product.image_url,
      imageFile: null,
      imagePreview: product.image_url || null,
      hidden: !!product.hidden,
    });
    setMessage(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setEditField = (field, value) => {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  useEffect(() => {
    if (!editing?.category_id) return;
    fetch(`${API}/subcategories?category_id=${encodeURIComponent(editing.category_id)}`)
      .then((r) => r.json())
      .then((subs) => {
        setEditing((prev) => (prev ? { ...prev, subcategoriesForSelect: subs } : null));
      })
      .catch(() => setEditing((prev) => (prev ? { ...prev, subcategoriesForSelect: [] } : null)));
  }, [editing?.category_id]);

  const onEditImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setEditing((prev) => {
      if (!prev) return null;
      const next = { ...prev, imageFile: file };
      if (file) next.imagePreview = URL.createObjectURL(file);
      else next.imagePreview = prev.image_url || null;
      return next;
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setMessage(null);
    const numPrice = Number(editing.price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      setMessage({ type: 'error', text: 'מחיר לא תקין.' });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name_he', (editing.name_he || '').trim());
      formData.append('description_he', (editing.description_he || '').trim() || '');
      formData.append('price', numPrice);
      formData.append('subcategory_id', editing.subcategory_id);
      formData.append('hidden', editing.hidden ? 'true' : 'false');
      if (editing.imageFile) formData.append('image', editing.imageFile);

      const res = await fetch(`${API}/admin/products/${editing.id}`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'שגיאה בעדכון' });
        return;
      }
      setMessage({ type: 'success', text: 'המוצר עודכן בהצלחה!' });
      await loadProducts();
      setTimeout(() => closeEdit(), 1200);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'שגיאה ברשת' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`למחוק את המוצר "${product.name_he}"?`)) return;
    setDeletingId(product.id);
    try {
      const res = await fetch(`${API}/admin/products/${product.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await loadProducts();
    } catch {
      setMessage({ type: 'error', text: 'שגיאה במחיקת מוצר' });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-products-page">
        <div className="admin-products-loading">טוען מוצרים...</div>
      </div>
    );
  }

  return (
    <div className="admin-products-page">
      <header className="admin-products-header">
        <Link to="/admin" className="admin-products-back">← חזרה לניהול הזמנות</Link>
        <h1 className="admin-products-title">ערוך מוצרים</h1>
        <p className="admin-products-subtitle">סננו לפי קטגוריה או תת־קטגוריה ולחצו ערוך על מוצר</p>
      </header>

      <div className="admin-products-filters">
        <div className="admin-products-filter-row">
          <label className="admin-products-filter-label">קטגוריה</label>
          <select
            className="admin-products-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">הכל</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_he}</option>
            ))}
          </select>
        </div>
        <div className="admin-products-filter-row">
          <label className="admin-products-filter-label">תת־קטגוריה</label>
          <select
            className="admin-products-filter-select"
            value={filterSubcategory}
            onChange={(e) => setFilterSubcategory(e.target.value)}
            disabled={!subcategories.length}
          >
            <option value="">הכל</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name_he}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-products-list-wrap">
        {filtered.length === 0 ? (
          <p className="admin-products-empty">אין מוצרים להצגה.</p>
        ) : (
          <ul className="admin-products-list">
            {filtered.map((p) => (
              <li key={p.id} className="admin-products-item">
                <div className="admin-products-item-thumb">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" />
                  ) : (
                    <span className="admin-products-item-no-img">אין תמונה</span>
                  )}
                </div>
                <div className="admin-products-item-info">
                  <div className="admin-products-item-name-row">
                    <span className="admin-products-item-name">{p.name_he}</span>
                    {p.hidden && <span className="admin-products-item-badge-hidden" title="מוצר מוסתר">מוסתר</span>}
                  </div>
                  <span className="admin-products-item-meta">
                    {p.category_name} → {p.subcategory_name} · ₪{Number(p.price).toFixed(2)}
                  </span>
                </div>
                <div className="admin-products-item-actions">
                <button
                  type="button"
                  className="admin-products-item-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                  disabled={deletingId === p.id}
                  title="מחק מוצר"
                >
                  {deletingId === p.id ? '...' : 'מחק'}
                </button>
                <button
                  type="button"
                  className="admin-products-item-edit"
                  onClick={() => openEdit(p)}
                >
                  ערוך
                </button>
              </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div
          className="admin-products-modal-overlay"
          onClick={closeEdit}
          role="button"
          tabIndex={0}
          aria-label="סגור"
          onKeyDown={(e) => e.key === 'Escape' && closeEdit()}
        >
          <div className="admin-products-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-products-modal-head">
              <h2 className="admin-products-modal-title">ערוך מוצר</h2>
              <button type="button" className="admin-products-modal-close" onClick={closeEdit} aria-label="סגור">×</button>
            </div>
            <form className="admin-products-edit-form" onSubmit={handleSaveEdit}>
              <div className="admin-form-row">
                <label className="admin-form-label">קטגוריה</label>
                <select
                  className="admin-form-select"
                  value={editing.category_id}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, category_id: e.target.value, subcategory_id: '' } : null)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_he}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-row">
                <label className="admin-form-label">תת־קטגוריה</label>
                <select
                  className="admin-form-select"
                  value={editing.subcategory_id}
                  onChange={(e) => setEditField('subcategory_id', e.target.value)}
                  required
                >
                  {(editing.subcategoriesForSelect || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name_he}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-row">
                <label className="admin-form-label">שם מוצר</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={editing.name_he}
                  onChange={(e) => setEditField('name_he', e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-row">
                <label className="admin-form-label">תיאור (אופציונלי)</label>
                <textarea
                  className="admin-form-input admin-form-textarea"
                  value={editing.description_he}
                  onChange={(e) => setEditField('description_he', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="admin-form-row">
                <label className="admin-form-label">מחיר (₪)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={editing.price}
                  onChange={(e) => setEditField('price', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="admin-form-row admin-form-row-checkbox">
                <label className="admin-form-label admin-form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!editing.hidden}
                    onChange={(e) => setEditField('hidden', e.target.checked)}
                    className="admin-form-checkbox"
                  />
                  <span>הסתר מוצר (לא יוצג באתר)</span>
                </label>
              </div>
              <div className="admin-form-row">
                <label className="admin-form-label">תמונה (השאר ריק כדי לא לשנות)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="admin-form-file-hidden"
                  onChange={onEditImageChange}
                  aria-label="בחר תמונה"
                />
                <div className="admin-form-image-zone">
                  {editing.imagePreview ? (
                    <>
                      <div className="admin-form-image-preview-wrap">
                        <img src={editing.imagePreview} alt="" className="admin-form-image-preview" />
                      </div>
                      <div className="admin-form-image-actions">
                        <button type="button" className="admin-form-image-btn admin-form-image-btn-change" onClick={() => fileInputRef.current?.click()}>
                          החלף תמונה
                        </button>
                        <button
                          type="button"
                          className="admin-form-image-btn admin-form-image-btn-remove"
                          onClick={() => {
                            setEditing((prev) => prev ? { ...prev, imageFile: null, imagePreview: prev.image_url || null } : null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          הסר תמונה חדשה
                        </button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="admin-form-image-choose" onClick={() => fileInputRef.current?.click()}>
                      📷 בחר תמונה חדשה
                    </button>
                  )}
                </div>
              </div>
              {message && (
                <p className={message.type === 'success' ? 'admin-form-success' : 'admin-form-error'}>{message.text}</p>
              )}
              <div className="admin-products-modal-actions">
                <button type="button" className="admin-form-submit admin-form-cancel" onClick={closeEdit}>
                  ביטול
                </button>
                <button type="submit" className="admin-form-submit" disabled={saving}>
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
