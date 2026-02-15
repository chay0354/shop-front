import { createContext, useContext } from 'react';

export const StoreContext = createContext(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) return { categories: [], getCategory: () => null, getSubcategory: () => null };
  const getCategory = (id) => store.find((c) => c.id === id) ?? null;
  const getSubcategory = (id) => {
    for (const cat of store) {
      const sub = cat.subcategories?.find((s) => s.id === id);
      if (sub) return { category: cat, subcategory: sub };
    }
    return null;
  };
  return { categories: store, getCategory, getSubcategory };
}
