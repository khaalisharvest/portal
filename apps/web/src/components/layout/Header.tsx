'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useFilter } from '@/contexts/FilterContext';
import MobileCategoryDropdown from '@/components/ui/MobileCategoryDropdown';
import { useCategories, useProductTypes } from '@/hooks/useProducts';

const NAV_LINKS = [
  { href: '/',        label: 'Home'     },
  { href: '/products',label: 'Products' },
  { href: '/contact', label: 'Contact'  },
];

export default function Header() {
  const router   = useRouter();
  const pathname = usePathname();

  const { user, logout, isLoading } = useAuth();
  const { state: cartState }        = useCart();
  const {
    selectedCategory,
    selectedProductType,
    setSelectedCategory,
    setSelectedProductType,
    isCategoryDropdownOpen,
    setIsCategoryDropdownOpen,
  } = useFilter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const { categories: categoriesRaw } = useCategories();
  const { productTypes }              = useProductTypes();
  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : (categoriesRaw as any)?.data ?? [];

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [userMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'staff';

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* ─────────────────────────────── HEADER ─────────────────────────────── */}
      <header
        className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
            : 'border-b border-neutral-100'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">

            {/* ── LOGO ──────────────────────────────────────────────── */}
            <Link
              href="/"
              className="flex items-center gap-0.5 flex-shrink-0 group"
              onClick={closeMobile}
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/logo.png"
                  alt="Khaalis Harvest"
                  fill
                  priority
                  sizes="64px"
                  className="object-contain scale-[1.3]"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[17px] font-bold tracking-tight">
                  <span className="text-primary-600">Khaalis</span>
                  <span className="text-neutral-800"> Harvest</span>
                </span>
                <span className="text-[9px] font-semibold tracking-[0.2em] text-neutral-400 uppercase mt-0.5">
                  Pure Organic
                </span>
              </div>
            </Link>

            {/* ── DESKTOP NAV ───────────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      active
                        ? 'text-primary-600'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    {label}
                    {active && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute bottom-0.5 left-4 right-4 h-0.5 bg-primary-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── DESKTOP ACTIONS ───────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-0.5">
              {isLoading ? (
                /* Skeleton */
                <div className="flex items-center gap-2 px-2">
                  <div className="h-8 w-8 rounded-full bg-neutral-100 animate-pulse" />
                </div>
              ) : (
                <>
                  {/* Wishlist — logged-in customers only */}
                  {user && !isAdmin && (
                    <Link
                      href="/wishlist"
                      aria-label="My Wishlist"
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        pathname === '/wishlist'
                          ? 'text-rose-500 bg-rose-50'
                          : 'text-neutral-400 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                    >
                      <svg className="h-5 w-5" fill={pathname === '/wishlist' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </Link>
                  )}

                  {/* Cart */}
                  <Link
                    href="/cart"
                    aria-label={`Cart — ${cartState.totalItems} item${cartState.totalItems !== 1 ? 's' : ''}`}
                    className={`relative p-2.5 rounded-lg transition-all duration-200 ${
                      pathname === '/cart'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-neutral-400 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                    </svg>
                    <AnimatePresence>
                      {cartState.totalItems > 0 && (
                        <motion.span
                          key="cart-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
                        >
                          {cartState.totalItems > 9 ? '9+' : cartState.totalItems}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* Divider */}
                  <div className="w-px h-5 bg-neutral-200 mx-1" />

                  {/* User — logged in */}
                  {user ? (
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setUserMenuOpen(v => !v)}
                        aria-label="Account menu"
                        aria-expanded={userMenuOpen}
                        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-neutral-50 transition-all duration-200"
                      >
                        {/* Avatar */}
                        <div className="h-7 w-7 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white text-xs font-bold leading-none">
                            {user.name?.charAt(0).toUpperCase() ?? 'U'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-neutral-700 max-w-[80px] truncate">
                          {user.name?.split(' ')[0] ?? 'Account'}
                        </span>
                        <svg
                          className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {userMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-50"
                          >
                            {/* User info */}
                            <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-neutral-50 border-b border-neutral-100">
                              <p className="text-sm font-semibold text-neutral-900 truncate">{user.name}</p>
                              <p className="text-xs text-neutral-500 truncate mt-0.5">
                                {user.email || user.phone}
                              </p>
                            </div>

                            {/* Menu items */}
                            <div className="py-1.5">
                              <DropdownItem
                                href={isAdmin ? '/admin/dashboard' : '/orders'}
                                onClick={() => setUserMenuOpen(false)}
                                icon={isAdmin
                                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                                }
                              >
                                {isAdmin ? 'Dashboard' : 'My Orders'}
                              </DropdownItem>

                              {!isAdmin && (
                                <>
                                  <DropdownItem
                                    href="/account"
                                    onClick={() => setUserMenuOpen(false)}
                                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                                  >
                                    My Account
                                  </DropdownItem>
                                  <DropdownItem
                                    href="/wishlist"
                                    onClick={() => setUserMenuOpen(false)}
                                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                                    hoverClass="hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    Wishlist
                                  </DropdownItem>
                                </>
                              )}
                            </div>

                            <div className="border-t border-neutral-100 py-1.5">
                              <button
                                onClick={() => { logout(); setUserMenuOpen(false); }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors duration-150 text-left"
                              >
                                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    /* Sign In button — guest */
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center gap-1.5 px-4 py-2 ml-1 text-sm font-semibold text-primary-600 border-2 border-primary-200 hover:border-primary-500 hover:bg-primary-50 rounded-xl transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* ── MOBILE ACTIONS ────────────────────────────────────── */}
            <div className="flex md:hidden items-center gap-1">
              {/* Cart */}
              <Link
                href="/cart"
                aria-label="Cart"
                className="relative p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                </svg>
                <AnimatePresence>
                  {cartState.totalItems > 0 && (
                    <motion.span
                      key="mobile-cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
                    >
                      {cartState.totalItems > 9 ? '9+' : cartState.totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Hamburger / Close */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <AnimatePresence mode="wait" initial={false}>
                    {mobileOpen ? (
                      <motion.path
                        key="close"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        exit={{ pathLength: 0 }}
                        transition={{ duration: 0.2 }}
                        strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <motion.path
                        key="open"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        exit={{ pathLength: 0 }}
                        transition={{ duration: 0.2 }}
                        strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </AnimatePresence>
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile category filter dropdown */}
        <MobileCategoryDropdown
          categories={categories}
          productTypes={productTypes}
          selectedCategory={selectedCategory}
          selectedProductType={selectedProductType}
          onCategoryChange={value => setSelectedCategory(Array.isArray(value) ? value[0] ?? '' : value)}
          onProductTypeChange={value => setSelectedProductType(Array.isArray(value) ? value[0] ?? '' : value)}
          isOpen={isCategoryDropdownOpen}
          onClose={() => setIsCategoryDropdownOpen(false)}
        />
      </header>

      {/* ────────────────────────── MOBILE MENU ─────────────────────────────── */}

      {/* Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed inset-0 top-16 z-40 bg-black/30"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="md:hidden fixed inset-x-0 top-16 z-50 bg-white border-b border-neutral-100 shadow-lg overflow-y-auto max-h-[88vh]"
          >

            {/* ── User row — logged in ─────────────────────────── */}
            {user && !isLoading && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
                <div className="h-9 w-9 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold leading-none">
                    {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{user.name}</p>
                  <p className="text-xs text-neutral-400 truncate">{user.email || user.phone}</p>
                </div>
              </div>
            )}

            {/* ── Nav links ───────────────────────────────────────── */}
            <nav className="px-2 py-3 space-y-0.5">
              {NAV_LINKS.map(({ href, label }) => {
                const active     = isActive(href);
                const isProducts = href === '/products';
                const hasFilter  = isProducts && (!!selectedCategory || !!selectedProductType);

                if (isProducts) {
                  return (
                    <div
                      key={href}
                      className={`flex items-center rounded-xl transition-colors duration-150 ${
                        active ? 'bg-primary-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      {/* "Products" — navigates, only as wide as its text */}
                      <button
                        onClick={() => { closeMobile(); router.push(href); }}
                        className={`px-4 py-3 text-base font-medium text-left transition-colors ${
                          active ? 'text-primary-600' : 'text-neutral-800'
                        }`}
                      >
                        {label}
                      </button>

                      {/* › — sits directly after the text */}
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          router.push('/products');
                          setIsCategoryDropdownOpen(true);
                        }}
                        aria-label="Browse product categories"
                        className={`flex items-center gap-0.5 pl-0.5 pr-2 py-3 transition-colors ${
                          hasFilter ? 'text-primary-500' : 'text-neutral-400'
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Spacer — fills remaining row width for hover bg */}
                      <div className="flex-1" />
                    </div>
                  );
                }

                return (
                  <button
                    key={href}
                    onClick={() => { closeMobile(); router.push(href); }}
                    className={`flex items-center w-full px-4 py-3 text-base font-medium rounded-xl transition-colors duration-150 text-left ${
                      active
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-neutral-800 hover:text-primary-700 hover:bg-neutral-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* ── Account section — logged in ─────────────────────── */}
            {!isLoading && user && (
              <div className="px-2 py-3 border-t border-neutral-100 space-y-0.5">
                <MobileMenuItem
                  onClick={() => { closeMobile(); router.push(isAdmin ? '/admin/dashboard' : '/orders'); }}
                  icon={isAdmin
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                  }
                >
                  {isAdmin ? 'Dashboard' : 'My Orders'}
                </MobileMenuItem>

                {!isAdmin && (
                  <>
                    <MobileMenuItem
                      onClick={() => { closeMobile(); router.push('/account'); }}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                    >
                      My Account
                    </MobileMenuItem>
                    <MobileMenuItem
                      onClick={() => { closeMobile(); router.push('/wishlist'); }}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                      hoverClass="hover:text-rose-500 hover:bg-rose-50"
                    >
                      Wishlist
                    </MobileMenuItem>
                  </>
                )}

                <button
                  onClick={() => { logout(); closeMobile(); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-error-500 hover:bg-error-50 rounded-xl transition-colors duration-150 text-left"
                >
                  <svg className="h-4 w-4 text-error-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}

            {/* ── Auth buttons — guest ─────────────────────────────── */}
            {!isLoading && !user && (
              <div className="px-4 py-4 border-t border-neutral-100 space-y-2.5">
                <Link
                  href="/auth/login"
                  onClick={closeMobile}
                  className="btn-primary w-full justify-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={closeMobile}
                  className="btn-outline w-full justify-center"
                >
                  Create Account
                </Link>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Mobile menu item with icon ──────────────────────────────────────────── */
function MobileMenuItem({
  onClick,
  icon,
  hoverClass = 'hover:text-primary-600 hover:bg-neutral-50',
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  hoverClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-neutral-700 rounded-xl transition-colors duration-150 text-left ${hoverClass}`}
    >
      <svg className="h-4 w-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
      {children}
    </button>
  );
}

/* ─── Desktop dropdown menu item ───────────────────────────────────────────── */
function DropdownItem({
  href,
  onClick,
  icon,
  hoverClass = 'hover:bg-primary-50 hover:text-primary-700',
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  hoverClass?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors duration-150 ${hoverClass}`}
    >
      <svg className="h-4 w-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
      {children}
    </Link>
  );
}
