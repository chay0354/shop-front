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

  const loadOrders = () => {
    return fetch(`${API}/admin/orders`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(setOrders);
  };

  useEffect(() => {
    loadOrders()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
        <Link to="/admin/products/new" className="admin-add-product-btn">+ הוסף מוצר</Link>
      </header>

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
