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
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      id: 'addresses',
      label: 'Addresses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
  ] as const;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">My Account</h1>
          <p className="text-neutral-600 mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors flex items-center gap-3 min-h-[44px] ${
                    activeTab === tab.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              <hr className="my-2" />
              <Link href="/orders" className="w-full text-left px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 flex items-center gap-3 min-h-[44px]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                My Orders
              </Link>
              <Link href="/wishlist" className="w-full text-left px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 flex items-center gap-3 min-h-[44px]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                Wishlist
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 rounded-xl text-error-600 hover:bg-error-50 flex items-center gap-3 min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Personal Information</h2>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Saved Addresses</h2>
                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <div className="flex justify-center mb-3">
                      <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <p>No saved addresses yet. Add one during checkout.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((addr: any) => (
                      <div key={addr.id} className="border border-neutral-200 rounded-xl p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-900">{addr.fullName}</span>
                            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full capitalize">{addr.type}</span>
                            {addr.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-sm text-neutral-600">{addr.addressLine1}</p>
                          <p className="text-sm text-neutral-600">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-sm text-neutral-500">{addr.phone}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-error-400 hover:text-error-600 text-sm"
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Security Settings</h2>
                <div className="space-y-4">
                  <div className="border border-neutral-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-neutral-900">Password</h3>
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
