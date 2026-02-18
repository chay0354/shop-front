import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';
import './CartPage.css';

export default function CartPage() {
  const { items, setQuantity, removeItem, total, deliveryFee, count } = useCart();

  if (count === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <h1 className="cart-empty-title">הסל ריק</h1>
          <p className="cart-empty-text">הוסיפו מוצרים מהקטגוריות כדי להמשיך להזמנה.</p>
          <Link to="/" className="cart-empty-btn">התחילו לקנות</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <h1 className="cart-title">סל הקניות</h1>
        <p className="cart-subtitle">{count} מוצרים בסל</p>
      </header>

      <main className="cart-main">
        <ul className="cart-list">
          {items.map((item) => (
            <li key={item.product_id} className="cart-item">
              <div className="cart-item-info">
                <span className="cart-item-name">{item.name_he}</span>
                <span className="cart-item-price">₪{Number(item.price).toFixed(2)} ליחידה</span>
              </div>
              <div className="cart-item-actions">
                <div className="cart-item-qty">
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                    aria-label="הפחת"
                  >
                    −
                  </button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                    aria-label="הוסף"
                  >
                    +
                  </button>
                </div>
                <span className="cart-item-line">₪{(item.price * item.quantity).toFixed(2)}</span>
                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => removeItem(item.product_id)}
                  aria-label="הסר"
                >
                  הסר
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="cart-summary">
          {deliveryFee > 0 && (
            <div className="cart-total-row cart-delivery-row">
              <span>דמי משלוח (מתחת ל־₪279)</span>
              <span>₪{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="cart-total-row">
            <span>סה״כ לתשלום</span>
            <strong>₪{total.toFixed(2)}</strong>
          </div>
          <Link to="/checkout" className="cart-checkout-btn">המשך לתשלום ומשלוח</Link>
        </div>
      </main>
    </div>
  );
}
