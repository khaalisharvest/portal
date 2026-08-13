'use client';

import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { store, persistor } from '@/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { WishlistProvider } from '@/contexts/WishlistContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Colours map directly to tailwind.config.js brand palette
const SONNER_VARS = {
  '--normal-bg':        '#ffffff',
  '--normal-border':    '#E8E6DC',  // neutral-200
  '--normal-text':      '#16150F',  // neutral-900
  '--success-bg':       '#f0f7ee',  // primary-50
  '--success-border':   '#b4d9ab',  // primary-200
  '--success-text':     '#16150F',
  '--error-bg':         '#fef2f2',  // error-50
  '--error-border':     '#fecaca',
  '--error-text':       '#16150F',
  '--info-bg':          '#eff6ff',  // info-50
  '--info-border':      '#bfdbfe',
  '--info-text':        '#16150F',
  '--warning-bg':       '#fffbeb',  // warning-50
  '--warning-border':   '#fde68a',
  '--warning-text':     '#16150F',
} as React.CSSProperties;

function ResponsiveToaster() {
  const [position, setPosition] = useState<'top-right' | 'bottom-center'>('top-right');

  useEffect(() => {
    const check = () => setPosition(window.innerWidth < 640 ? 'bottom-center' : 'top-right');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <Toaster
      position={position}
      expand={false}
      richColors={false}
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:        'rounded-xl shadow-lg border font-sans',
          title:        '!text-neutral-900 !font-semibold !text-sm',
          description:  '!text-neutral-500 !text-xs',
          actionButton: '!bg-transparent !text-primary-600 !font-semibold !text-xs hover:!text-primary-700 !p-0 !h-auto !shadow-none',
          closeButton:  '!bg-white !border-neutral-200 !text-neutral-400 hover:!text-neutral-700',
          icon:         'mt-0.5',
        },
        style: {
          fontFamily: 'var(--font-poppins), system-ui, sans-serif',
          fontSize:   '14px',
        },
      }}
      style={SONNER_VARS}
      offset={16}
      gap={8}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <FilterProvider>
                  {children}
                </FilterProvider>
              </WishlistProvider>
            </CartProvider>
            <ResponsiveToaster />
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </AuthProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
