import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product_id, name_he, price } = action.payload;
      const existing = state.find((i) => i.product_id === product_id);
      if (existing) {
        return state.map((i) =>
          i.product_id === product_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...state, { product_id, name_he, price: Number(price), quantity: 1 }];
    }
    case 'remove':
      return state.filter((i) => i.product_id !== action.payload.product_id);
    case 'setQuantity': {
      const { product_id, quantity } = action.payload;
      if (quantity <= 0) return state.filter((i) => i.product_id !== product_id);
      return state.map((i) =>
        i.product_id === product_id ? { ...i, quantity } : i
      );
    }
    case 'clear':
      return [];
    default:
      return state;
  }
}

const CART_STORAGE_KEY = 'krayot-market-cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, loadCart());

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const value = useMemo(() => {
    const addItem = (product) => {
      dispatch({
        type: 'add',
        payload: {
          product_id: product.id,
          name_he: product.name_he,
          price: product.price,
        },
      });
    };
    const removeItem = (productId) => dispatch({ type: 'remove', payload: { product_id: productId } });
    const setQuantity = (productId, quantity) =>
      dispatch({ type: 'setQuantity', payload: { product_id: productId, quantity } });
    const clearCart = () => dispatch({ type: 'clear' });

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const FREE_SHIPPING_MIN = 279;
    const DELIVERY_FEE = 15;
    const isTestPaymentOnly = items.length > 0 && items.every((i) => i.product_id == null);
    const deliveryFee = isTestPaymentOnly ? 0 : (subtotal > 0 && subtotal < FREE_SHIPPING_MIN ? DELIVERY_FEE : 0);
    const total = subtotal + deliveryFee;
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      subtotal,
      deliveryFee,
      total,
      count,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
