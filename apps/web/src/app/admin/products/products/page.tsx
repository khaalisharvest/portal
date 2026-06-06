'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import ProductsManagement from '@/components/super-admin/ProductsManagement';

export default function AdminProductsPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'staff']}>
      <AdminLayout>
        <ProductsManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}
