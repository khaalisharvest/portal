'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}

function AccountContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/orders/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : data.data || []);
      }
    } catch {}
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/orders/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAddresses(prev => prev.filter((a: any) => a.id !== addressId));
        toast.success('Address removed');
      }
    } catch {
      toast.error('Failed to remove address');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ] as const;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">My Account</h1>
          <p className="text-neutral-600 mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-soft p-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors flex items-center gap-3 ${
                    activeTab === tab.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
              <hr className="my-2" />
              <Link href="/orders" className="w-full text-left px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 flex items-center gap-3">
                <span>📦</span> My Orders
              </Link>
              <Link href="/wishlist" className="w-full text-left px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 flex items-center gap-3">
                <span>❤️</span> Wishlist
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-6">Personal Information</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={user?.phone || ''}
                      disabled
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-neutral-400 mt-1">Phone number cannot be changed</p>
                  </div>
                  <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-6">Saved Addresses</h2>
                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p className="text-4xl mb-3">📍</p>
                    <p>No saved addresses yet. Add one during checkout.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((addr: any) => (
                      <div key={addr.id} className="border border-neutral-200 rounded-xl p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-800">{addr.fullName}</span>
                            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full capitalize">{addr.type}</span>
                            {addr.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-sm text-neutral-600">{addr.addressLine1}</p>
                          <p className="text-sm text-neutral-600">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-sm text-neutral-500">{addr.phone}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-6">Security Settings</h2>
                <div className="space-y-4">
                  <div className="border border-neutral-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-neutral-800">Password</h3>
                      <p className="text-sm text-neutral-500">Change your account password</p>
                    </div>
                    <Link href="/auth/forgot-password" className="btn-secondary text-sm">
                      Change Password
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
