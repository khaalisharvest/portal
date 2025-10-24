'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import Icon from '@/components/ui/Icon';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getUserDisplayName = () => {
    if (user?.role === 'super_admin') return 'Super Admin';
    if (user?.role === 'admin') return 'Admin';
    if (user?.role === 'customer') return 'Customer';
    return 'User';
  };

  const getRoleColor = () => {
    if (user?.role === 'super_admin') return 'bg-error-50 text-error-600';
    if (user?.role === 'admin') return 'bg-primary-100 text-primary-800';
    if (user?.role === 'customer') return 'bg-success-50 text-success-600';
    return 'bg-neutral-100 text-neutral-800';
  };

  return (
    <div className="min-h-screen organic-gradient flex">
      {/* Sidebar */}
      <AdminSidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-visible">
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
