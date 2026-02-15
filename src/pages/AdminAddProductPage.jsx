import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminAddProductPage.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';

export default function AdminAddProductPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [name_he, setNameHe] = useState('');
  const [description_he, setDescriptionHe] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId('');
      return;
    }
    fetch(`${API}/subcategories?category_id=${encodeURIComponent(categoryId)}`)
      .then((r) => r.json())
      .then(setSubcategories)
      .catch(() => setSubcategories([]));
    setSubcategoryId('');
  }, [categoryId]);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const resetForm = () => {
    setSubcategoryId('');
    setNameHe('');
    setDescriptionHe('');
    setPrice('');
    setImageFile(null);
    setImagePreview(null);
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!subcategoryId || !name_he.trim()) {
      setMessage({ type: 'error', text: 'נא לבחור תת־קטגוריה ולמלא שם מוצר.' });
      return;
    }
    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      setMessage({ type: 'error', text: 'מחיר לא תקין.' });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('subcategory_id', subcategoryId);
      formData.append('name_he', name_he.trim());
      if (description_he.trim()) formData.append('description_he', description_he.trim());
      formData.append('price', numPrice);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch(`${API}/admin/products`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'שגיאה בשמירת מוצר' });
        return;
      }
      setMessage({ type: 'success', text: 'המוצר נוסף בהצלחה!' });
      resetForm();
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'שגיאה ברשת' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-product-page">
      <header className="admin-add-product-header">
        <Link to="/admin" className="admin-add-product-back">← חזרה לניהול הזמנות</Link>
        <h1 className="admin-add-product-title">הוסף מוצר חדש</h1>
      </header>

      <form className="admin-add-product-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <label className="admin-form-label">קטגוריה</label>
          <select
            className="admin-form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">בחר קטגוריה</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_he}</option>
            ))}
          </select>
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">תת־קטגוריה</label>
          <select
            className="admin-form-select"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            required
            disabled={!subcategories.length}
          >
            <option value="">בחר תת־קטגוריה</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name_he}</option>
            ))}
          </select>
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">שם מוצר</label>
          <input
            type="text"
            className="admin-form-input"
            value={name_he}
            onChange={(e) => setNameHe(e.target.value)}
            placeholder="שם בעברית"
            required
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">תיאור (אופציונלי)</label>
          <textarea
            className="admin-form-input admin-form-textarea"
            value={description_he}
            onChange={(e) => setDescriptionHe(e.target.value)}
            placeholder="תיאור קצר"
            rows={2}
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">מחיר (₪)</label>
          <input
            type="number"
            className="admin-form-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">תמונה (אופציונלי)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="admin-form-file-hidden"
            onChange={handleImageChange}
            aria-label="בחר תמונה"
          />
          <div className="admin-form-image-zone">
            {imagePreview ? (
              <>
                <div className="admin-form-image-preview-wrap">
                  <img src={imagePreview} alt="" className="admin-form-image-preview" />
                </div>
                <div className="admin-form-image-actions">
                  <button type="button" className="admin-form-image-btn admin-form-image-btn-change" onClick={() => fileInputRef.current?.click()}>
                    החלף תמונה
                  </button>
                  <button type="button" className="admin-form-image-btn admin-form-image-btn-remove" onClick={clearImage}>
                    הסר תמונה
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="admin-form-image-choose" onClick={() => fileInputRef.current?.click()}>
                📷 בחר תמונה
              </button>
            )}
          </div>
        </div>
        {message && (
          <p className={message.type === 'success' ? 'admin-form-success' : 'admin-form-error'}>
            {message.text}
          </p>
        )}
        <button type="submit" className="admin-form-submit" disabled={submitting}>
          {submitting ? 'שומר...' : 'הוסף מוצר'}
        </button>
      </form>
    </div>
  );
}
