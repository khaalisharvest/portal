'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';

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
  order_status_updated: 'bg-blue-100 text-blue-700',
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

  // Edit state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', password: '' });

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const toggleStatus = async (id: string, isActive: boolean, name: string) => {
    const action = isActive ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} ${name}?`)) return;
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
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
              <p className="text-gray-500 text-sm mt-1">Manage staff members and monitor their activity</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-green-500 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-green-600"
            >
              <Icon name="plus" className="w-4 h-4 mr-2" />
              Add Staff
            </button>
          </div>

          {/* Staff Grid */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Staff Members ({staff.length})</h3>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" /></div>
            ) : staff.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-sm">No staff members yet. Add your first staff member above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleStaffFilter(selectedStaff === member.id ? null : member.id)}
                    className={`bg-white rounded-lg border p-5 cursor-pointer transition-all ${selectedStaff === member.id ? 'border-orange-400 ring-1 ring-orange-400' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.phone}</p>
                          {member.email && <p className="text-xs text-gray-400 truncate">{member.email}</p>}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{member.totalActions} actions</span>
                      <span>{member.lastActionAt ? timeAgo(member.lastActionAt) : 'No activity'}</span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(member); }}
                        className="text-xs px-3 py-1 rounded-full border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
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
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {activityLoading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" /></div>
              ) : activity.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">No activity recorded yet</div>
              ) : (
                activity.map(entry => (
                  <div key={entry.id} className="flex items-start px-5 py-3 space-x-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-green-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
                      {getInitials(entry.staffName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="font-medium text-gray-900 text-sm">{entry.staffName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-600'}`}>
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                        {entry.entityLabel && (
                          <span className="text-xs text-gray-500 truncate">· {entry.entityLabel}</span>
                        )}
                        {entry.details?.to && (
                          <span className="text-xs text-gray-400">→ {entry.details.to}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">New Staff Member</h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Staff member name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="+923001234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="staff@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Min. 6 characters" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleAddStaff} disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-green-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Staff Member</h3>
                <button onClick={() => { setShowEditForm(false); setEditingMember(null); }} className="text-gray-400 hover:text-gray-600">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="+923001234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                  </label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Min. 6 characters" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button onClick={() => { setShowEditForm(false); setEditingMember(null); }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleEditStaff} disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-green-500 rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
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
