'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { ContactSettings, Field, TextInput, SaveButton, SectionCard, SettingsLoader, saveSettings } from '../_shared';

export default function ContactSettingsPage() {
  const [data, setData] = useState<ContactSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/settings/contact', { credentials: 'include' })
      .then(r => r.json())
      .then(j => { const d = j.data ?? j; setData({ adminEmail: d.adminEmail ?? '', adminWhatsapp: d.adminWhatsapp ?? '' }); });
  }, []);

  const handleSave = () => data && saveSettings('/api/v1/settings/contact', data, setSaving);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Contact" breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings/delivery' }, { label: 'Contact' }]} />
          {!data ? <SettingsLoader /> : (
            <SectionCard title="Contact Configuration" description="Admin contact details used for notifications and customer support">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Admin Email" hint="Order notification emails are sent here">
                  <TextInput value={data.adminEmail} onChange={v => setData({ ...data, adminEmail: v })} placeholder="admin@example.com" type="email" />
                </Field>
                <Field label="Admin WhatsApp" hint="Shown to customers for order support">
                  <TextInput value={data.adminWhatsapp} onChange={v => setData({ ...data, adminWhatsapp: v })} placeholder="+923001234567" />
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
