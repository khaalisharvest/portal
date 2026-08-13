'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
  badge?: number;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [badges, setBadges] = useState<{ reviews: number; messages: number }>({ reviews: 0, messages: 0 });
  const [productsExpanded, setProductsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/v1/admin/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const data = d.data || d;
        setBadges({ reviews: data.pendingReviewsCount || 0, messages: data.unreadMessagesCount || 0 });
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (pathname.startsWith('/admin/products')) setProductsExpanded(true);
    if (pathname.startsWith('/admin/settings')) setSettingsExpanded(true);
  }, [pathname]);

  const role = user?.role ?? '';

  const navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: 'home', roles: ['super_admin', 'staff'] },
      ],
    },
    {
      label: 'Catalogue',
      items: [
        {
          label: 'Products', href: '/admin/products', icon: 'cube', roles: ['super_admin', 'staff'],
          children: [
            { label: 'All Products', href: '/admin/products', icon: 'list-bullet', roles: ['super_admin', 'staff'] },
            { label: 'Categories', href: '/admin/products/categories', icon: 'tag', roles: ['super_admin', 'staff'] },
            { label: 'Types', href: '/admin/products/types', icon: 'squares-2x2', roles: ['super_admin', 'staff'] },
            { label: 'Inventory', href: '/admin/products/inventory', icon: 'archive-box', roles: ['super_admin', 'staff'] },
          ],
        },
      ],
    },
    {
      label: 'Sales',
      items: [
        { label: 'Orders', href: '/admin/orders', icon: 'shopping-bag', roles: ['super_admin', 'staff'] },
        { label: 'Reviews', href: '/admin/reviews', icon: 'star', roles: ['super_admin', 'staff'], badge: badges.reviews },
        { label: 'Wishlist', href: '/admin/wishlist', icon: 'heart', roles: ['super_admin', 'staff'] },
      ],
    },
    {
      label: 'People',
      items: [
        { label: 'Customers', href: '/admin/customers', icon: 'users', roles: ['super_admin'] },
        { label: 'Staff', href: '/admin/staff', icon: 'user-group', roles: ['super_admin'] },
      ],
    },
    {
      label: 'Store',
      items: [
        { label: 'Messages', href: '/admin/contacts', icon: 'envelope', roles: ['super_admin'], badge: badges.messages },
        {
          label: 'Settings', href: '/admin/settings/delivery', icon: 'cog-6-tooth', roles: ['super_admin'],
          children: [
            { label: 'Delivery',          href: '/admin/settings/delivery',          icon: 'truck',         roles: ['super_admin'] },
            { label: 'Payment',           href: '/admin/settings/payment',           icon: 'credit-card',   roles: ['super_admin'] },
            { label: 'Contact',           href: '/admin/settings/contact',           icon: 'phone',         roles: ['super_admin'] },
            { label: 'Social Links',      href: '/admin/settings/social',            icon: 'share',         roles: ['super_admin'] },
            { label: 'Store',             href: '/admin/settings/store',             icon: 'building-storefront', roles: ['super_admin'] },
            { label: 'Orders',            href: '/admin/settings/orders',            icon: 'clipboard-list', roles: ['super_admin'] },
            { label: 'Notification Bar',  href: '/admin/settings/notification-bar',  icon: 'bell',          roles: ['super_admin'] },
          ],
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/products') return pathname === '/admin/products';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const hasRole = (roles: string[]) => roles.includes(role);

  const renderNavItem = (item: NavItem, indented = false) => {
    if (!hasRole(item.roles)) return null;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          active
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        } ${indented ? 'pl-8' : ''}`}
      >
        <Icon name={item.icon} className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary-600' : 'text-neutral-400'}`} />
        <span className="truncate flex-1">{item.label}</span>
        {(item.badge ?? 0) > 0 && (
          <span className="bg-error-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
            {(item.badge ?? 0) > 9 ? '9+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderExpandableGroup = (
    item: NavItem,
    expanded: boolean,
    setExpanded: (fn: (v: boolean) => boolean) => void,
    parentPrefix: string,
  ) => {
    if (!hasRole(item.roles)) return null;
    const parentActive = pathname.startsWith(parentPrefix);
    return (
      <div key={item.href}>
        <button
          onClick={() => setExpanded(e => !e)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            parentActive && !expanded
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
          }`}
        >
          <Icon name={item.icon} className={`w-4 h-4 flex-shrink-0 ${parentActive ? 'text-primary-600' : 'text-neutral-400'}`} />
          <span className="truncate flex-1 text-left">{item.label}</span>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
        </button>
        {expanded && item.children && (
          <div className="mt-0.5 space-y-0.5 border-l-2 border-neutral-100 ml-5 pl-2">
            {item.children.map(child => renderNavItem(child, false))}
          </div>
        )}
      </div>
    );
  };

  const renderProductsGroup = (item: NavItem) =>
    renderExpandableGroup(item, productsExpanded, setProductsExpanded, '/admin/products');

  const renderSettingsGroup = (item: NavItem) =>
    renderExpandableGroup(item, settingsExpanded, setSettingsExpanded, '/admin/settings');

  return (
    <div className="bg-white border-r border-neutral-200 w-60 flex-shrink-0 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image src="/images/logo.png" alt="Khaalis Harvest" fill sizes="32px" className="object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 leading-tight">Khaalis</p>
            <p className="text-[10px] text-neutral-400 leading-tight">Harvest Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => hasRole(item.roles));
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  if (!item.children) return renderNavItem(item);
                  if (item.href.startsWith('/admin/settings')) return renderSettingsGroup(item);
                  return renderProductsGroup(item);
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-neutral-100">
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-700">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-xs text-neutral-400 capitalize">{role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Logout"
            className="text-neutral-400 hover:text-error-500 transition-colors"
          >
            <Icon name="logout" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
