'use client';
import { useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import ProductLoader from '@/components/ui/ProductLoader';
import PasswordHint from '@/components/ui/PasswordHint';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = searchParams.get('channel') || '';
  const maskedContact = searchParams.get('contact') || '';
  const identifier = searchParams.get('id') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join('');
  const passwordMismatch = confirm.length > 0 && confirm !== password;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) { toast.error('Please enter the full 6-digit code'); return; }
    if (password.length < 8)   { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm)  { toast.error('Passwords do not match'); return; }

    if (!identifier) {
      toast.error('Session expired. Please request a new reset code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue, identifier, newPassword: password }),
      });
      const data = await res.json();
      if (res.status === 429) throw new Error('Too many attempts. Please wait a few minutes before trying again.');
      if (!res.ok) throw new Error(data.message || data.error || 'Reset failed');
      toast.success('Password reset successfully! Please sign in.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message || 'Code may have expired. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'email' ? 'email' : '';

  return (
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        <div className="mb-7">
          <div className="flex items-center gap-4 mb-1.5">
            <div className="w-14 h-14 relative flex-shrink-0">
              <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>
          </div>
          {!identifier ? (
            <div className="mt-3 flex items-start gap-2 p-3 bg-secondary-50 border border-secondary-200 rounded-xl">
              <svg className="w-4 h-4 text-secondary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-secondary-700">
                Session not found. <Link href="/auth/forgot-password" className="font-semibold underline">Request a new reset code</Link> first.
              </p>
            </div>
          ) : maskedContact && channelLabel ? (
            <div className="mt-3 flex items-start gap-2 p-3 bg-primary-50 border border-primary-100 rounded-xl">
              <svg className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-primary-700">
                Reset code sent to <span className="font-semibold">{maskedContact}</span> via {channelLabel}
              </p>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm mt-1">Enter the 6-digit code and choose a new password</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">6-Digit Reset Code</label>
            <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                    ${digit ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-900'}
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-100`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">New Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters, upper + lower + number"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="input-field"
            />
            <PasswordHint password={password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className={`input-field ${passwordMismatch ? 'input-error' : ''}`}
            />
            {passwordMismatch && (
              <p className="mt-1 text-xs text-error-600">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpValue.length !== 6 || passwordMismatch}
            className="w-full btn-primary disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Resetting…
              </span>
            ) : 'Reset Password'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/auth/forgot-password" className="text-neutral-400 hover:text-neutral-600 transition-colors">
            Didn't receive a code?
          </Link>
          <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <ProductLoader size="md" />
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
