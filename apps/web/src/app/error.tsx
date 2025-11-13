'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center px-4 max-w-md">
        <h1 className="text-9xl font-bold text-error-600 mb-4">500</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">Something went wrong!</h2>
        <p className="text-lg text-gray-600 mb-8">
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="btn-secondary"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

