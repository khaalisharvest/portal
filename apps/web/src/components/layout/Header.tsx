'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useFilter } from '@/contexts/FilterContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import MobileCategoryDropdown from '@/components/ui/MobileCategoryDropdown';
import { useCategories, useProductTypes } from '@/hooks/useProducts';

export default function Header() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { state: cartState } = useCart();
  const { selectedCategory, selectedProductType, setSelectedCategory, setSelectedProductType, clearFilters } = useFilter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopUserMenuOpen, setIsDesktopUserMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get categories and product types using the hooks
  const { categories: categoriesResponse } = useCategories();
  const { productTypes } = useProductTypes();
  
  // Extract categories array from API response
  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse as any)?.data || [];
  

  // Handle outside click to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDesktopUserMenuOpen(false);
      }
    };

    if (isDesktopUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDesktopUserMenuOpen]);

  return (
    <>
    <header className="bg-white shadow-soft border-b-2 border-primary-100 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24">
          {/* Mobile Menu Button - Left Side */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              <svg className={`h-6 w-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Responsive Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 relative group-hover:scale-105 transition-all duration-300">
                <Image
                  src="/images/logo.png"
                  alt="Khaalis Harvest Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
                />
              </div>
              <div className="ml-0 sm:ml-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Khaalis Harvest
                </h1>
                <p className="text-xs sm:text-xs lg:text-xs text-neutral-600 font-medium -mt-0.5 sm:-mt-1 hidden sm:block">
                  Pure • Organic • Authentic
                </p>
              </div>
            </Link>
          </div>

          {/* Responsive Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link 
              href="/" 
              className="group relative px-2 lg:px-4 py-2 text-gray-700 hover:text-orange-600 font-medium transition-all duration-200 rounded-lg hover:bg-orange-50"
            >
              <span className="flex items-center space-x-1 lg:space-x-2">
                <svg className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm lg:text-base">Home</span>
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </Link>
            
            <Link 
              href="/products" 
              className="group relative px-2 lg:px-4 py-2 text-gray-700 hover:text-orange-600 font-medium transition-all duration-200 rounded-lg hover:bg-orange-50"
            >
              <span className="flex items-center space-x-1 lg:space-x-2">
                <svg className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm lg:text-base">Products</span>
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </Link>
            
            <Link 
              href="/about" 
              className="group relative px-2 lg:px-4 py-2 text-gray-700 hover:text-orange-600 font-medium transition-all duration-200 rounded-lg hover:bg-orange-50"
            >
              <span className="flex items-center space-x-1 lg:space-x-2">
                <svg className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm lg:text-base">About</span>
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </Link>
            
            <Link 
              href="/contact" 
              className="group relative px-2 lg:px-4 py-2 text-gray-700 hover:text-orange-600 font-medium transition-all duration-200 rounded-lg hover:bg-orange-50"
            >
              <span className="flex items-center space-x-1 lg:space-x-2">
                <svg className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm lg:text-base">Contact</span>
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </Link>
          </nav>

          {/* Responsive Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-3 px-4 py-2 bg-neutral-100 rounded-xl">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
                <span className="text-sm text-neutral-600 font-medium">Loading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Responsive Cart Icon */}
                <Link
                  href="/cart"
                  className="relative p-1.5 lg:p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  title={`Basket (${cartState.totalItems} items)`}
                >
                  <div className="relative">
                    <svg className="h-5 w-5 lg:h-7 lg:w-7 text-gray-700 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11h6" />
                    </svg>
                    <span className={`absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 h-3 w-3 lg:h-4 lg:w-4 text-white text-xs font-semibold rounded-full flex items-center justify-center ${
                      cartState.totalItems > 0 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}>
                      {cartState.totalItems > 9 ? '9+' : cartState.totalItems}
                    </span>
                  </div>
                </Link>

                {/* Conditional User Section */}
                {user ? (
                  /* Professional User Menu for logged-in users */
                  <div className="relative">
                    <button
                      onClick={() => setIsDesktopUserMenuOpen(!isDesktopUserMenuOpen)}
                      className="flex items-center space-x-1 lg:space-x-2 p-1.5 lg:p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                      title={`${user.name || 'User'} - Click to open menu`}
                    >
                      <div className="h-6 w-6 lg:h-8 lg:w-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs lg:text-sm">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <svg className={`h-4 w-4 lg:h-5 lg:w-5 text-gray-600 group-hover:text-orange-600 transition-all duration-200 ${isDesktopUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDesktopUserMenuOpen && (
                      <div ref={dropdownRef} className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-primary-100 py-2 z-50 overflow-hidden backdrop-blur-sm">
                        <Link
                          href={(user.role === 'super_admin' || user.role === 'admin') ? '/admin/dashboard' : '/orders'}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group"
                          onClick={() => setIsDesktopUserMenuOpen(false)}
                        >
                          <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                            <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <span className="font-medium">{(user.role === 'super_admin' || user.role === 'admin') ? 'Dashboard' : 'My Orders'}</span>
                        </Link>
                        
                        <div className="border-t border-primary-100">
                          <button
                            onClick={() => {
                              logout();
                              setIsDesktopUserMenuOpen(false);
                            }}
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-error-600 hover:bg-error-50 hover:text-error-700 transition-all duration-200 w-full text-left group"
                          >
                            <div className="p-2 bg-error-100 rounded-lg group-hover:bg-error-200 transition-colors">
                              <svg className="h-4 w-4 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <span className="font-medium">Sign out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Professional Account Icon for non-logged-in users */
                  <Link
                    href="/auth/login"
                    className="relative p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                    title="Sign In"
                  >
                    <svg className="h-7 w-7 text-gray-700 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Responsive Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              title={`Basket (${cartState.totalItems} items)`}
            >
              <div className="relative">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11h6" />
                </svg>
                <span className={`absolute -top-1 -right-1 h-4 w-4 text-white text-xs font-semibold rounded-full flex items-center justify-center ${
                  cartState.totalItems > 0 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}>
                  {cartState.totalItems > 9 ? '9+' : cartState.totalItems}
                </span>
              </div>
            </Link>

            {/* Mobile User Profile Icon */}
            {isLoading ? (
              <div className="flex items-center space-x-2 px-2 py-1 bg-neutral-100 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center space-x-1 p-1.5 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  title={`${user.name || 'User'} - Click to open menu`}
                >
                  <div className="h-6 w-6 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <svg className={`h-4 w-4 text-gray-600 group-hover:text-orange-600 transition-all duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="relative p-1.5 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                title="Sign In"
              >
                <svg className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Category Dropdown */}
      <MobileCategoryDropdown
        categories={categories}
        productTypes={productTypes}
        selectedCategory={selectedCategory}
        selectedProductType={selectedProductType}
        onCategoryChange={(value) => {
          const categoryValue = Array.isArray(value) ? value[0] || '' : value;
          setSelectedCategory(categoryValue);
        }}
        onProductTypeChange={(value) => {
          const typeValue = Array.isArray(value) ? value[0] || '' : value;
          setSelectedProductType(typeValue);
        }}
        isOpen={isCategoryDropdownOpen}
        onClose={() => setIsCategoryDropdownOpen(false)}
      />
    </header>

    {/* Responsive Mobile menu - Outside header for proper positioning */}
    {isMobileMenuOpen && (
      <>
        {/* Backdrop overlay - only covers area below menu */}
        <div 
          className="md:hidden fixed inset-0 z-[99] bg-black bg-opacity-20"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ top: '4rem' }}
        />
        {/* Mobile menu */}
        <div 
          className="md:hidden fixed inset-x-0 top-16 sm:top-20 lg:top-24 bottom-0 z-[100] bg-white overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-4 pb-6 space-y-2 border-t-2 border-primary-100 bg-gradient-to-b from-white to-primary-50 min-h-full">
              {/* Close Button */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors [touch-action:manipulation] cursor-pointer relative z-[101]"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Navigation Links */}
              <div className="space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    setTimeout(() => {
                      router.push('/');
                    }, 100);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 [touch-action:manipulation] cursor-pointer relative z-[101] w-full text-left"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen(false);
                    setIsCategoryDropdownOpen(true);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 w-full text-left [touch-action:manipulation] cursor-pointer relative z-[101]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Products</span>
                  <svg className="h-4 w-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    setTimeout(() => {
                      router.push('/about');
                    }, 100);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 [touch-action:manipulation] cursor-pointer relative z-[101] w-full text-left"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>About</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    setTimeout(() => {
                      router.push('/contact');
                    }, 100);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 [touch-action:manipulation] cursor-pointer relative z-[101] w-full text-left"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Contact</span>
                </button>
              </div>
              
              {/* User Profile Section - Only show if user is logged in */}
              {user && (
                <div className="pt-4 border-t-2 border-primary-200">
                  <div className="space-y-1">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                      <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    
                    {/* User Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        const path = (user.role === 'super_admin' || user.role === 'admin') ? '/admin/dashboard' : '/orders';
                        setTimeout(() => {
                          router.push(path);
                        }, 100);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 [touch-action:manipulation] cursor-pointer relative z-[101] w-full text-left"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>{(user.role === 'super_admin' || user.role === 'admin') ? 'Dashboard' : 'My Orders'}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-error-600 hover:bg-error-50 rounded-xl transition-all duration-200 w-full text-left [touch-action:manipulation] cursor-pointer relative z-[101]"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </>
        )}
    </>
  );
}
