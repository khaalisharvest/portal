'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { NotificationBarSettings, Toggle, Field, TextInput, SaveButton, SectionCard, SettingsLoader, PreviewNotificationBar, saveSettings } from '../_shared';

export default function NotificationBarSettingsPage() {
  const [data, setData] = useState<NotificationBarSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/settings/notification-bar', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const d = j.data ?? j;
        setData({ isEnabled: Boolean(d.isEnabled), text: d.text ?? '', backgroundColor: d.backgroundColor || '#FF6B35', textColor: d.textColor || '#FFFFFF', speed: typeof d.speed === 'number' ? d.speed : 50, link: d.link ?? '' });
      });
  }, []);

  const handleSave = () => data && saveSettings('/api/v1/settings/notification-bar', data, setSaving);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Notification Bar" breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings/delivery' }, { label: 'Notification Bar' }]} />
          {!data ? <SettingsLoader /> : (
            <SectionCard title="Notification Bar" description="Configure the scrolling announcement bar shown at the top of every customer page">
              <Toggle checked={data.isEnabled} onChange={v => setData({ ...data, isEnabled: v })}
                label="Enable Notification Bar" description="Show or hide the scrolling announcement bar on all customer pages" />
              <Field label="Announcement Text" hint={`${data.text.length}/1000 characters`}>
                <TextInput value={data.text} onChange={v => setData({ ...data, text: v })} placeholder="e.g. 🌿 Free delivery on orders over ₨2,000 — Shop now!" />
              </Field>
              <Field label="Link URL (optional)" hint="When set, clicking the bar opens this URL">
                <TextInput value={data.link} onChange={v => setData({ ...data, link: v })} placeholder="https://example.com/sale" />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Background Color">
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.backgroundColor} onChange={e => setData({ ...data, backgroundColor: e.target.value })} className="h-10 w-14 border border-neutral-300 rounded-lg cursor-pointer p-0.5 bg-white" />
                    <TextInput value={data.backgroundColor} onChange={v => setData({ ...data, backgroundColor: v })} placeholder="#FF6B35" />
                  </div>
                </Field>
                <Field label="Text Color">
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.textColor} onChange={e => setData({ ...data, textColor: e.target.value })} className="h-10 w-14 border border-neutral-300 rounded-lg cursor-pointer p-0.5 bg-white" />
                    <TextInput value={data.textColor} onChange={v => setData({ ...data, textColor: v })} placeholder="#FFFFFF" />
                  </div>
                </Field>
              </div>
              <Field label="Scroll Duration" hint={`${data.speed}s per cycle`}>
                <input type="range" min="10" max="100" value={data.speed} onChange={e => setData({ ...data, speed: parseInt(e.target.value) })} className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                <div className="flex justify-between text-xs text-neutral-400 mt-1"><span>Faster (10s)</span><span>Slower (100s)</span></div>
              </Field>
              {data.text && (
                <div className={data.isEnabled ? '' : 'opacity-50 pointer-events-none'}>
                  {!data.isEnabled && <p className="text-xs text-neutral-400 mb-2">Preview (bar is currently disabled)</p>}
                  <PreviewNotificationBar text={data.text} backgroundColor={data.backgroundColor} textColor={data.textColor} speed={data.speed} />
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
