import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import './CheckoutPage.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';
const CARDCOM_ORIGIN = 'https://secure.cardcom.solutions';
const CARDCOM_SCRIPT_URL = `${CARDCOM_ORIGIN}/External/OpenFields/3DS.js`;
const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'מזומן במשלוח' },
  { id: 'card', label: 'כרטיס אשראי' },
];

const CHECKOUT_CACHE_KEY = 'shop_checkout_data';
const CHECKOUT_CACHE_TTL_MS = 30000;

function getCheckoutCache() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.at > CHECKOUT_CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function setCheckoutCache(expressAvailable, deliverySlotCounts) {
  try {
    sessionStorage.setItem(CHECKOUT_CACHE_KEY, JSON.stringify({
      at: Date.now(),
      expressAvailable,
      deliverySlotCounts: deliverySlotCounts || {},
    }));
  } catch (_) {}
}

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
  const { items, total, deliveryFee, count, clearCart } = useCart();
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
  const [step, setStep] = useState('delivery');
  const [initPaymentPending, setInitPaymentPending] = useState(false);
  const [lowProfileId, setLowProfileId] = useState(null);
  const [terminalNumber, setTerminalNumber] = useState(null);
  const [cardForm, setCardForm] = useState({
    cardOwnerName: '',
    cardOwnerEmail: '',
    expirationMonth: '12',
    expirationYear: String(new Date().getFullYear() % 100 + 1),
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [masterFrameLoaded, setMasterFrameLoaded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const masterFrameRef = useRef(null);
  const orderPayloadRef = useRef(null);

  const MAX_ORDERS_PER_SLOT = 5;

  useEffect(() => {
    const cached = getCheckoutCache();
    if (cached) {
      setExpressAvailable(cached.expressAvailable === true);
      setDeliverySlotCounts(cached.deliverySlotCounts || {});
      return;
    }
    Promise.all([
      fetch(`${API}/checkout/express-available`).then((r) => r.json()).then((data) => {
        const v = data.available === true;
        setExpressAvailable(v);
        return v;
      }).catch(() => { setExpressAvailable(false); return false; }),
      fetch(`${API}/checkout/delivery-slot-counts`).then((r) => r.json()).then((data) => {
        const v = data || {};
        setDeliverySlotCounts(v);
        return v;
      }).catch(() => { setDeliverySlotCounts({}); return {}; }),
    ]).then(([expressAvailable, deliverySlotCounts]) => {
      setCheckoutCache(expressAvailable, deliverySlotCounts);
    });
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

  useEffect(() => {
    if (step !== 'card' || !initPaymentPending || lowProfileId) return;
    setError(null);
    const payload = orderPayloadRef.current;
    if (!payload?.items?.length) {
      setCardError('חסרים פרטי הזמנה');
      setInitPaymentPending(false);
      return;
    }
    const totalAmount = payload.items.reduce((s, i) => s + i.quantity * i.unit_price, 0) + (deliveryFee || 0);
    fetch(`${API}/checkout/init-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalAmount,
        productName: 'הזמנה',
        items: payload.items,
        customer_name: payload.customer_name,
        deliveryFee: deliveryFee || 0,
        redirectBaseUrl: window.location.origin,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().catch(() => ({ error: `שגיאה ${r.status}` })).then((d) => ({ ...d, _status: r.status }));
        return r.json().catch(() => ({}));
      })
      .then((data) => {
        if (data.LowProfileId) {
          setLowProfileId(data.LowProfileId);
          setTerminalNumber(data.terminalNumber || 1000);
          setCardError(null);
        } else {
          const msg = data.error || data.details || (data._status === 502 ? 'לא ניתן להתחבר לקארדקום. בדוק חיבור רשת.' : 'לא ניתן להתחיל תשלום');
          setCardError(msg);
        }
        setInitPaymentPending(false);
      })
      .catch((err) => {
        const msg = err.message || 'שגיאה בהתחלת תשלום';
        if (msg === 'fetch failed' || msg.includes('Failed to fetch')) {
          setCardError('אין חיבור לשרת. וודא שהשרת רץ ב־http://localhost:4000');
        } else {
          setCardError(msg);
        }
        setInitPaymentPending(false);
      });
  }, [step, initPaymentPending, lowProfileId, deliveryFee]);

  useEffect(() => {
    if (step !== 'card' || !lowProfileId) return;
    const scriptId = 'cardcom-3ds-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = CARDCOM_SCRIPT_URL;
    document.head.appendChild(script);
  }, [step, lowProfileId]);

  useEffect(() => {
    if (step !== 'card' || !lowProfileId || !masterFrameLoaded || !masterFrameRef.current?.contentWindow) return;
    const win = masterFrameRef.current.contentWindow;
    const sendInit = () => {
      if (!masterFrameRef.current?.contentWindow) return;
      masterFrameRef.current.contentWindow.postMessage({
        action: 'init',
        lowProfileCode: lowProfileId,
        language: 'he',
        placeholder: '****-****-****-****',
        cvvPlaceholder: '***',
      }, '*');
    };
    const t = setTimeout(sendInit, 100);
    return () => clearTimeout(t);
  }, [step, lowProfileId, masterFrameLoaded]);

  useEffect(() => {
    if (step !== 'card') return;
    const handler = (event) => {
      if (event.origin !== CARDCOM_ORIGIN) return;
      const msg = event.data;
      if (!msg || typeof msg.action !== 'string') return;
      switch (msg.action) {
        case 'HandleSubmit':
          setPaymentLoading(false);
          // Create order in DB only after CardCom confirms payment success (never before)
          if (msg.data?.IsSuccess && orderPayloadRef.current) {
            fetch(`${API}/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderPayloadRef.current),
            })
              .then((r) => r.json().catch(() => ({})))
              .then((data) => {
                if (data.orderId) {
                  clearCart();
                  navigate(`/order-confirmation/${data.orderId}`, { replace: true });
                } else {
                  setCardError(data.error || 'שגיאה בשמירת ההזמנה');
                }
              })
              .catch(() => setCardError('שגיאה ברשת'));
          } else {
            setCardError(msg.data?.Description || 'התשלום לא הצליח');
          }
          break;
        case 'HandleEror':
          setPaymentLoading(false);
          setCardError(msg.message || 'שגיאה בתשלום');
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [step, clearCart, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.payment_method === 'cash') {
      setLoading(true);
      try {
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
      return;
    }
    if (form.payment_method === 'card') {
      orderPayloadRef.current = orderPayload;
      setCardError(null);
      setLowProfileId(null);
      setMasterFrameLoaded(false);
      setStep('card');
      setInitPaymentPending(true);
    }
  };

  const handleCardPay = (e) => {
    e.preventDefault();
    setCardError(null);
    if (!masterFrameRef.current?.contentWindow || !lowProfileId) return;
    setPaymentLoading(true);
    const doc = {
      Name: form.customer_name,
      Products: items.map((i, idx) => ({
        ProductID: String(idx + 1),
        Description: (i.name_he || 'פריט').substring(0, 200),
        Quantity: i.quantity,
        UnitCost: i.price,
        TotalLineCost: i.quantity * i.price,
      })),
      IsAllowEditDocument: false,
      IsShowOnlyDocument: true,
      Language: 'he',
    };
    masterFrameRef.current.contentWindow.postMessage({
      action: 'doTransaction',
      cardOwnerId: '000000000',
      cardOwnerName: cardForm.cardOwnerName.trim() || form.customer_name,
      cardOwnerEmail: cardForm.cardOwnerEmail.trim() || '',
      cardOwnerPhone: form.customer_phone.trim(),
      expirationMonth: cardForm.expirationMonth,
      expirationYear: cardForm.expirationYear,
      numberOfPayments: '1',
      document: doc,
    }, '*');
  };

  const showDelivery = step === 'delivery';

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        {step === 'card' ? (
          <button type="button" className="checkout-back" onClick={() => { setStep('delivery'); setCardError(null); setMasterFrameLoaded(false); setInitPaymentPending(false); }}>
            ← חזרה לפרטים
          </button>
        ) : (
          <Link to="/cart" className="checkout-back">← חזרה לסל</Link>
        )}
        <h1 className="checkout-title">{step === 'card' ? 'תשלום בכרטיס אשראי' : 'תשלום ומשלוח'}</h1>
        <p className="checkout-subtitle">
          {step === 'card' ? `סה״כ לתשלום: ₪${total.toFixed(2)}` : 'מלאו את פרטיכם ואת כתובת המשלוח'}
        </p>
      </header>

      {step === 'card' && (
        <div className="checkout-card-step">
          {initPaymentPending && (
            <p className="checkout-loading-msg">טוען דף תשלום...</p>
          )}
          {lowProfileId && (
          <div className="checkout-card-form">
          <iframe
            ref={masterFrameRef}
            id="CardComMasterFrame"
            name="CardComMasterFrame"
            title="CardCom Master"
            src={`${CARDCOM_ORIGIN}/api/openfields/master`}
            className="checkout-iframe-master"
            onLoad={() => setMasterFrameLoaded(true)}
          />
          <iframe
            id="CardComCardNumber"
            name="CardComCardNumber"
            title="CardCom Card Number"
            src={`${CARDCOM_ORIGIN}/api/openfields/cardNumber`}
            className="checkout-iframe-card"
          />
          <div className="checkout-card-fields">
            <label className="checkout-label">
              <span>שם על הכרטיס</span>
              <input
                type="text"
                className="checkout-input"
                value={cardForm.cardOwnerName}
                onChange={(e) => setCardForm((c) => ({ ...c, cardOwnerName: e.target.value }))}
                placeholder="שם כפי שמופיע על הכרטיס"
              />
            </label>
            <label className="checkout-label">
              <span>אימייל (לקבלה)</span>
              <input
                type="email"
                className="checkout-input"
                value={cardForm.cardOwnerEmail}
                onChange={(e) => setCardForm((c) => ({ ...c, cardOwnerEmail: e.target.value }))}
                placeholder="email@example.com"
              />
            </label>
            <div className="checkout-exp-row">
              <label className="checkout-label">
                <span>חודש תוקף</span>
                <select
                  className="checkout-input checkout-select"
                  value={cardForm.expirationMonth}
                  onChange={(e) => setCardForm((c) => ({ ...c, expirationMonth: e.target.value }))}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, '0');
                    return <option key={m} value={m}>{m}</option>;
                  })}
                </select>
              </label>
              <label className="checkout-label">
                <span>שנת תוקף</span>
                <select
                  className="checkout-input checkout-select"
                  value={cardForm.expirationYear}
                  onChange={(e) => setCardForm((c) => ({ ...c, expirationYear: e.target.value }))}
                >
                  {Array.from({ length: 15 }, (_, i) => {
                    const y = String((new Date().getFullYear() % 100) + i);
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </label>
            </div>
            <label className="checkout-label">
              <span>CVV</span>
              <iframe
                id="CardComCvv"
                name="CardComCvv"
                title="CardCom CVV"
                src={`${CARDCOM_ORIGIN}/api/openfields/CVV`}
                className="checkout-iframe-cvv"
              />
            </label>
          </div>
          <details className="checkout-test-cards">
            <summary>כרטיסי בדיקה (לסביבת פיתוח)</summary>
            <p className="checkout-test-cards-text">
              במסוף בדיקה של קארדקום העסקה לא מחויבת באמת. לפרטי כרטיס בדיקה רשמיים פנו לתמיכת קארדקום.
              <br />
              לרוב במסופי בדיקה אפשר להשתמש ב: <strong>מספר כרטיס</strong> 4111 1111 1111 1111 (ויזה) או 5555 5555 5555 4444 (מאסטרקארד), <strong>תוקף</strong> כל תאריך עתידי, <strong>CVV</strong> כל 3 ספרות (למשל 123).
            </p>
          </details>
          {cardError && <p className="checkout-error">{cardError}</p>}
          <button type="button" className="checkout-submit" onClick={handleCardPay} disabled={paymentLoading}>
            {paymentLoading ? 'מעבד תשלום...' : `שלם ₪${total.toFixed(2)}`}
          </button>
          </div>
          )}
          {cardError && !lowProfileId && <p className="checkout-error">{cardError}</p>}
        </div>
      )}

      {showDelivery && (
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
                value={form.delivery_time_slot && availableSlots.some((s) => s.value === form.delivery_time_slot) ? form.delivery_time_slot : ''}
                onChange={handleChange}
                className="checkout-input checkout-select"
              >
                <option value="">מיידי</option>
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
          {deliveryFee > 0 && (
            <div className="checkout-delivery-row">
              <span>דמי משלוח (מתחת ל־₪279)</span>
              <span>₪{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="checkout-total">
            <span>סה״כ לתשלום</span>
            <strong>₪{total.toFixed(2)}</strong>
          </div>
          <label className="checkout-terms-label">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              aria-describedby="checkout-terms-desc"
            />
            <span id="checkout-terms-desc">
              אני מאשר/ת את{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="checkout-terms-link">התקנון</a>
            </span>
          </label>
          <button type="submit" className="checkout-submit" disabled={loading || !termsAccepted}>
            {loading ? 'שולח...' : 'אישור ההזמנה'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
