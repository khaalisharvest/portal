'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';

export default function LoginPage() {
  const router = useRouter();
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
              Welcome Back
            </h2>
            <p className="text-neutral-600">
              Sign in to your Khaalis Harvest account
            </p>
          </div>
          
          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm text-center p-4 rounded-xl ${
                  error.includes('deactivated') 
                    ? 'bg-error-50 text-error-700 border border-error-200' 
                    : 'bg-error-50 text-error-600 border border-error-200'
                }`}
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
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>

            <div className="text-center">
              <p className="text-neutral-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Create one here
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