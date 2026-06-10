'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 relative mb-6">
            <Image
              src="/images/logo.png"
              alt="Khaalis Harvest Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
            </svg>
          </div>
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
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 relative mb-4">
            <Image
              src="/images/logo.png"
              alt="Khaalis Harvest Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800">Forgot Password</h1>
          <p className="text-neutral-600 mt-2">Enter your phone number or email to get a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Phone (03001234567) or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="input-field"
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
