'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';

export default function SignupPage() {
  const router = useRouter();
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
      router.push('/');
    }
  }, [user, router]);

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

  // Show loading if user is being redirected
  if (user) {
    return (
      <div className="min-h-screen organic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 relative mx-auto mb-4">
            <Image
              src="/images/logo.png"
              alt="Khaalis Harvest Logo"
              fill
              className="object-contain animate-pulse"
            />
          </div>
          <p className="text-neutral-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen organic-gradient flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-elevated"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-36 w-36 relative mb-4">
              <Image
                src="/images/logo.png"
                alt="Khaalis Harvest Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Join Khaalis Harvest
            </h2>
            <p className="text-neutral-600">
              Create your account and start your organic journey
            </p>
          </div>
          
          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className={`input-field ${
                    phoneError 
                      ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
                      : ''
                  }`}
                  placeholder={getPhonePlaceholder()}
                  value={formData.phone}
                  onChange={handleChange}
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-error-600">{phoneError}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email <span className="text-neutral-400">(Optional)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input-field"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error-50 text-error-600 text-sm text-center p-4 rounded-xl border border-error-200"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </motion.button>

            <div className="text-center">
              <p className="text-neutral-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/" className="text-neutral-500 hover:text-neutral-700 transition-colors flex items-center justify-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to home</span>
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}