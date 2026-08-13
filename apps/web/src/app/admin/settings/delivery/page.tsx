'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { DeliverySettings, Toggle, Field, PkrInput, SaveButton, SectionCard, SettingsLoader, saveSettings } from '../_shared';

export default function DeliverySettingsPage() {
  const [data, setData] = useState<DeliverySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/settings/delivery', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const d = j.data ?? j;
        setData({
          deliveryFee: d.deliveryFee != null ? String(d.deliveryFee) : '',
          freeDeliveryThreshold: d.freeDeliveryThreshold != null ? String(d.freeDeliveryThreshold) : '',
          isDeliveryEnabled: Boolean(d.isDeliveryEnabled),
        });
      });
  }, []);

  const handleSave = () => data && saveSettings('/api/v1/settings/delivery', {
    deliveryFee: parseFloat(data.deliveryFee) || 0,
    freeDeliveryThreshold: parseFloat(data.freeDeliveryThreshold) || 0,
    isDeliveryEnabled: data.isDeliveryEnabled,
  }, setSaving);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Delivery" breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings/delivery' }, { label: 'Delivery' }]} />
          {!data ? <SettingsLoader /> : (
            <SectionCard title="Delivery Configuration" description="Configure delivery fees and availability">
              <Toggle checked={data.isDeliveryEnabled} onChange={v => setData({ ...data, isDeliveryEnabled: v })}
                label="Enable Delivery Service" description="Turn delivery on or off for all orders" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Delivery Fee (₨)" hint="Standard fee charged per order">
                  <PkrInput value={data.deliveryFee} onChange={v => setData({ ...data, deliveryFee: v })} placeholder="Enter delivery fee" />
                </Field>
                <Field label="Free Delivery Threshold (₨)" hint="Orders above this amount get free delivery">
                  <PkrInput value={data.freeDeliveryThreshold} onChange={v => setData({ ...data, freeDeliveryThreshold: v })} placeholder="Enter threshold" />
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
