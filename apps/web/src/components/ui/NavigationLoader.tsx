'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import ProductLoader from './ProductLoader';

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // When pathname/searchParams change, navigation is complete — hide loader
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, [pathname, searchParams]);

  // Intercept pushState (what Next.js calls on every client-side navigation)
  useEffect(() => {
    const original = window.history.pushState.bind(window.history);

    window.history.pushState = function (...args) {
      // Only show loader if navigation takes longer than 150ms
      // Fast (prefetched) navigations complete before the timer fires → no flash
      timerRef.current = setTimeout(() => setVisible(true), 150);
      return original(...args);
    };

    return () => {
      window.history.pushState = original;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/85 backdrop-blur-sm flex items-center justify-center">
      <ProductLoader size="lg" />
    </div>
  );
}

// Suspense required because useSearchParams() suspends without it
export default function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
