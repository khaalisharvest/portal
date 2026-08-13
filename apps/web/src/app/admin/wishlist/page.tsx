'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import WishlistManagement from '@/components/super-admin/WishlistManagement';

export default function AdminWishlistPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'staff']}>
      <AdminLayout>
        <WishlistManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}
