'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardOverview from '@/components/admin/DashboardOverview';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      <AdminLayout>
        <DashboardOverview />
      </AdminLayout>
    </ProtectedRoute>
  );
}
