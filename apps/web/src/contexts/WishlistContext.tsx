'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  count: number;
  refresh: () => void;
}

const WishlistContext = createContext<WishlistContextValue>({ count: 0, refresh: () => {} });

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }
    try {
      const res = await fetch('/api/v1/wishlist', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      const items = json?.data ?? json;
      setCount(Array.isArray(items) ? items.length : 0);
    } catch {}
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <WishlistContext.Provider value={{ count, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
