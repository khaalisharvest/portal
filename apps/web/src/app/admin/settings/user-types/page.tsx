'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import UserTypesManagement from '@/components/super-admin/UserTypesManagement';

export default function AdminUserTypesPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Types Management</h1>
            <p className="text-gray-600">Define and manage different user types and their permissions</p>
          </div>
          <UserTypesManagement />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
