'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { StoreSettings, Toggle, SaveButton, SectionCard, SettingsLoader, saveSettings } from '../_shared';

export default function StoreSettingsPage() {
  const [data, setData] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/settings/store', { credentials: 'include' })
      .then(r => r.json())
      .then(j => { const d = j.data ?? j; setData({ maintenanceMode: Boolean(d.maintenanceMode) }); });
  }, []);

  const handleSave = () => data && saveSettings('/api/v1/settings/store', data, setSaving);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Store" breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings/delivery' }, { label: 'Store' }]} />
          {!data ? <SettingsLoader /> : (
            <SectionCard title="Store Configuration" description="Control overall store availability">
              <Toggle checked={data.maintenanceMode} onChange={v => setData({ maintenanceMode: v })}
                label="Maintenance Mode" description="When enabled, customers see a maintenance message and cannot place orders" />
              {data.maintenanceMode && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700 font-medium">Store is in maintenance mode — customers cannot place orders</p>
                </div>
              )}
              <SaveButton onClick={handleSave} saving={saving} />
            </SectionCard>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
