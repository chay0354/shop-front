import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../CartContext';
import './CartBar.css';

export default function CartBar() {
  const { count } = useCart();
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="cart-bar">
      <Link to="/" className="cart-bar-logo">קריות-מרקט</Link>
      <nav className="cart-bar-nav">
        <Link to="/cart" className="cart-bar-cart">
          <span className="cart-bar-icon">🛒</span>
          <span className="cart-bar-label">סל</span>
          {count > 0 && <span className="cart-bar-count">{count}</span>}
        </Link>
      </nav>
    </header>
  );
}
