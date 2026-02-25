import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StoreContext } from './StoreContext';
import { CartProvider } from './CartContext';
import CartBar from './components/CartBar';

const WHATSAPP_URL = 'https://wa.me/972523407171';

function FloatingWhatsApp() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="floating-whatsapp" aria-label="צור קשר בוואטסאפ">
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
  );
}
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SubcategoryPage from './pages/SubcategoryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import TestPaymentPage from './pages/TestPaymentPage';
import AdminGuard from './components/AdminGuard';
import TermsGate from './components/TermsGate';
import MainLayout from './components/MainLayout';
import AccessibilityMenu from './components/AccessibilityMenu';
import AdminPage from './pages/AdminPage';
import AdminAddProductPage from './pages/AdminAddProductPage';
import AdminProductsPage from './pages/AdminProductsPage';
import TermsPage from './pages/TermsPage';
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
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <div className="app-layout">
            <TermsGate>
              <CartBar />
              <FloatingWhatsApp />
              <AccessibilityMenu />
              <Routes>
              <Route path="/admin" element={<AdminGuard />}>
                <Route index element={<AdminPage />} />
                <Route path="products/new" element={<AdminAddProductPage />} />
                <Route path="products" element={<AdminProductsPage />} />
              </Route>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:categoryId" element={<CategoryPage />} />
                <Route path="/subcategory/:subcategoryId" element={<SubcategoryPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/test-payment" element={<TestPaymentPage />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                <Route path="/terms" element={<TermsPage />} />
              </Route>
              </Routes>
            </TermsGate>
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
