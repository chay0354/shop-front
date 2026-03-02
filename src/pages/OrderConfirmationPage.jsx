import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import './OrderConfirmationPage.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const isUuid = orderId && UUID_REGEX.test(String(orderId));
  const fromState = state?.orderNumber ?? (!isUuid ? orderId : null);
  const [displayNumber, setDisplayNumber] = useState(fromState ?? '');
  const [resolvingUuid, setResolvingUuid] = useState(!!(isUuid && !fromState));

  useEffect(() => {
    if (fromState && !isUuid) {
      setDisplayNumber(fromState);
      setResolvingUuid(false);
      return;
    }
    if (!orderId || !isUuid) return;
    if (fromState) {
      setDisplayNumber(fromState);
      setResolvingUuid(false);
      return;
    }
    setResolvingUuid(true);
    fetch(`${API}/orders/public/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.orderNumber != null) {
          setDisplayNumber(data.orderNumber);
        }
      })
      .catch(() => {})
      .finally(() => setResolvingUuid(false));
  }, [orderId, isUuid, fromState]);

  const showId = displayNumber || resolvingUuid;
  const idLabel = resolvingUuid ? 'מזהה הזמנה: טוען...' : (displayNumber ? `מזהה הזמנה: ${displayNumber}` : null);

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <h1 className="confirmation-title">ההזמנה התקבלה!</h1>
        <p className="confirmation-text">
          תודה שקניתם אצלנו. ההזמנה נשלחה ותטופל בהקדם.
        </p>
        {showId && (
          <p className="confirmation-id">{idLabel}</p>
        )}
        <p className="confirmation-delivery">
          נציג יצור איתכם קשר להשלמת המשלוח והתשלום.
        </p>
        <Link to="/" className="confirmation-btn">חזרה לחנות</Link>
      </div>
    </div>
  );
}
