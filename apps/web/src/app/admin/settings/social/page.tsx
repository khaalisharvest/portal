'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { SocialSettings, Field, TextInput, SaveButton, SectionCard, SettingsLoader, saveSettings } from '../_shared';

export default function SocialSettingsPage() {
  const [data, setData] = useState<SocialSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/settings/social', { credentials: 'include' })
      .then(r => r.json())
      .then(j => { const d = j.data ?? j; setData({ instagramUrl: d.instagramUrl ?? '', facebookUrl: d.facebookUrl ?? '', tiktokUrl: d.tiktokUrl ?? '' }); });
  }, []);

  const handleSave = () => data && saveSettings('/api/v1/settings/social', data, setSaving);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Social Links" breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings/delivery' }, { label: 'Social Links' }]} />
          {!data ? <SettingsLoader /> : (
            <SectionCard title="Social Links" description="Links shown in the footer. Leave empty to hide.">
              <Field label="Instagram URL"><TextInput value={data.instagramUrl} onChange={v => setData({ ...data, instagramUrl: v })} placeholder="https://instagram.com/your-handle" /></Field>
              <Field label="Facebook URL"><TextInput value={data.facebookUrl} onChange={v => setData({ ...data, facebookUrl: v })} placeholder="https://facebook.com/your-page" /></Field>
              <Field label="TikTok URL"><TextInput value={data.tiktokUrl} onChange={v => setData({ ...data, tiktokUrl: v })} placeholder="https://tiktok.com/@your-handle" /></Field>
              <SaveButton onClick={handleSave} saving={saving} />
            </SectionCard>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
