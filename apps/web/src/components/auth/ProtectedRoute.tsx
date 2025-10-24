'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        // Redirect to appropriate page based on user role
        if (user.role === 'super_admin' || user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/orders');
        }
        return;
      }
    }
  }, [user, isLoading, requiredRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

// Specific role protection components
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function CustomerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['customer']}>
      {children}
    </ProtectedRoute>
  );
}
