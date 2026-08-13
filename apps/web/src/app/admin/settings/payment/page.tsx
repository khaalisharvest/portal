'use client';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { PaymentSettings, Toggle, Field, TextInput, SaveButton, SectionCard, SettingsLoader, saveSettings } from '../_shared';

export default function PaymentSettingsPage() {
  const [data, setData] = useState<PaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/settings/payment', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const d = j.data ?? j;
        setData({ bankName: d.bankName ?? '', bankAccountName: d.bankAccountName ?? '', bankAccountNumber: d.bankAccountNumber ?? '', bankIban: d.bankIban ?? '', codEnabled: Boolean(d.codEnabled) });
      });
  }, []);

  const handleSave = () => data && saveSettings('/api/v1/settings/payment', data, setSaving);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Payment" breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings/delivery' }, { label: 'Payment' }]} />
          {!data ? <SettingsLoader /> : (
            <SectionCard title="Payment Configuration" description="Bank account details shown to customers at checkout">
              <Toggle checked={data.codEnabled} onChange={v => setData({ ...data, codEnabled: v })}
                label="Cash on Delivery" description="Allow customers to pay with cash on delivery" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Bank Name" hint="Name of the bank">
                  <TextInput value={data.bankName} onChange={v => setData({ ...data, bankName: v })} placeholder="e.g. Allied Bank Limited" />
                </Field>
                <Field label="Account Holder Name">
                  <TextInput value={data.bankAccountName} onChange={v => setData({ ...data, bankAccountName: v })} placeholder="e.g. Khaalis Harvest" />
                </Field>
                <Field label="Account Number">
                  <TextInput value={data.bankAccountNumber} onChange={v => setData({ ...data, bankAccountNumber: v })} placeholder="Enter account number" />
                </Field>
                <Field label="IBAN">
                  <TextInput value={data.bankIban} onChange={v => setData({ ...data, bankIban: v })} placeholder="e.g. PK36ABPA0000001234567890" />
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
