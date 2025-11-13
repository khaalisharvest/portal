'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import toast from 'react-hot-toast';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles: string[];
  children?: SidebarItem[];
}

const getSidebarItems = (userRole: string): SidebarItem[] => {
  // Admin sidebar - only for super_admin and admin roles
  return [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'chart',
      href: '/admin/dashboard',
      roles: ['super_admin', 'admin']
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'leaf',
      href: '/admin/products',
      roles: ['super_admin', 'admin'],
      children: [
        {
          id: 'categories',
          label: 'Categories',
          icon: 'folder',
          href: '/admin/products/categories',
          roles: ['super_admin', 'admin']
        },
        {
          id: 'product-types',
          label: 'Product Types',
          icon: 'tag',
          href: '/admin/products/types',
          roles: ['super_admin', 'admin']
        }
      ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: 'shopping-cart',
      href: '/admin/orders',
      roles: ['super_admin', 'admin']
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: 'user',
      href: '/admin/customers',
      roles: ['super_admin', 'admin']
    },
    {
      id: 'contacts',
      label: 'Contact Messages',
      icon: 'envelope',
      href: '/admin/contacts',
      roles: ['super_admin', 'admin']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'cog',
      href: '/admin/settings',
      roles: ['super_admin', 'admin']
    }
  ];
};


interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const sidebarItems = React.useMemo(() => getSidebarItems(user?.role || 'admin'), [user?.role]);

  // Auto-expand parent items when child is active
  React.useEffect(() => {
    const findActiveParents = (items: SidebarItem[]): string[] => {
      const parents: string[] = [];

      for (const item of items) {
        // Check if the item itself is active (for parent items with valid hrefs)
        const isItemActive = pathname === item.href || pathname.startsWith(item.href + '/');

        if (item.children) {
          const hasActiveChild = item.children.some(child =>
            pathname === child.href || pathname.startsWith(child.href + '/')
          );

          if (hasActiveChild || isItemActive) {
            parents.push(item.id);
            // Recursively check nested children
            parents.push(...findActiveParents(item.children));
          }
        }
      }

      return parents;
    };

    const activeParents = findActiveParents(sidebarItems);
    setExpandedItems(prev => {
      const newExpanded = Array.from(new Set([...prev, ...activeParents]));
      return newExpanded;
    });
  }, [pathname, sidebarItems]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (href: string, children?: SidebarItem[]): boolean => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + '/')) return true;

    // Check if any child is active
    if (children) {
      return children.some(child => isItemActive(child.href, child.children));
    }

    return false;
  };

  const hasPermission = (roles: string[]) => {
    return roles.includes(user?.role || 'admin');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    if (!hasPermission(item.roles)) return null;

    const isActive = isItemActive(item.href, item.children);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const handleItemClick = (e: React.MouseEvent) => {
      // Only prevent navigation for items that are purely expandable (no valid href)
      if (hasChildren && item.href === '#') {
        e.preventDefault();
        toggleExpanded(item.id);
      }
      // For items with both href and children, always allow navigation and toggle expansion
      else if (hasChildren && item.href !== '#') {
        toggleExpanded(item.id);
        // Don't prevent default - let the link navigate to parent page
      }
      // For items without children, always allow navigation (remove the preventDefault for active items)
      // This ensures the first click always works
    };

    return (
      <div key={item.id}>
        <div className="relative">
          {hasChildren ? (
            <a
              href={item.href}
              onClick={handleItemClick}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group ${isActive
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-neutral-900'
                } ${level > 0 ? 'ml-4' : ''}`}
            >
              <Icon
                name={item.icon}
                className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'
                  }`}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    className="w-4 h-4 text-gray-400 ml-auto"
                  />
                </>
              )}
            </a>
          ) : (
            <a
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group ${isActive
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-neutral-900'
                } ${level > 0 ? 'ml-4' : ''}`}
            >
              <Icon
                name={item.icon}
                className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'
                  }`}
              />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </a>
          )}
        </div>

        {/* Children */}
        {hasChildren && !isCollapsed && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-primary-100 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-100">
        <Link
          href="/"
          className="flex items-center justify-center p-2 hover:bg-primary-50 rounded-lg transition-colors group"
        >
          <div className="h-24 w-24 relative group-hover:scale-105 transition-transform">
            <Image
              src="/images/logo.png"
              alt="Khaalis Harvest Logo"
              fill
              sizes="96px"
              className="object-contain"
            />
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Icon
            name={isCollapsed ? 'chevron-right' : 'chevron-left'}
            className="w-5 h-5 text-gray-500"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.phone || 'Admin User'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors group"
            >
              <Icon name="logout" className="w-5 h-5 mr-3 text-red-500 group-hover:text-red-600" />
              <span>Logout</span>
            </button>

            {/* Version Info */}
            <div className="text-xs text-gray-500 text-center">
              <p>Khaalis Harvest Admin v1.0.0</p>
            </div>
          </div>
        ) : (
          /* Collapsed Footer */
          <div className="space-y-2">
            {/* User Avatar */}
            <div className="flex justify-center">
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors group"
              title="Logout"
            >
              <Icon name="logout" className="w-5 h-5 text-red-500 group-hover:text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
