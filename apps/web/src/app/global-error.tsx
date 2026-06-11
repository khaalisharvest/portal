'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 16px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>An unexpected error occurred. Please try again.</p>
            <button
              onClick={reset}
              style={{ padding: '12px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
