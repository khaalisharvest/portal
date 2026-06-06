'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Minimum 8 characters'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      toast.success('Password reset! Please log in.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message || 'Link may have expired. Request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Invalid or missing reset link.</p>
        <Link href="/auth/forgot-password" className="btn-primary">Request New Link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="password" placeholder="New password (min 8 characters)" value={password}
        onChange={(e) => setPassword(e.target.value)} required
        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <input type="password" placeholder="Confirm new password" value={confirm}
        onChange={(e) => setConfirm(e.target.value)} required
        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-medium p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">🔒 Reset Password</h1>
          <p className="text-neutral-600 mt-2">Choose a new password for your account</p>
        </div>
        <Suspense fallback={<div className="text-center text-neutral-500">Loading...</div>}>
          <ResetForm />
        </Suspense>
        <p className="text-center mt-4 text-sm">
          <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
