import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminPage.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';
const PAYMENT_LABELS = { cash: 'מזומן במשלוח', card: 'כרטיס אשראי' };
const ORDER_STATUS_LABELS = { supplied: 'הזמנה סופקה', not_supplied: '' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDeliverySlot(slot) {
  if (!slot) return '—';
  const parts = slot.trim().split(/\s+/);
  if (parts.length >= 2) {
    const [datePart, hourPart] = parts;
    const [y, m, d] = datePart.split('-');
    if (y && m && d) {
      const dateStr = [d, m, y].join('/');
      return `${dateStr} ${hourPart}:00`;
    }
  }
  return slot;
}

function OrdersTable({ orders, onSelectOrder, onUpdateStatus, updatingId }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-orders-table">
        <thead>
          <tr>
            <th>מועד פתיחת ההזמנה</th>
            <th>מועד שילוח רצוי</th>
            <th>סטטוס הזמנה</th>
            <th>שם הלקוח</th>
            <th>טלפון</th>
            <th>כתובת</th>
            <th>עיר</th>
            <th>תשלום</th>
            <th>משלוח אקספרס</th>
            <th>מזהה</th>
            <th>סה״כ</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="admin-order-row"
              onClick={() => onSelectOrder(order)}
            >
              <td>{formatDate(order.created_at)}</td>
              <td>{order.delivery_time_slot ? formatDeliverySlot(order.delivery_time_slot) : 'מיידי'}</td>
              <td className="admin-td-status" onClick={(e) => e.stopPropagation()}>
                {order.order_status === 'supplied' ? (
                  <button
                    type="button"
                    className="admin-row-btn"
                    onClick={() => onUpdateStatus(order.id, 'not_supplied')}
                    disabled={updatingId === order.id}
                  >
                    {updatingId === order.id ? '...' : 'סמן כלא סופקה'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-row-btn"
                    onClick={() => onUpdateStatus(order.id, 'supplied')}
                    disabled={updatingId === order.id}
                  >
                    {updatingId === order.id ? '...' : 'סמן כסופקה'}
                  </button>
                )}
              </td>
              <td>{order.customer_name}</td>
              <td><a href={`tel:${order.customer_phone}`} onClick={(e) => e.stopPropagation()}>{order.customer_phone}</a></td>
              <td>{order.delivery_address}</td>
              <td>{order.delivery_city}</td>
              <td>{PAYMENT_LABELS[order.payment_method] || order.payment_method}</td>
              <td>{order.express_delivery ? 'כן' : 'לא'}</td>
              <td className="admin-td-mono">{order.id.slice(0, 8)}…</td>
              <td className="admin-td-total">₪{Number(order.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [carousel, setCarousel] = useState([]);
  const [carouselUploading, setCarouselUploading] = useState(false);
  const [carouselDeletingId, setCarouselDeletingId] = useState(null);
  const [adminCategories, setAdminCategories] = useState([]);
  const [adminSubcategories, setAdminSubcategories] = useState([]);
  const [categorySaving, setCategorySaving] = useState(false);
  const [subcategorySaving, setSubcategorySaving] = useState(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState(null);
  const [subcategoryDeletingId, setSubcategoryDeletingId] = useState(null);
  const [categoryPhotoUploadingId, setCategoryPhotoUploadingId] = useState(null);
  const [subcategoryPhotoUploadingId, setSubcategoryPhotoUploadingId] = useState(null);
  const [categoryFileSelected, setCategoryFileSelected] = useState(null);
  const [subcategoryFileSelected, setSubcategoryFileSelected] = useState(null);

  const loadOrders = () => {
    return fetch(`${API}/admin/orders`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(setOrders);
  };

  const loadCarousel = () => {
    return fetch(`${API}/admin/carousel`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCarousel)
      .catch(() => setCarousel([]));
  };

  const loadAdminCategories = () => {
    return fetch(`${API}/admin/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAdminCategories)
      .catch(() => setAdminCategories([]));
  };

  const loadAdminSubcategories = () => {
    return fetch(`${API}/admin/subcategories`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAdminSubcategories)
      .catch(() => setAdminSubcategories([]));
  };

  useEffect(() => {
    loadOrders()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCarousel();
  }, []);

  useEffect(() => {
    loadAdminCategories();
    loadAdminSubcategories();
  }, []);

  const ordersSupplied = orders.filter((o) => o.order_status === 'supplied');
  const ordersNotSupplied = orders.filter((o) => o.order_status !== 'supplied');

  const updateOrderStatus = async (orderId, order_status) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status }),
      });
      if (!res.ok) throw new Error();
      await loadOrders();
      setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, order_status } : prev));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">טוען הזמנות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">שגיאה: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="admin-back">← חזרה לחנות</Link>
        <h1 className="admin-title">ניהול הזמנות</h1>
        <p className="admin-subtitle">לחצו על שורה לפתיחת פרטים. סטטוס הזמנה ניתן לשינוי רק מהאדמין.</p>
        <div className="admin-header-actions">
          <Link to="/admin/products/new" className="admin-add-product-btn">+ הוסף מוצר</Link>
          <Link to="/admin/products" className="admin-edit-products-btn">✎ ערוך מוצרים</Link>
        </div>
      </header>

      <section className="admin-section admin-carousel-section">
        <h2 className="admin-section-title">קרוסלת דף הבית</h2>
        <p className="admin-section-desc">בחר תמונה — היא תתווסף אוטומטית.</p>
        <div className="admin-carousel-add">
          <label className="admin-carousel-add-label">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-label="בחר תמונה"
              disabled={carouselUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCarouselUploading(true);
                try {
                  const fd = new FormData();
                  fd.append('image', file);
                  const res = await fetch(`${API}/admin/carousel`, { method: 'POST', body: fd });
                  if (!res.ok) throw new Error();
                  await loadCarousel();
                } catch (err) {
                  alert('שגיאה בהוספת תמונה');
                } finally {
                  setCarouselUploading(false);
                  e.target.value = '';
                }
              }}
            />
            <span className="admin-carousel-add-label-text">{carouselUploading ? 'מעלה...' : 'בחר תמונה להוספה'}</span>
          </label>
        </div>
        {carousel.length > 0 ? (
          <div className="admin-carousel-list">
            {carousel.map((slide) => (
              <div key={slide.id} className="admin-carousel-item">
                <img src={slide.image_url} alt="" className="admin-carousel-thumb" />
                <button
                  type="button"
                  className="admin-carousel-delete"
                  disabled={carouselDeletingId === slide.id}
                  onClick={async () => {
                    setCarouselDeletingId(slide.id);
                    try {
                      const res = await fetch(`${API}/admin/carousel/${slide.id}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error();
                      await loadCarousel();
                    } catch (err) {
                      alert('שגיאה במחיקה');
                    } finally {
                      setCarouselDeletingId(null);
                    }
                  }}
                >
                  {carouselDeletingId === slide.id ? '...' : 'מחק'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-section-empty">אין תמונות בקרוסלה. הוסף תמונה למעלה.</p>
        )}
      </section>

      <section className="admin-section admin-categories-section">
        <h2 className="admin-section-title">קטגוריות</h2>
        <p className="admin-section-desc">הוסף או מחק קטגוריות. העלאת תמונה מציגה תמונה בכרטיס הקטגוריה בדף הבית (במקום אייקון).</p>
        <form
          className="admin-cat-sub-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target;
            const name_he = (form.querySelector('input[name="cat_name_he"]')?.value || '').trim();
            if (!name_he) return;
            setCategorySaving(true);
            try {
              const fd = new FormData();
              fd.append('name_he', name_he);
              fd.append('sort_order', adminCategories.length);
              const file = form.querySelector('input[name="cat_image"]')?.files?.[0];
              if (file) fd.append('image', file);
              const res = await fetch(`${API}/admin/categories`, { method: 'POST', body: fd });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || res.statusText);
              }
              await loadAdminCategories();
              form.reset();
              setCategoryFileSelected(null);
            } catch (err) {
              alert(err.message || 'שגיאה בהוספת קטגוריה');
            } finally {
              setCategorySaving(false);
            }
          }}
        >
          <input type="text" name="cat_name_he" placeholder="שם קטגוריה" required />
          <div className="admin-file-wrap">
            <label className="admin-file-label">
              <input
                type="file"
                name="cat_image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="תמונה אופציונלית"
                onChange={(e) => setCategoryFileSelected(e.target.files?.[0]?.name || null)}
              />
              <span>תמונה (אופציונלי)</span>
            </label>
            {categoryFileSelected && <span className="admin-file-hint">✓ תמונה נבחרה</span>}
          </div>
          <button type="submit" disabled={categorySaving}>{categorySaving ? 'שומר...' : '+ הוסף קטגוריה'}</button>
        </form>
        <div className="admin-cat-sub-list">
          {adminCategories.map((cat) => (
            <div key={cat.id} className="admin-cat-sub-item">
              <span className="admin-cat-sub-preview">
                {cat.image_url ? <img src={cat.image_url} alt="" /> : (cat.icon ? <span className="admin-cat-sub-icon">{cat.icon}</span> : null)}
              </span>
              <span className="admin-cat-sub-name">{cat.name_he}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="admin-hidden-file"
                aria-label={`העלה תמונה ל${cat.name_he}`}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCategoryPhotoUploadingId(cat.id);
                  try {
                    const fd = new FormData();
                    fd.append('image', file);
                    const res = await fetch(`${API}/admin/categories/${cat.id}`, { method: 'PATCH', body: fd });
                    if (!res.ok) throw new Error();
                    await loadAdminCategories();
                  } catch (err) {
                    alert('שגיאה בהעלאת תמונה');
                  } finally {
                    setCategoryPhotoUploadingId(null);
                    e.target.value = '';
                  }
                }}
              />
              <button type="button" className="admin-cat-sub-upload-btn" onClick={(ev) => ev.currentTarget.closest('.admin-cat-sub-item').querySelector('.admin-hidden-file')?.click()} disabled={categoryPhotoUploadingId === cat.id}>
                {categoryPhotoUploadingId === cat.id ? '...' : 'העלה תמונה'}
              </button>
              <button
                type="button"
                className="admin-cat-sub-delete"
                disabled={categoryDeletingId === cat.id}
                onClick={async () => {
                  if (!confirm(`למחוק את הקטגוריה "${cat.name_he}"? (רק אם אין תת־קטגוריות)`)) return;
                  setCategoryDeletingId(cat.id);
                  try {
                    const res = await fetch(`${API}/admin/categories/${cat.id}`, { method: 'DELETE' });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || res.statusText);
                    }
                    await loadAdminCategories();
                    await loadAdminSubcategories();
                  } catch (err) {
                    alert(err.message || 'שגיאה במחיקה');
                  } finally {
                    setCategoryDeletingId(null);
                  }
                }}
              >
                {categoryDeletingId === cat.id ? '...' : 'מחק'}
              </button>
            </div>
          ))}
        </div>
        {adminCategories.length === 0 && <p className="admin-section-empty">אין קטגוריות בניהול (הקטגוריות הקיימות מוצגות בחנות).</p>}
      </section>

      <section className="admin-section admin-subcategories-section">
        <h2 className="admin-section-title">תת־קטגוריות</h2>
        <p className="admin-section-desc">הוסף או מחק תת־קטגוריות. בחר קטגוריה ואז שם. העלאת תמונה מציגה תמונה בכרטיס התת־קטגוריה.</p>
        <form
          className="admin-cat-sub-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target;
            const category_id = form.querySelector('select[name="sub_category_id"]')?.value;
            const name_he = (form.querySelector('input[name="sub_name_he"]')?.value || '').trim();
            if (!category_id || !name_he) return;
            setSubcategorySaving(true);
            try {
              const fd = new FormData();
              fd.append('category_id', category_id);
              fd.append('name_he', name_he);
              fd.append('sort_order', adminSubcategories.filter((s) => s.category_id === category_id).length);
              const file = form.querySelector('input[name="sub_image"]')?.files?.[0];
              if (file) fd.append('image', file);
              const res = await fetch(`${API}/admin/subcategories`, { method: 'POST', body: fd });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || res.statusText);
              }
              await loadAdminSubcategories();
              form.reset();
              setSubcategoryFileSelected(null);
            } catch (err) {
              alert(err.message || 'שגיאה בהוספת תת־קטגוריה');
            } finally {
              setSubcategorySaving(false);
            }
          }}
        >
          <select name="sub_category_id" required aria-label="קטגוריה">
            <option value="">בחר קטגוריה</option>
            {adminCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_he}</option>
            ))}
          </select>
          <input type="text" name="sub_name_he" placeholder="שם תת־קטגוריה" required />
          <div className="admin-file-wrap">
            <label className="admin-file-label">
              <input
                type="file"
                name="sub_image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="תמונה אופציונלית"
                onChange={(e) => setSubcategoryFileSelected(e.target.files?.[0]?.name || null)}
              />
              <span>תמונה (אופציונלי)</span>
            </label>
            {subcategoryFileSelected && <span className="admin-file-hint">✓ תמונה נבחרה</span>}
          </div>
          <button type="submit" disabled={subcategorySaving}>{subcategorySaving ? 'שומר...' : '+ הוסף תת־קטגוריה'}</button>
        </form>
        <div className="admin-cat-sub-list">
          {adminSubcategories.map((sub) => (
            <div key={sub.id} className="admin-cat-sub-item">
              <span className="admin-cat-sub-preview">
                {sub.image_url ? <img src={sub.image_url} alt="" /> : null}
              </span>
              <span className="admin-cat-sub-name">{sub.name_he}</span>
              <span className="admin-cat-sub-meta">{adminCategories.find((c) => c.id === sub.category_id)?.name_he || sub.category_id}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="admin-hidden-file"
                aria-label={`העלה תמונה ל${sub.name_he}`}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSubcategoryPhotoUploadingId(sub.id);
                  try {
                    const fd = new FormData();
                    fd.append('image', file);
                    const res = await fetch(`${API}/admin/subcategories/${sub.id}`, { method: 'PATCH', body: fd });
                    if (!res.ok) throw new Error();
                    await loadAdminSubcategories();
                  } catch (err) {
                    alert('שגיאה בהעלאת תמונה');
                  } finally {
                    setSubcategoryPhotoUploadingId(null);
                    e.target.value = '';
                  }
                }}
              />
              <button type="button" className="admin-cat-sub-upload-btn" onClick={(ev) => ev.currentTarget.closest('.admin-cat-sub-item').querySelector('.admin-hidden-file')?.click()} disabled={subcategoryPhotoUploadingId === sub.id}>
                {subcategoryPhotoUploadingId === sub.id ? '...' : 'העלה תמונה'}
              </button>
              <button
                type="button"
                className="admin-cat-sub-delete"
                disabled={subcategoryDeletingId === sub.id}
                onClick={async () => {
                  if (!confirm(`למחוק את התת־קטגוריה "${sub.name_he}"? (רק אם אין מוצרים)`)) return;
                  setSubcategoryDeletingId(sub.id);
                  try {
                    const res = await fetch(`${API}/admin/subcategories/${sub.id}`, { method: 'DELETE' });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || res.statusText);
                    }
                    await loadAdminSubcategories();
                  } catch (err) {
                    alert(err.message || 'שגיאה במחיקה');
                  } finally {
                    setSubcategoryDeletingId(null);
                  }
                }}
              >
                {subcategoryDeletingId === sub.id ? '...' : 'מחק'}
              </button>
            </div>
          ))}
        </div>
        {adminSubcategories.length === 0 && <p className="admin-section-empty">אין תת־קטגוריות.</p>}
      </section>

      {orders.length === 0 ? (
        <p className="admin-empty">אין הזמנות עדיין.</p>
      ) : (
        <>
          <section className="admin-section">
            <h2 className="admin-section-title">הזמנות שעוד לא סופקו</h2>
            {ordersNotSupplied.length === 0 ? (
              <p className="admin-section-empty">אין הזמנות.</p>
            ) : (
              <OrdersTable orders={ordersNotSupplied} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} updatingId={updatingId} />
            )}
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">הזמנות שסופקו</h2>
            {ordersSupplied.length === 0 ? (
              <p className="admin-section-empty">אין הזמנות.</p>
            ) : (
              <OrdersTable orders={ordersSupplied} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} updatingId={updatingId} />
            )}
          </section>
        </>
      )}

      {selectedOrder && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedOrder(null)}
          role="button"
          tabIndex={0}
          aria-label="סגור"
          onKeyDown={(e) => e.key === 'Escape' && setSelectedOrder(null)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2 className="admin-modal-title">פרטי הזמנה</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="סגור"
              >
                ×
              </button>
            </div>
            <dl className="admin-modal-details">
              <div><dt>מזהה</dt><dd className="admin-dd-mono">{selectedOrder.id}</dd></div>
              <div><dt>תאריך</dt><dd>{formatDate(selectedOrder.created_at)}</dd></div>
              <div><dt>שם</dt><dd>{selectedOrder.customer_name}</dd></div>
              <div><dt>טלפון</dt><dd><a href={`tel:${selectedOrder.customer_phone}`}>{selectedOrder.customer_phone}</a></dd></div>
              <div><dt>כתובת משלוח</dt><dd>{selectedOrder.delivery_address}, {selectedOrder.delivery_city}</dd></div>
              <div><dt>אמצעי תשלום</dt><dd>{PAYMENT_LABELS[selectedOrder.payment_method] || selectedOrder.payment_method}</dd></div>
              <div><dt>משלוח אקספרס</dt><dd>{selectedOrder.express_delivery ? 'כן' : 'לא'}</dd></div>
              {selectedOrder.delivery_time_slot && (
                <div><dt>שעת משלוח</dt><dd>{formatDeliverySlot(selectedOrder.delivery_time_slot)}</dd></div>
              )}
              <div><dt>סטטוס הזמנה</dt><dd>{ORDER_STATUS_LABELS[selectedOrder.order_status] || selectedOrder.order_status}</dd></div>
              <div><dt>סה״כ</dt><dd className="admin-dd-total">₪{Number(selectedOrder.total).toFixed(2)}</dd></div>
              {selectedOrder.customer_notes && (
                <div><dt>הערות</dt><dd>{selectedOrder.customer_notes}</dd></div>
              )}
            </dl>
            <div className="admin-modal-actions">
              {selectedOrder.order_status === 'supplied' ? (
                <button
                  type="button"
                  className="admin-modal-btn admin-modal-btn-secondary"
                  onClick={() => updateOrderStatus(selectedOrder.id, 'not_supplied')}
                  disabled={updatingId === selectedOrder.id}
                >
                  סמן כלא סופקה
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-modal-btn"
                  onClick={() => updateOrderStatus(selectedOrder.id, 'supplied')}
                  disabled={updatingId === selectedOrder.id}
                >
                  {updatingId === selectedOrder.id ? 'מעדכן...' : 'סמן כסופקה'}
                </button>
              )}
            </div>
            <h3 className="admin-modal-items-title">מוצרים בהזמנה</h3>
            <table className="admin-modal-items-table">
              <thead>
                <tr>
                  <th>מוצר</th>
                  <th>כמות</th>
                  <th>מחיר ליח׳</th>
                  <th>סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.items || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name_he}</td>
                    <td>{item.quantity}</td>
                    <td>₪{Number(item.unit_price).toFixed(2)}</td>
                    <td>₪{Number(item.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
