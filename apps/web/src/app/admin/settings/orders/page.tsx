'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { OrderSettings, Field, PkrInput, SaveButton, SectionCard, SettingsLoader, saveSettings } from '../_shared';

export default function OrdersSettingsPage() {
  const [data, setData] = useState<OrderSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/settings/orders', { credentials: 'include' })
      .then(r => r.json())
      .then(j => { const d = j.data ?? j; setData({ minOrderAmount: d.minOrderAmount != null ? String(d.minOrderAmount) : '' }); });
  }, []);

  const handleSave = () => data && saveSettings('/api/v1/settings/orders', { minOrderAmount: parseFloat(data.minOrderAmount) || 0 }, setSaving);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Orders" breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings/delivery' }, { label: 'Orders' }]} />
          {!data ? <SettingsLoader /> : (
            <SectionCard title="Order Configuration" description="Rules applied to every order">
              <div className="max-w-sm">
                <Field label="Minimum Order Amount (₨)" hint="Orders below this amount will be rejected">
                  <PkrInput value={data.minOrderAmount} onChange={v => setData({ minOrderAmount: v })} placeholder="Enter minimum order amount" />
                </Field>
              </div>
              <SaveButton onClick={handleSave} saving={saving} />
            </SectionCard>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
