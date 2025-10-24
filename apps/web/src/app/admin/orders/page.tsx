'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import OrdersManagement from '@/components/super-admin/OrdersManagement';

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin', 'customer']}>
      <AdminLayout>
        <OrdersManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}
