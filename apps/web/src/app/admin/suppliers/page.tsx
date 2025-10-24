'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import SuppliersManagement from '@/components/super-admin/SuppliersManagement';

export default function AdminSuppliersPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      <AdminLayout>
        <SuppliersManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}

