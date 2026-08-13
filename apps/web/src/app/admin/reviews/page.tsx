'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import ReviewsManagement from '@/components/super-admin/ReviewsManagement';

export default function AdminReviewsPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'staff']}>
      <AdminLayout>
        <ReviewsManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}
