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
  const [addresses, setAddresses] = useState<any[]>([]);

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Keep profile form in sync when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/v1/orders/addresses', {
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : (data.data || []));
      }
    } catch {}
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setProfileLoading(true);
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileForm.name.trim(), email: profileForm.email || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      const data = await res.json();
      const updated = data.data || data;
      // Update stored user so AuthContext reflects the new name/email
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, name: updated.name, email: updated.email }));
      }
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to change password');
      }
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await fetch(`/api/v1/orders/addresses/${addressId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAddresses(prev => prev.filter((a: any) => a.id !== addressId));
        toast.success('Address removed');
      } else {
        toast.error('Failed to remove address');
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
          <div className="lg:col-span-3 space-y-4">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Personal Information</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Your full name"
                      minLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email <span className="text-neutral-400 font-normal">(optional)</span></label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="your@email.com"
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
                  <button type="submit" disabled={profileLoading} className="btn-primary disabled:opacity-50">
                    {profileLoading ? 'Saving...' : 'Save Changes'}
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
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="font-medium text-neutral-900">Change Password</h3>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPasswords.current
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                          }
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
                        placeholder="Min. 8 characters"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPasswords.new
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                          }
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12 ${
                          passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                            ? 'border-red-400'
                            : 'border-neutral-300'
                        }`}
                        placeholder="Repeat new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPasswords.confirm
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                          }
                        </svg>
                      </button>
                    </div>
                    {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={passwordLoading || (!!passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword)}
                    className="btn-primary disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
