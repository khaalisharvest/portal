'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import PasswordHint from '@/components/ui/PasswordHint';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonCard } from '@/components/admin/AdminSkeletonRow';

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  lastLoginAt?: string;
  totalActions: number;
  lastActionAt?: string;
}

interface ActivityEntry {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  details?: Record<string, any>;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  order_status_updated: 'Updated order status',
  product_created: 'Created product',
  product_updated: 'Updated product',
  product_deleted: 'Deleted product',
  inventory_updated: 'Updated inventory',
};

const ACTION_COLORS: Record<string, string> = {
  order_status_updated: 'bg-primary-100 text-primary-700',
  product_created: 'bg-green-100 text-green-700',
  product_updated: 'bg-yellow-100 text-yellow-700',
  product_deleted: 'bg-red-100 text-red-700',
  inventory_updated: 'bg-purple-100 text-purple-700',
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; name: string; action: string; onConfirm: () => void }>({ open: false, name: '', action: '', onConfirm: () => {} });

  // Edit state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', password: '' });

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Set password state
  const [setPasswordModal, setSetPasswordModal] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/admin/staff');
      if (r.ok) {
        const json = await r.json();
        setStaff(Array.isArray(json) ? json : (json.data ?? []));
      }
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, []);

  const fetchActivity = useCallback(async (staffId?: string) => {
    setActivityLoading(true);
    try {
      const url = staffId
        ? `/api/v1/admin/staff/${staffId}/activity`
        : '/api/v1/admin/staff/activity';
      const r = await fetch(url);
      if (r.ok) {
        const json = await r.json();
        const payload = json.data ?? json;
        setActivity(Array.isArray(payload) ? payload : (payload.logs ?? []));
      }
    } catch { /* non-critical */ }
    finally { setActivityLoading(false); }
  }, []);

  useEffect(() => { fetchStaff(); fetchActivity(); }, [fetchStaff, fetchActivity]);

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', password: '' });
    setShowAddForm(false);
  };

  const handleAddStaff = async () => {
    if (!form.name || !form.phone || !form.password) {
      toast.error('Name, phone, and password are required');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/v1/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        toast.success('Staff member added');
        resetForm();
        fetchStaff();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Failed to add staff');
      }
    } catch { toast.error('Failed to add staff'); }
    finally { setSaving(false); }
  };

  const doToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const r = await fetch(`/api/v1/admin/staff/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (r.ok) {
        toast.success(isActive ? 'Staff activated' : 'Staff deactivated');
        fetchStaff();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Failed to update status');
      }
    } catch { toast.error('Failed to update status'); }
  };

  const toggleStatus = (id: string, isActive: boolean, name: string) => {
    const action = isActive ? 'activate' : 'deactivate';
    setStatusDialog({
      open: true,
      name,
      action,
      onConfirm: () => {
        setStatusDialog(s => ({ ...s, open: false }));
        doToggleStatus(id, isActive);
      },
    });
  };

  const handleSetPassword = async () => {
    if (!setPasswordModal) return;
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setPasswordError('');
    setPasswordLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${setPasswordModal.id}/set-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || 'Failed to set password');
        setPasswordError(msg);
        return;
      }
      toast.success(`Password updated for ${setPasswordModal.name}`);
      setSetPasswordModal(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch {
      setPasswordError('Connection error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const openEdit = (member: StaffMember) => {
    setEditingMember(member);
    setEditForm({ name: member.name, phone: member.phone, email: member.email || '', password: '' });
    setShowEditForm(true);
  };

  const handleEditStaff = async () => {
    if (!editingMember || !editForm.name || !editForm.phone) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const body: any = { name: editForm.name, phone: editForm.phone, email: editForm.email || undefined };
      if (editForm.password) body.password = editForm.password;
      const r = await fetch(`/api/v1/admin/staff/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        toast.success('Staff member updated');
        setShowEditForm(false);
        setEditingMember(null);
        fetchStaff();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Failed to update staff');
      }
    } catch { toast.error('Failed to update staff'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deletingMember) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/v1/admin/staff/${deletingMember.id}`, {
        method: 'DELETE',
      });
      if (r.ok) {
        toast.success('Staff member deleted');
        setShowDeleteConfirm(false);
        setDeletingMember(null);
        fetchStaff();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Failed to delete staff');
      }
    } catch { toast.error('Failed to delete staff'); }
    finally { setDeleting(false); }
  };

  const handleStaffFilter = (staffId: string | null) => {
    setSelectedStaff(staffId);
    fetchActivity(staffId || undefined);
  };

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Staff"
            breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Staff' }]}
            action={
              <button onClick={() => setShowAddForm(true)} className="btn-primary text-sm px-4 py-2">
                + Add Staff
              </button>
            }
          />

          <ConfirmationDialog
            isOpen={statusDialog.open}
            onClose={() => setStatusDialog(s => ({ ...s, open: false }))}
            onConfirm={statusDialog.onConfirm}
            title={`${statusDialog.action === 'activate' ? 'Activate' : 'Deactivate'} staff member?`}
            message={`Are you sure you want to ${statusDialog.action} ${statusDialog.name}?`}
            confirmText={statusDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
            type={statusDialog.action === 'activate' ? 'info' : 'warning'}
          />

          {/* Staff Grid */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">Staff Members ({staff.length})</h3>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <AdminSkeletonCard key={i} />)}
              </div>
            ) : staff.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                <p className="text-neutral-500 text-sm">No staff members yet. Add your first staff member above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleStaffFilter(selectedStaff === member.id ? null : member.id)}
                    className={`bg-white rounded-lg border p-5 cursor-pointer transition-all ${selectedStaff === member.id ? 'border-orange-400 ring-1 ring-orange-400' : 'border-neutral-200 hover:border-neutral-300'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 text-sm truncate">{member.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{member.phone}</p>
                          {member.email && <p className="text-xs text-neutral-400 truncate">{member.email}</p>}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                      <span className="font-medium text-neutral-700">{member.totalActions} actions</span>
                      <span>{member.lastActionAt ? timeAgo(member.lastActionAt) : 'No activity'}</span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(member); }}
                        className="text-xs px-3 py-1 rounded-full border border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingMember(member); setShowDeleteConfirm(true); }}
                        className="text-xs px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); toggleStatus(member.id, !member.isActive, member.name); }}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${member.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setSetPasswordModal({ id: member.id, name: member.name }); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                        className="text-xs px-3 py-1 rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-1"
                        title="Set Password"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Set Pwd
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-neutral-900">
                {selectedStaff
                  ? `Activity — ${staff.find(s => s.id === selectedStaff)?.name}`
                  : 'All Staff Activity'}
              </h3>
              {selectedStaff && (
                <button onClick={() => handleStaffFilter(null)} className="text-xs text-orange-600 hover:text-orange-700">
                  Show all →
                </button>
              )}
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
              {activityLoading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" /></div>
              ) : activity.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">No activity recorded yet</div>
              ) : (
                activity.map(entry => (
                  <div key={entry.id} className="flex items-start px-5 py-3 space-x-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-green-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
                      {getInitials(entry.staffName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="font-medium text-neutral-900 text-sm">{entry.staffName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[entry.action] || 'bg-neutral-100 text-neutral-600'}`}>
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                        {entry.entityLabel && (
                          <span className="text-xs text-neutral-500 truncate">· {entry.entityLabel}</span>
                        )}
                        {entry.details?.to && (
                          <span className="text-xs text-neutral-400">→ {entry.details.to}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add Staff Drawer */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black bg-opacity-40" onClick={resetForm} />
            <div className="w-full max-w-md bg-white flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">New Staff Member</h3>
                <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    placeholder="Staff member name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    placeholder="+923001234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    placeholder="staff@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                    placeholder="Min. 8 chars, upper + lower + number" />
                  <PasswordHint password={form.password} />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleAddStaff} disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Adding...' : 'Add Staff Member'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Drawer */}
        {showEditForm && editingMember && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black bg-opacity-40" onClick={() => { setShowEditForm(false); setEditingMember(null); }} />
            <div className="w-full max-w-md bg-white flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">Edit Staff Member</h3>
                <button onClick={() => { setShowEditForm(false); setEditingMember(null); }} className="text-neutral-400 hover:text-neutral-600">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    placeholder="+923001234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    New Password <span className="text-neutral-400 font-normal">(leave blank to keep current)</span>
                  </label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    placeholder="Min. 8 chars, upper + lower + number" />
                  <PasswordHint password={editForm.password} />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
                <button onClick={() => { setShowEditForm(false); setEditingMember(null); }}
                  className="px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
                <button onClick={handleEditStaff} disabled={saving}
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Set Password Modal */}
        {setPasswordModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Set New Password</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">For {setPasswordModal.name}</p>
                </div>
                <button onClick={() => setSetPasswordModal(null)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }}
                    className="input-field" placeholder="Min. 8 chars, upper + lower + number" />
                  <PasswordHint password={newPassword} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className={`input-field ${confirmPassword && confirmPassword !== newPassword ? 'input-error' : ''}`}
                    placeholder="Repeat password" />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="mt-1 text-xs text-error-600">Passwords do not match</p>
                  )}
                </div>
                {passwordError && (
                  <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-xl px-3 py-2">{passwordError}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={handleSetPassword} disabled={passwordLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="flex-1 btn-primary disabled:opacity-50">
                    {passwordLoading ? 'Saving…' : 'Set Password'}
                  </button>
                  <button onClick={() => { setSetPasswordModal(null); setPasswordError(''); }} className="flex-1 btn-outline">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => { setShowDeleteConfirm(false); setDeletingMember(null); }}
          onConfirm={confirmDelete}
          title="Delete Staff Member"
          message={`Are you sure you want to permanently delete "${deletingMember?.name}"? This cannot be undone.`}
          confirmText={deleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          type="danger"
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}
