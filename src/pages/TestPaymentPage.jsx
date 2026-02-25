import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';

/** Adds a single 5 ILS test item to the cart and redirects to checkout. */
export default function TestPaymentPage() {
  const navigate = useNavigate();
  const { clearCart, addItem } = useCart();

  useEffect(() => {
    clearCart();
    addItem({
      id: null,
      name_he: 'בדיקת תשלום ₪5',
      price: 5,
    });
    navigate('/checkout', { replace: true });
    // Run once on mount only; cart helpers change when state updates and would cause a loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="test-payment-redirect" style={{ padding: '2rem', textAlign: 'center' }}>
      מעביר לתשלום בדיקה...
    </div>
  );
}
