'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  Squares2X2Icon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

const NAV = [
  {
    label: 'Home',
    href: '/',
    exact: true,
    OutlineIcon: HomeIcon,
    SolidIcon: HomeIconSolid,
  },
  {
    label: 'Products',
    href: '/products',
    exact: false,
    OutlineIcon: Squares2X2Icon,
    SolidIcon: Squares2X2IconSolid,
  },
  {
    label: 'Cart',
    href: '/cart',
    exact: true,
    OutlineIcon: ShoppingCartIcon,
    SolidIcon: ShoppingCartIconSolid,
  },
  {
    label: 'Wishlist',
    href: '/wishlist',
    exact: true,
    OutlineIcon: HeartIcon,
    SolidIcon: HeartIconSolid,
  },
  {
    label: 'Account',
    href: '/account',
    exact: false,
    OutlineIcon: UserIcon,
    SolidIcon: UserIconSolid,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { state } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user } = useAuth();

  if (pathname.startsWith('/admin')) return null;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 h-16">
        {NAV.map(({ label, href, exact, OutlineIcon, SolidIcon }) => {
          const dest = label === 'Account' && !user ? '/auth/login' : href;
          const active = isActive(href, exact);
          const Icon = active ? SolidIcon : OutlineIcon;
          const isWishlist = label === 'Wishlist';
          return (
            <Link
              key={label}
              href={dest}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${
                active && isWishlist
                  ? 'text-error-500'
                  : active
                  ? 'text-primary-600'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {label === 'Cart' && state.totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {state.totalItems > 99 ? '99+' : state.totalItems}
                  </span>
                )}
                {isWishlist && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && (
                <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${
                  isWishlist ? 'bg-error-500' : 'bg-primary-600'
                }`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
