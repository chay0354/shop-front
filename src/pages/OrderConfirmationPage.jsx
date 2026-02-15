import { Link, useParams } from 'react-router-dom';
import './OrderConfirmationPage.css';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <h1 className="confirmation-title">ההזמנה התקבלה!</h1>
        <p className="confirmation-text">
          תודה שקניתם אצלנו. ההזמנה נשלחה ותטופל בהקדם.
        </p>
        {orderId && (
          <p className="confirmation-id">מזהה הזמנה: {orderId}</p>
        )}
        <p className="confirmation-delivery">
          נציג יצור איתכם קשר להשלמת המשלוח והתשלום.
        </p>
        <Link to="/" className="confirmation-btn">חזרה לחנות</Link>
      </div>
    </div>
  );
}
