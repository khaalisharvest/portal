'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';
import ProductLoader from '@/components/ui/ProductLoader';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push(user.role === 'super_admin' || user.role === 'staff' ? '/admin/dashboard' : '/orders');
      }
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPhoneError('');

    // Validate phone number
    const phoneValidation = validatePakistaniPhone(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      return;
    }

    // Use normalized phone number for login
    const result = await login(phoneValidation.normalizedNumber, formData.password);
    
    if (!result.success) {
      // Check if it's an account deactivation error
      if (result.error?.includes('deactivated')) {
        setError(result.error);
      } else {
        setError(result.error || 'Login failed');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear phone error when user starts typing
    if (name === 'phone' && phoneError) {
      setPhoneError('');
    }
  };

  // Show loader while navigating away after successful login
  if (user) {
    return (
      <div className="min-h-screen organic-gradient flex items-center justify-center">
        <ProductLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex">

      {/* ── Left brand panel — desktop only ── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center px-12 relative overflow-hidden shadow-[8px_0_32px_rgba(0,0,0,0.25)]"
        style={{ background: 'linear-gradient(145deg, #1a3d10 0%, #2f6022 50%, #3d7a2e 100%)' }}
      >
        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[26rem] h-[26rem] rounded-full border border-white/[0.08]" />
          <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full border border-white/[0.08]" />
        </div>

        {/* Centred content block — no logo here, logo lives on the right */}
        <div className="relative z-10 w-full text-center">

          {/* Headline */}
          <h2 className="text-[2.1rem] font-bold text-white leading-[1.18] tracking-tight mb-3">
            Pure organic,<br />delivered to your door.
          </h2>

          {/* Description */}
          <p className="text-primary-300 text-sm leading-relaxed mx-auto max-w-xs mb-8">
            Pakistan's premier marketplace for fresh, unadulterated organic produce sourced directly from trusted farms.
          </p>

          {/* 2×2 Feature grid — bigger icons */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { title: '100% Pure Produce',  sub: 'No additives or preservatives', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { title: 'Farm Sourced',        sub: 'Directly from local farmers',   d: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
              { title: 'Fast Delivery',       sub: 'Across Pakistan, reliably',     d: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { title: 'Secure Checkout',     sub: 'Trusted by thousands',          d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            ].map(({ title, sub, d }) => (
              <div key={title} className="bg-white/[0.07] border border-white/[0.10] rounded-xl p-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                  </svg>
                </div>
                <p className="text-white text-sm font-semibold leading-snug">{title}</p>
                <p className="text-primary-400 text-xs mt-0.5 leading-snug">{sub}</p>
              </div>
            ))}
          </div>

          <p className="text-primary-500 text-[10px] tracking-widest uppercase mt-7">The Pure Embrace of Nature</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      {/* Mobile: gradient bg + floating card. Desktop: clean white panel filling the right half */}
      <div className="flex-1 bg-neutral-50 lg:bg-white flex flex-col">

        {/* Mobile: centered card layout */}
        <div className="flex-1 flex flex-col lg:hidden organic-gradient items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card-elevated w-full max-w-md"
          >
            <div className="text-center mb-6">
              <div className="mx-auto h-20 w-20 relative mb-3">
                <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" priority />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Welcome Back</h2>
              <p className="text-neutral-500 text-sm">Sign in to your Khaalis Harvest account</p>
            </div>
            <LoginForm
              formData={formData}
              phoneError={phoneError}
              error={error}
              showPassword={showPassword}
              isLoading={isLoading}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onTogglePassword={() => setShowPassword(v => !v)}
            />
          </motion.div>
        </div>

        {/* Desktop: truly centred form, back-link pinned absolute */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-12 relative">
          <Link href="/" className="absolute top-7 right-10 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-1.5">
                <div className="w-16 h-16 relative flex-shrink-0">
                  <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" />
                </div>
                <h2 className="text-3xl font-bold text-neutral-900">Welcome Back</h2>
              </div>
              <p className="text-neutral-500 text-sm">Sign in to your Khaalis Harvest account</p>
            </div>
            <LoginForm
              formData={formData}
              phoneError={phoneError}
              error={error}
              showPassword={showPassword}
              isLoading={isLoading}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onTogglePassword={() => setShowPassword(v => !v)}
            />
            <p className="mt-5 text-center text-sm text-neutral-400">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                Create one here
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Shared form markup ────────────────────────────────────────────────────────
function LoginForm({
  formData, phoneError, error, showPassword, isLoading,
  onChange, onSubmit, onTogglePassword,
}: {
  formData: { phone: string; password: string };
  phoneError: string; error: string; showPassword: boolean; isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTogglePassword: () => void;
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1.5">
          Phone Number
        </label>
        <input
          id="phone" name="phone" type="tel" required
          className={`input-field ${phoneError ? 'input-error' : ''}`}
          placeholder={getPhonePlaceholder()}
          value={formData.phone}
          onChange={onChange}
        />
        {phoneError && <p className="mt-1 text-xs text-error-600">{phoneError}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <Link href="/auth/forgot-password" className="text-xs text-primary-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password" name="password" type={showPassword ? 'text' : 'password'} required
            className="input-field pr-12"
            placeholder="Enter your password"
            value={formData.password}
            onChange={onChange}
          />
          <button type="button" onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors">
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm p-3 rounded-xl bg-error-50 text-error-700 border border-error-200"
        >
          {error}
        </motion.div>
      )}

      <motion.button
        type="submit" disabled={isLoading}
        whileTap={{ scale: 0.98 }}
        className="btn-primary w-full mt-1"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Signing in…
          </span>
        ) : 'Sign In'}
      </motion.button>

      {/* Mobile-only bottom links (desktop shows them outside the form) */}
      <div className="lg:hidden space-y-3 pt-1 text-center text-sm">
        <p className="text-neutral-500">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Create one here
          </Link>
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </form>
  );
}