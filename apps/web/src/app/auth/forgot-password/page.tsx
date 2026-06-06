'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      if (res.status >= 500) {
        toast.error('Server error. Please try again later.');
        return;
      }
      // Show success for any non-500 response (including 404 — for security we don't reveal if user exists)
      setSubmitted(true);
    } catch {
      toast.error('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-medium p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Check your messages</h2>
          <p className="text-neutral-600 mb-6">
            If an account exists, a reset link has been sent. Check the backend console if SMTP is not configured.
          </p>
          <Link href="/auth/login" className="btn-primary">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-medium p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">🔑 Forgot Password</h1>
          <p className="text-neutral-600 mt-2">Enter your phone number or email to get a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Phone (03001234567) or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-neutral-600">
          Remembered it?{' '}
          <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
