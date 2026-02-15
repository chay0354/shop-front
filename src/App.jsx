import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreContext } from './StoreContext';
import { CartProvider } from './CartContext';
import CartBar from './components/CartBar';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SubcategoryPage from './pages/SubcategoryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminPage from './pages/AdminPage';
import AdminAddProductPage from './pages/AdminAddProductPage';
import AdminProductsPage from './pages/AdminProductsPage';
import './index.css';
import './App.css';

const API = import.meta.env.VITE_API_URL ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api` : '/api';

export default function App() {
  const [store, setStore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/store`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(setStore)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <StoreContext.Provider value={store}>
      <CartProvider>
        <BrowserRouter>
          <div className="app-layout">
            <CartBar />
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/subcategory/:subcategoryId" element={<SubcategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/products/new" element={<AdminAddProductPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </StoreContext.Provider>
  );
}

function Loading() {
  return (
    <div className="loading">
      <div className="loader" />
      <p>טוען קטגוריות...</p>
    </div>
  );
}

function Error({ message }) {
  return (
    <div className="error">
      <p>שגיאה: {message}</p>
      <p>ודא שהשרת רץ ב־http://localhost:4000</p>
    </div>
  );
}
