'use client';

import { useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeliverySettings {
  deliveryFee: string;
  freeDeliveryThreshold: string;
  isDeliveryEnabled: boolean;
}

export interface PaymentSettings {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIban: string;
  codEnabled: boolean;
}

export interface ContactSettings {
  adminEmail: string;
  adminWhatsapp: string;
}

export interface SocialSettings {
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
}

export interface StoreSettings {
  maintenanceMode: boolean;
}

export interface OrderSettings {
  minOrderAmount: string;
}

export interface NotificationBarSettings {
  isEnabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  speed: number;
  link: string;
}

// ─── Save utility ─────────────────────────────────────────────────────────────

export async function saveSettings(
  path: string,
  body: object,
  setSaving: (v: boolean) => void,
  onSuccess?: () => void,
) {
  setSaving(true);
  try {
    const r = await fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const msg = (Array.isArray(err.message) ? err.message[0] : err.message) || err.error || 'Failed to save';
      throw new Error(msg);
    }
    toast.success('Settings saved');
    onSuccess?.();
  } catch (e: any) {
    toast.error(e.message || 'Failed to save settings');
  } finally {
    setSaving(false);
  }
}

// ─── Shared UI components ─────────────────────────────────────────────────────

export function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div>
        <h4 className="text-sm font-medium text-neutral-900">{label}</h4>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
      </label>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
    />
  );
}

export function PkrInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-neutral-500 sm:text-sm">₨</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className="block w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      />
    </div>
  );
}

export function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-neutral-100">
      <button
        onClick={onClick}
        disabled={saving}
        className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
      >
        {saving ? (
          <><div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2" />Saving...</>
        ) : (
          <><Icon name="check" className="w-4 h-4 mr-2" />Save Settings</>
        )}
      </button>
    </div>
  );
}

export function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

export function SettingsLoader() {
  return (
    <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-neutral-200">
      <div className="flex items-center gap-3 text-neutral-400">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-500" />
        <span className="text-sm">Loading settings...</span>
      </div>
    </div>
  );
}

export function PreviewNotificationBar({ text, backgroundColor, textColor, speed }: {
  text: string; backgroundColor: string; textColor: string; speed: number;
}) {
  const items = useMemo(() => {
    if (!text) return [];
    const perCopy = text.length * 9 + 72;
    const setSize = Math.max(4, Math.ceil(5120 / perCopy));
    const half = Array(setSize).fill(text);
    return [...half, ...half];
  }, [text]);
  const duration = `${Math.max(10, Math.min(100, speed || 30))}s`;
  if (!text) return null;
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-error-400" />
        <span className="w-2 h-2 rounded-full bg-secondary-400" />
        <span className="w-2 h-2 rounded-full bg-primary-400" />
        <span className="text-xs text-neutral-400 ml-1">Live preview</span>
      </div>
      <div
        className="relative overflow-hidden w-full"
        style={{ backgroundColor, color: textColor, height: 44, '--nb-duration': duration } as React.CSSProperties}
      >
        <div className="nb-track">
          {items.map((t, i) => (
            <span key={i} className="inline-flex items-center flex-shrink-0 text-xs sm:text-sm font-medium" style={{ paddingInline: '2rem' }}>
              {t}
              <span style={{ marginLeft: '2rem', opacity: 0.35, fontWeight: 300 }}>|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
