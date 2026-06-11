'use client';

import Link from 'next/link';

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Account page error</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Something went wrong loading your account. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Retry
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
