'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';
import ProductLoader from '@/components/ui/ProductLoader';
import PasswordHint from '@/components/ui/PasswordHint';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as const, // Only customers can register
  });
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const { register, isLoading, user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await register({
      name: formData.name,
      phone: phoneValidation.normalizedNumber, // Use normalized phone number
      email: formData.email || undefined,
      password: formData.password,
      role: formData.role,
    });
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Show loader while navigating away after successful signup
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[26rem] h-[26rem] rounded-full border border-white/[0.08]" />
          <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full border border-white/[0.08]" />
        </div>

        <div className="relative z-10 w-full text-center">

          <h2 className="text-[2.1rem] font-bold text-white leading-[1.18] tracking-tight mb-3">
            Join thousands choosing<br />pure organic living.
          </h2>

          <p className="text-primary-300 text-sm leading-relaxed mx-auto max-w-xs mb-8">
            Create your account and get access to Pakistan's finest organic produce, delivered fresh from farm to your table.
          </p>

          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { title: 'Free Account',   sub: 'No hidden charges ever',   d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { title: 'Order Tracking', sub: 'All orders in one place',   d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { title: 'Wishlist',       sub: 'Save your favourites',      d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { title: 'Data Security',  sub: 'Your privacy, guaranteed',  d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
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
      <div className="flex-1 bg-neutral-50 lg:bg-white flex flex-col">

        {/* Mobile: floating card on gradient */}
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
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Join Khaalis Harvest</h2>
              <p className="text-neutral-500 text-sm">Create your account and start your organic journey</p>
            </div>
            <SignupFormFields
              formData={formData} phoneError={phoneError} error={error} isLoading={isLoading}
              onChange={handleChange} onSubmit={handleSubmit} showMobileLinks
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
            <div className="mb-5">
              <div className="flex items-center gap-4 mb-1">
                <div className="w-16 h-16 relative flex-shrink-0">
                  <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900">Join Khaalis Harvest</h2>
              </div>
              <p className="text-neutral-500 text-sm">Create your account and start your organic journey</p>
            </div>
            <SignupFormFields
              formData={formData} phoneError={phoneError} error={error} isLoading={isLoading}
              onChange={handleChange} onSubmit={handleSubmit} showMobileLinks={false}
            />
            <p className="mt-5 text-center text-sm text-neutral-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SignupFormFields({
  formData, phoneError, error, isLoading, onChange, onSubmit, showMobileLinks,
}: {
  formData: { name: string; phone: string; email: string; password: string; confirmPassword: string };
  phoneError: string; error: string; isLoading: boolean; showMobileLinks: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
        <input id="name" name="name" type="text" required className="input-field"
          placeholder="Enter your full name" value={formData.name} onChange={onChange} />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
        <input id="phone" name="phone" type="tel" required
          className={`input-field ${phoneError ? 'input-error' : ''}`}
          placeholder={getPhonePlaceholder()} value={formData.phone} onChange={onChange} />
        {phoneError && <p className="mt-0.5 text-xs text-error-600">{phoneError}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
          Email <span className="text-neutral-400 font-normal">(Optional)</span>
        </label>
        <input id="email" name="email" type="email" className="input-field"
          placeholder="your@email.com" value={formData.email} onChange={onChange} />
      </div>

      {/* Password + Confirm side by side to save vertical space */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
          <input id="password" name="password" type="password" required className="input-field"
            placeholder="Min. 8 chars" value={formData.password} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">Confirm</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required className="input-field"
            placeholder="Repeat password" value={formData.confirmPassword} onChange={onChange} />
        </div>
      </div>
      <PasswordHint password={formData.password} />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm p-3 rounded-xl bg-error-50 text-error-700 border border-error-200"
        >
          {error}
        </motion.div>
      )}

      <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }}
        className="btn-primary w-full !mt-4">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Creating account…
          </span>
        ) : 'Create Account'}
      </motion.button>

      {showMobileLinks && (
        <div className="space-y-3 pt-1 text-center text-sm">
          <p className="text-neutral-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
              Sign in here
            </Link>
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      )}
    </form>
  );
}