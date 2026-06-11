'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import toast from 'react-hot-toast';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'delivery' | 'payment' | 'contact' | 'social' | 'store' | 'orders' | 'notification';

interface DeliverySettings {
  deliveryFee: string;
  freeDeliveryThreshold: string;
  isDeliveryEnabled: boolean;
}

interface PaymentSettings {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIban: string;
  codEnabled: boolean;
}

interface ContactSettings {
  adminEmail: string;
  adminWhatsapp: string;
}

interface SocialSettings {
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
}

interface StoreSettings {
  maintenanceMode: boolean;
}

interface OrderSettings {
  minOrderAmount: string;
}

interface NotificationBarSettings {
  isEnabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  speed: number;
}

// ─── Notification bar preview ────────────────────────────────────────────────

function PreviewNotificationBar({ text, backgroundColor, textColor, speed }: {
  text: string; backgroundColor: string; textColor: string; speed: number;
}) {
  const copies = useMemo(() => {
    if (!text) return [];
    const len = text.length;
    const n = len < 20 ? 8 : len < 50 ? 6 : len < 100 ? 4 : len < 200 ? 3 : 2;
    return Array(n).fill(text);
  }, [text]);
  const duration = `${Math.max(10, Math.min(100, speed || 50))}s`;
  const translatePct = `${-(100 / copies.length)}%`;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Live Preview</h4>
      <div className="w-full overflow-hidden">
        <div className="relative overflow-hidden w-full" style={{ backgroundColor, color: textColor, height: 48 }}>
          <div className="flex items-center h-full relative w-full overflow-hidden">
            <div
              className="flex items-center whitespace-nowrap"
              style={{
                display: 'inline-flex',
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                alignItems: 'center',
                animation: `nb-scroll ${duration} linear infinite`,
              }}
            >
              {copies.map((t, i) => (
                <span key={i} className="px-6 text-sm font-medium flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes nb-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(${translatePct}); }
        }
      `}</style>
    </div>
  );
}

// ─── Shared components ───────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
      </label>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
    />
  );
}

function PkrInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">₨</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
      />
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100">
      <button
        onClick={onClick}
        disabled={saving}
        className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('delivery');
  const [saving, setSaving] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const fetchedTabs = useRef<Set<Tab>>(new Set());

  const [delivery, setDelivery] = useState<DeliverySettings | null>(null);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [social, setSocial] = useState<SocialSettings | null>(null);
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [orders, setOrders] = useState<OrderSettings | null>(null);
  const [notification, setNotification] = useState<NotificationBarSettings | null>(null);

  // backend_token sent automatically via HttpOnly cookie
  const authHeader = useCallback(() => '', []);

  const fetchTab = useCallback(async (tab: Tab) => {
    if (fetchedTabs.current.has(tab)) return;
    setTabLoading(true);
    try {
      const headers = { Authorization: authHeader() };
      switch (tab) {
        case 'delivery': {
          const r = await fetch('/api/v1/settings/delivery', { headers });
          if (!r.ok) throw new Error();
          const d = await r.json();
          setDelivery({
            deliveryFee: d.deliveryFee != null ? String(d.deliveryFee) : '',
            freeDeliveryThreshold: d.freeDeliveryThreshold != null ? String(d.freeDeliveryThreshold) : '',
            isDeliveryEnabled: Boolean(d.isDeliveryEnabled),
          });
          break;
        }
        case 'payment': {
          const r = await fetch('/api/v1/settings/payment', { headers });
          if (!r.ok) throw new Error();
          const d = await r.json();
          setPayment({
            bankName: d.bankName ?? '',
            bankAccountName: d.bankAccountName ?? '',
            bankAccountNumber: d.bankAccountNumber ?? '',
            bankIban: d.bankIban ?? '',
            codEnabled: Boolean(d.codEnabled),
          });
          break;
        }
        case 'contact': {
          const r = await fetch('/api/v1/settings/contact', { headers });
          if (!r.ok) throw new Error();
          const d = await r.json();
          setContact({ adminEmail: d.adminEmail ?? '', adminWhatsapp: d.adminWhatsapp ?? '' });
          break;
        }
        case 'social': {
          const r = await fetch('/api/v1/settings/social', { headers });
          if (!r.ok) throw new Error();
          const d = await r.json();
          setSocial({ instagramUrl: d.instagramUrl ?? '', facebookUrl: d.facebookUrl ?? '', tiktokUrl: d.tiktokUrl ?? '' });
          break;
        }
        case 'store': {
          const r = await fetch('/api/v1/settings/store', { headers });
          if (!r.ok) throw new Error();
          const d = await r.json();
          setStore({ maintenanceMode: Boolean(d.maintenanceMode) });
          break;
        }
        case 'orders': {
          const r = await fetch('/api/v1/settings/orders', { headers });
          if (!r.ok) throw new Error();
          const d = await r.json();
          setOrders({ minOrderAmount: d.minOrderAmount != null ? String(d.minOrderAmount) : '' });
          break;
        }
        case 'notification': {
          const r = await fetch('/api/v1/settings/notification-bar', { headers });
          if (!r.ok) throw new Error();
          const d = await r.json();
          const s = d.data || d;
          setNotification({
            isEnabled: Boolean(s.isEnabled),
            text: s.text ?? '',
            backgroundColor: s.backgroundColor ?? '',
            textColor: s.textColor ?? '',
            speed: typeof s.speed === 'number' ? s.speed : 50,
          });
          break;
        }
      }
      fetchedTabs.current.add(tab);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setTabLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchTab(activeTab); }, [activeTab, fetchTab]);

  const switchTab = (tab: Tab) => { setActiveTab(tab); };

  // ─── Save handlers ──────────────────────────────────────────────────────────

  const save = async (path: string, body: object) => {
    setSaving(true);
    try {
      const r = await fetch(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to save');
      }
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveDelivery = () => delivery && save('/api/v1/settings/delivery', {
    deliveryFee: parseFloat(delivery.deliveryFee) || 0,
    freeDeliveryThreshold: parseFloat(delivery.freeDeliveryThreshold) || 0,
    isDeliveryEnabled: delivery.isDeliveryEnabled,
  });

  const savePayment = () => payment && save('/api/v1/settings/payment', payment);
  const saveContact = () => contact && save('/api/v1/settings/contact', contact);
  const saveSocial = () => social && save('/api/v1/settings/social', social);
  const saveStore = () => store && save('/api/v1/settings/store', store);
  const saveOrders = () => orders && save('/api/v1/settings/orders', {
    minOrderAmount: parseFloat(orders.minOrderAmount) || 0,
  });
  const saveNotification = () => notification && save('/api/v1/settings/notification-bar', {
    isEnabled: notification.isEnabled,
    text: notification.text,
    backgroundColor: notification.backgroundColor,
    textColor: notification.textColor,
    speed: notification.speed,
  });

  // ─── Tabs config ─────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'delivery', label: 'Delivery' },
    { id: 'payment', label: 'Payment' },
    { id: 'contact', label: 'Contact' },
    { id: 'social', label: 'Social Links' },
    { id: 'store', label: 'Store' },
    { id: 'orders', label: 'Orders' },
    { id: 'notification', label: 'Notification Bar' },
  ];

  const isLoading = tabLoading || (
    activeTab === 'delivery' ? delivery === null :
    activeTab === 'payment' ? payment === null :
    activeTab === 'contact' ? contact === null :
    activeTab === 'social' ? social === null :
    activeTab === 'store' ? store === null :
    activeTab === 'orders' ? orders === null :
    notification === null
  );

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-500 text-sm mt-1">Configure all application settings</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-1 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent" />
                <span className="text-sm">Loading settings...</span>
              </div>
            </div>
          ) : (
            <>
              {/* ── Delivery ── */}
              {activeTab === 'delivery' && delivery && (
                <SectionCard title="Delivery Configuration" description="Configure delivery fees and availability">
                  <Toggle
                    checked={delivery.isDeliveryEnabled}
                    onChange={(v) => setDelivery({ ...delivery, isDeliveryEnabled: v })}
                    label="Enable Delivery Service"
                    description="Turn delivery on or off for all orders"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Delivery Fee (₨)" hint="Standard fee charged per order">
                      <PkrInput
                        value={delivery.deliveryFee}
                        onChange={(v) => setDelivery({ ...delivery, deliveryFee: v })}
                        placeholder="Enter delivery fee"
                      />
                    </Field>
                    <Field label="Free Delivery Threshold (₨)" hint="Orders above this amount get free delivery">
                      <PkrInput
                        value={delivery.freeDeliveryThreshold}
                        onChange={(v) => setDelivery({ ...delivery, freeDeliveryThreshold: v })}
                        placeholder="Enter threshold amount"
                      />
                    </Field>
                  </div>
                  <SaveButton onClick={saveDelivery} saving={saving} />
                </SectionCard>
              )}

              {/* ── Payment ── */}
              {activeTab === 'payment' && payment && (
                <SectionCard title="Payment Configuration" description="Bank account details shown to customers at checkout">
                  <Toggle
                    checked={payment.codEnabled}
                    onChange={(v) => setPayment({ ...payment, codEnabled: v })}
                    label="Cash on Delivery"
                    description="Allow customers to pay with cash on delivery"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Bank Name" hint="Name of the bank">
                      <TextInput value={payment.bankName} onChange={(v) => setPayment({ ...payment, bankName: v })} placeholder="e.g. Allied Bank Limited" />
                    </Field>
                    <Field label="Account Holder Name" hint="Name on the bank account">
                      <TextInput value={payment.bankAccountName} onChange={(v) => setPayment({ ...payment, bankAccountName: v })} placeholder="e.g. Khaalis Harvest" />
                    </Field>
                    <Field label="Account Number" hint="Bank account number">
                      <TextInput value={payment.bankAccountNumber} onChange={(v) => setPayment({ ...payment, bankAccountNumber: v })} placeholder="Enter account number" />
                    </Field>
                    <Field label="IBAN" hint="International Bank Account Number">
                      <TextInput value={payment.bankIban} onChange={(v) => setPayment({ ...payment, bankIban: v })} placeholder="e.g. PK36ABPA0000001234567890" />
                    </Field>
                  </div>
                  <SaveButton onClick={savePayment} saving={saving} />
                </SectionCard>
              )}

              {/* ── Contact ── */}
              {activeTab === 'contact' && contact && (
                <SectionCard title="Contact Configuration" description="Admin contact details used for notifications and customer support">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Admin Email" hint="Order notification emails are sent here">
                      <TextInput value={contact.adminEmail} onChange={(v) => setContact({ ...contact, adminEmail: v })} placeholder="admin@example.com" type="email" />
                    </Field>
                    <Field label="Admin WhatsApp" hint="Shown to customers for order support">
                      <TextInput value={contact.adminWhatsapp} onChange={(v) => setContact({ ...contact, adminWhatsapp: v })} placeholder="+923001234567" />
                    </Field>
                  </div>
                  <SaveButton onClick={saveContact} saving={saving} />
                </SectionCard>
              )}

              {/* ── Social ── */}
              {activeTab === 'social' && social && (
                <SectionCard title="Social Links" description="Links shown in the footer. Leave empty to hide.">
                  <div className="space-y-4">
                    <Field label="Instagram URL">
                      <TextInput value={social.instagramUrl} onChange={(v) => setSocial({ ...social, instagramUrl: v })} placeholder="https://instagram.com/your-handle" />
                    </Field>
                    <Field label="Facebook URL">
                      <TextInput value={social.facebookUrl} onChange={(v) => setSocial({ ...social, facebookUrl: v })} placeholder="https://facebook.com/your-page" />
                    </Field>
                    <Field label="TikTok URL">
                      <TextInput value={social.tiktokUrl} onChange={(v) => setSocial({ ...social, tiktokUrl: v })} placeholder="https://tiktok.com/@your-handle" />
                    </Field>
                  </div>
                  <SaveButton onClick={saveSocial} saving={saving} />
                </SectionCard>
              )}

              {/* ── Store ── */}
              {activeTab === 'store' && store && (
                <SectionCard title="Store Configuration" description="Control overall store availability">
                  <Toggle
                    checked={store.maintenanceMode}
                    onChange={(v) => setStore({ maintenanceMode: v })}
                    label="Maintenance Mode"
                    description="When enabled, customers see a maintenance message and cannot place orders"
                  />
                  {store.maintenanceMode && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">Store is in maintenance mode — customers cannot place orders</p>
                    </div>
                  )}
                  <SaveButton onClick={saveStore} saving={saving} />
                </SectionCard>
              )}

              {/* ── Orders ── */}
              {activeTab === 'orders' && orders && (
                <SectionCard title="Order Configuration" description="Rules applied to every order">
                  <div className="max-w-sm">
                    <Field label="Minimum Order Amount (₨)" hint="Orders below this amount will be rejected">
                      <PkrInput
                        value={orders.minOrderAmount}
                        onChange={(v) => setOrders({ minOrderAmount: v })}
                        placeholder="Enter minimum order amount"
                      />
                    </Field>
                  </div>
                  <SaveButton onClick={saveOrders} saving={saving} />
                </SectionCard>
              )}

              {/* ── Notification Bar ── */}
              {activeTab === 'notification' && notification && (
                <SectionCard title="Notification Bar" description="Configure the scrolling announcement bar at the top of the website">
                  <Toggle
                    checked={notification.isEnabled}
                    onChange={(v) => setNotification({ ...notification, isEnabled: v })}
                    label="Enable Notification Bar"
                    description="Show or hide the scrolling announcement bar"
                  />
                  <Field label="Announcement Text" hint={`${notification.text.length}/1000 characters`}>
                    <textarea
                      value={notification.text}
                      onChange={(e) => setNotification({ ...notification, text: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm resize-y"
                      placeholder="Enter your announcement message..."
                      rows={3}
                      maxLength={1000}
                    />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Background Color">
                      <div className="flex items-center space-x-3">
                        <input type="color" value={notification.backgroundColor || '#FF6B35'} onChange={(e) => setNotification({ ...notification, backgroundColor: e.target.value })} className="h-10 w-16 border border-gray-300 rounded cursor-pointer" />
                        <TextInput value={notification.backgroundColor} onChange={(v) => setNotification({ ...notification, backgroundColor: v })} placeholder="#FF6B35" />
                      </div>
                    </Field>
                    <Field label="Text Color">
                      <div className="flex items-center space-x-3">
                        <input type="color" value={notification.textColor || '#FFFFFF'} onChange={(e) => setNotification({ ...notification, textColor: e.target.value })} className="h-10 w-16 border border-gray-300 rounded cursor-pointer" />
                        <TextInput value={notification.textColor} onChange={(v) => setNotification({ ...notification, textColor: v })} placeholder="#FFFFFF" />
                      </div>
                    </Field>
                  </div>
                  <Field label={`Scroll Speed: ${notification.speed} (10 = Fast, 100 = Slow)`}>
                    <input type="range" min="10" max="100" value={notification.speed} onChange={(e) => setNotification({ ...notification, speed: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Fast</span><span>Slow</span></div>
                  </Field>
                  {notification.isEnabled && notification.text && (
                    <PreviewNotificationBar text={notification.text} backgroundColor={notification.backgroundColor || '#FF6B35'} textColor={notification.textColor || '#FFFFFF'} speed={notification.speed} />
                  )}
                  <SaveButton onClick={saveNotification} saving={saving} />
                </SectionCard>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
