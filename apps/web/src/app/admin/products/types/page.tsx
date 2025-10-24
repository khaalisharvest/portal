'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import ProductTypesManagement from '@/components/super-admin/ProductTypesManagement';

export default function AdminProductTypesPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      <AdminLayout>
        <ProductTypesManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}
