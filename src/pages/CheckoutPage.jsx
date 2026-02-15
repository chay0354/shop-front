import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import './CheckoutPage.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';
const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'מזומן במשלוח' },
  { id: 'card', label: 'כרטיס אשראי' },
];

const DELIVERY_HOUR_START = 8;
const DELIVERY_HOUR_END = 20;
const MIN_HOURS_FROM_NOW = 2;

function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getAvailableDeliverySlots() {
  const now = new Date();
  const currentHour = now.getHours();
  const isOutsideWindow = currentHour >= DELIVERY_HOUR_END || currentHour < DELIVERY_HOUR_START;
  const slots = [];
  const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

  if (isOutsideWindow) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateKey = formatDateKey(tomorrow);
    for (let h = DELIVERY_HOUR_START; h <= DELIVERY_HOUR_END; h++) {
      slots.push({ value: `${dateKey} ${h}`, label: `מחר ${hourLabel(h)}` });
    }
    return slots;
  }

  const nowPlus2 = new Date(now.getTime() + MIN_HOURS_FROM_NOW * 60 * 60 * 1000);
  const h2 = nowPlus2.getHours();
  const m2 = nowPlus2.getMinutes();
  const earliest = m2 > 0 ? h2 + 1 : h2;

  if (earliest > DELIVERY_HOUR_END) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateKey = formatDateKey(tomorrow);
    for (let h = DELIVERY_HOUR_START; h <= DELIVERY_HOUR_END; h++) {
      slots.push({ value: `${dateKey} ${h}`, label: `מחר ${hourLabel(h)}` });
    }
    return slots;
  }

  const today = formatDateKey(now);
  const start = Math.max(DELIVERY_HOUR_START, earliest);
  for (let h = start; h <= DELIVERY_HOUR_END; h++) {
    slots.push({ value: `${today} ${h}`, label: hourLabel(h) });
  }
  return slots;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, count, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expressAvailable, setExpressAvailable] = useState(false);
  const [deliverySlotCounts, setDeliverySlotCounts] = useState({});
  const [deliverySlots] = useState(() => getAvailableDeliverySlots());
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_city: '',
    payment_method: 'cash',
    express_delivery: false,
    delivery_time_slot: '',
  });

  const MAX_ORDERS_PER_SLOT = 5;

  useEffect(() => {
    fetch(`${API}/checkout/express-available`)
      .then((r) => r.json())
      .then((data) => setExpressAvailable(data.available === true))
      .catch(() => setExpressAvailable(false));
  }, []);

  useEffect(() => {
    fetch(`${API}/checkout/delivery-slot-counts`)
      .then((r) => r.json())
      .then((data) => setDeliverySlotCounts(data || {}))
      .catch(() => setDeliverySlotCounts({}));
  }, []);

  useEffect(() => {
    if (!form.delivery_time_slot) return;
    const count = deliverySlotCounts[form.delivery_time_slot] || 0;
    if (count >= MAX_ORDERS_PER_SLOT) {
      setForm((f) => ({ ...f, delivery_time_slot: '' }));
    }
  }, [deliverySlotCounts, form.delivery_time_slot]);

  const availableSlots = deliverySlots.filter(
    (slot) => (deliverySlotCounts[slot.value] || 0) < MAX_ORDERS_PER_SLOT
  );

  if (count === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h1>אין מוצרים בסל</h1>
          <Link to="/">חזרה לדף הבית</Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'delivery_time_slot' && value) next.express_delivery = false;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const orderPayload = {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        delivery_address: form.delivery_address.trim(),
        delivery_city: form.delivery_city.trim(),
        payment_method: form.payment_method,
        express_delivery: form.delivery_time_slot ? false : form.express_delivery,
        delivery_time_slot: form.delivery_time_slot || null,
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name_he: i.name_he,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      };
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      clearCart();
      navigate(`/order-confirmation/${data.orderId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'שגיאה בשליחת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to="/cart" className="checkout-back">← חזרה לסל</Link>
        <h1 className="checkout-title">תשלום ומשלוח</h1>
        <p className="checkout-subtitle">מלאו את פרטיכם ואת כתובת המשלוח</p>
      </header>

      <form onSubmit={handleSubmit} className="checkout-form">
        <section className="checkout-section">
          <h2 className="checkout-section-title">פרטי משלוח</h2>
          <div className="checkout-fields">
            <label className="checkout-label">
              <span>שם מלא</span>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                required
                placeholder="שם מלא"
                className="checkout-input"
              />
            </label>
            <label className="checkout-label">
              <span>טלפון</span>
              <input
                type="tel"
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
                required
                placeholder="050-0000000"
                className="checkout-input"
              />
            </label>
            <label className="checkout-label">
              <span>כתובת משלוח</span>
              <input
                type="text"
                name="delivery_address"
                value={form.delivery_address}
                onChange={handleChange}
                required
                placeholder="רחוב, מספר בית"
                className="checkout-input"
              />
            </label>
            {expressAvailable && !form.delivery_time_slot && (
              <label className="checkout-label checkout-express-wrap">
                <input
                  type="checkbox"
                  name="express_delivery"
                  checked={form.express_delivery}
                  onChange={(e) => setForm((f) => ({ ...f, express_delivery: e.target.checked }))}
                  className="checkout-express-checkbox"
                />
                <span>משלוח אקספרס</span>
              </label>
            )}
            <label className="checkout-label">
              <span>עיר</span>
              <input
                type="text"
                name="delivery_city"
                value={form.delivery_city}
                onChange={handleChange}
                required
                placeholder="עיר"
                className="checkout-input"
              />
            </label>
            <label className="checkout-label">
              <span>שעת משלוח</span>
              <p className="checkout-hint">בחרו שעה עגולה מהשעה הבאה עד 20:00. אחרי 20:00 או לפני 08:00 — זמין מחר 08:00–20:00. בחירת שעה מבטלת משלוח אקספרס.</p>
              <select
                name="delivery_time_slot"
                value={availableSlots.some((s) => s.value === form.delivery_time_slot) ? form.delivery_time_slot : ''}
                onChange={handleChange}
                required={availableSlots.length > 0}
                className="checkout-input checkout-select"
              >
                <option value="">בחרו שעת משלוח</option>
                {availableSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
              {availableSlots.length === 0 && (
                <p className="checkout-slot-empty">אין שעות משלוח זמינות כרגע. נסו מחר או שעה אחרת.</p>
              )}
            </label>
          </div>
        </section>

        <section className="checkout-section">
          <h2 className="checkout-section-title">אמצעי תשלום</h2>
          <div className="checkout-payment">
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt.id} className="checkout-payment-option">
                <input
                  type="radio"
                  name="payment_method"
                  value={opt.id}
                  checked={form.payment_method === opt.id}
                  onChange={handleChange}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {error && <p className="checkout-error">{error}</p>}

        <div className="checkout-summary">
          <div className="checkout-total">
            <span>סה״כ לתשלום</span>
            <strong>₪{total.toFixed(2)}</strong>
          </div>
          <button type="submit" className="checkout-submit" disabled={loading}>
            {loading ? 'שולח...' : 'אישור ההזמנה'}
          </button>
        </div>
      </form>
    </div>
  );
}
