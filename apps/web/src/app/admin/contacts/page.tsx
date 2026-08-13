'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  adminResponse?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactStats {
  total: number;
  pending: number;
  read: number;
  replied: number;
  archived: number;
}

const statusOptions: DropdownOption[] = [
  { value: '', label: 'All Statuses', icon: 'list' },
  { value: 'pending', label: 'Pending', icon: 'clock', color: 'yellow' },
  { value: 'read', label: 'Read', icon: 'eye', color: 'blue' },
  { value: 'replied', label: 'Replied', icon: 'check-circle', color: 'green' },
  { value: 'archived', label: 'Archived', icon: 'archive', color: 'gray' },
];

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ contactId: string; action: string } | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });

  const fetchContacts = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filterStatus && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/v1/contacts?${params}`, {
        headers: {
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        // Handle wrapped response from backend interceptor
        const data = responseData.data || responseData;
        setContacts(data.contacts || []);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
        }));
      } else {
        toast.error('Failed to fetch contacts');
      }
    } catch {
      toast.error('Error fetching contacts');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/contacts/stats', {
        headers: {
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        // Handle wrapped response from backend interceptor
        const data = responseData.data || responseData;
        setStats(data);
      }
    } catch {
      // non-critical — stats are supplementary
    }
  }, []);

  useEffect(() => {
    fetchContacts(pagination.currentPage);
    fetchStats();
  }, [fetchContacts, fetchStats]);

  const handleStatusChange = (value: string | string[]) => {
    setFilterStatus(Array.isArray(value) ? value[0] : value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleViewDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailsModal(true);
    // Mark as read if pending
    if (contact.status === 'pending') {
      markAsRead(contact.id);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setUpdating(id);
      const response = await fetch(`/api/v1/contacts/${id}/read`, {
        method: 'PATCH',
        headers: {
        },
      });

      if (response.ok) {
        await fetchContacts();
        await fetchStats();
        if (selectedContact?.id === id) {
          setSelectedContact({ ...selectedContact, status: 'read' });
        }
      } else {
        toast.error('Failed to mark as read');
      }
    } catch (error) {
      toast.error('Error marking as read');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id);
      const response = await fetch(`/api/v1/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        await fetchContacts();
        await fetchStats();
        if (selectedContact?.id === id) {
          setSelectedContact({ ...selectedContact, status: status as any });
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    } finally {
      setUpdating(null);
    }
  };

  const handleRespond = (contact: Contact) => {
    setSelectedContact(contact);
    setResponseText(contact.adminResponse || '');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedContact || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setUpdating(selectedContact.id);
      const response = await fetch(`/api/v1/contacts/${selectedContact.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminResponse: responseText.trim(), status: 'replied' }),
      });

      if (response.ok) {
        toast.success('Response saved successfully');
        setShowResponseModal(false);
        setResponseText('');
        if (selectedContact) {
          setSelectedContact({ ...selectedContact, adminResponse: responseText.trim(), status: 'replied' });
        }
        await fetchContacts();
        await fetchStats();
      } else {
        toast.error('Failed to save response');
      }
    } catch (error) {
      toast.error('Error saving response');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = (contact: Contact) => {
    setPendingAction({ contactId: contact.id, action: 'delete' });
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!pendingAction) return;

    try {
      setUpdating(pendingAction.contactId);
      const response = await fetch(`/api/v1/contacts/${pendingAction.contactId}`, {
        method: 'DELETE',
        headers: {
        },
      });

      if (response.ok) {
        toast.success('Contact message deleted');
        await fetchContacts();
        await fetchStats();
      } else {
        toast.error('Failed to delete contact');
      }
    } catch (error) {
      toast.error('Error deleting contact');
    } finally {
      setUpdating(null);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      read: 'bg-primary-100 text-primary-800',
      replied: 'bg-green-100 text-green-800',
      archived: 'bg-neutral-100 text-neutral-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Messages"
            breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Messages' }]}
          />

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Icon name="envelope" className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-600">Total</p>
                    <p className="text-xl font-bold text-neutral-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Icon name="clock" className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-600">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Icon name="eye" className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-600">Read</p>
                    <p className="text-xl font-bold text-primary-600">{stats.read}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon name="check-circle" className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-600">Replied</p>
                    <p className="text-xl font-bold text-green-600">{stats.replied}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Icon name="archive" className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-600">Archived</p>
                    <p className="text-xl font-bold text-neutral-600">{stats.archived}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  placeholder="Search by name, email, subject..."
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                <Dropdown
                  options={statusOptions}
                  value={filterStatus}
                  onChange={handleStatusChange}
                  placeholder="Filter by status"
                  size="md"
                  variant="default"
                  className="w-full"
                  showCheckmark={false}
                />
              </div>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="min-w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={5} />)}</tbody></table>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="inbox" className="w-12 h-12 text-neutral-400 mx-auto" />
                <p className="mt-2 text-neutral-600">No contact messages found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-neutral-900">{contact.name}</div>
                            <div className="text-sm text-neutral-500">{contact.email}</div>
                            {contact.phone && (
                              <div className="text-sm text-neutral-500">{contact.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-900">{contact.subject}</div>
                          <div className="text-sm text-neutral-500 truncate max-w-xs">
                            {contact.message.length > 50 ? contact.message.substring(0, 50) + '...' : contact.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(contact.status)}`}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetails(contact)}
                              className="text-primary-600 hover:text-primary-900"
                              title="View Details"
                            >
                              <Icon name="view" className="w-5 h-5" />
                            </button>
                            {contact.status !== 'replied' && (
                              <button
                                onClick={() => handleRespond(contact)}
                                className="text-green-600 hover:text-green-900"
                                title="Respond"
                              >
                                <Icon name="reply" className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(contact)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                              disabled={updating === contact.id}
                            >
                              <Icon name="delete" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-t border-neutral-200">
                <div className="text-sm text-neutral-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchContacts(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchContacts(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedContact && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                <h2 className="text-base font-semibold text-neutral-900">Contact Message</h2>
                <button onClick={() => setShowDetailsModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">From</p>
                  <p className="text-base font-semibold text-neutral-900">{selectedContact.name}</p>
                  <p className="text-sm text-neutral-500">{selectedContact.email}</p>
                  {selectedContact.phone && <p className="text-sm text-neutral-500">{selectedContact.phone}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Subject</p>
                  <p className="text-sm font-medium text-neutral-900">{selectedContact.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Message</p>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status:</p>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedContact.status)}`}>
                    {selectedContact.status}
                  </span>
                </div>
                {selectedContact.adminResponse && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Admin Response</p>
                    <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedContact.adminResponse}</p>
                    </div>
                    {selectedContact.respondedAt && (
                      <p className="text-xs text-neutral-400 mt-1.5">Responded {new Date(selectedContact.respondedAt).toLocaleString()}</p>
                    )}
                  </div>
                )}
                <div className="flex gap-3 pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => { setShowDetailsModal(false); handleRespond(selectedContact); }}
                    className="btn-primary text-sm px-4 py-2"
                    disabled={selectedContact.status === 'replied'}
                  >
                    {selectedContact.adminResponse ? 'Update Response' : 'Respond'}
                  </button>
                  {selectedContact.status !== 'archived' && (
                    <button
                      onClick={() => { handleUpdateStatus(selectedContact.id, 'archived'); setShowDetailsModal(false); }}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Archive
                    </button>
                  )}
                  <button onClick={() => setShowDetailsModal(false)} className="btn-outline text-sm px-4 py-2 ml-auto">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedContact && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Reply to {selectedContact.name}</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">{selectedContact.subject}</p>
                </div>
                <button onClick={() => { setShowResponseModal(false); setResponseText(''); }} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-500 mb-1.5">Original message:</p>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Your Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={6}
                    className="textarea-field w-full"
                    placeholder="Type your response here..."
                  />
                </div>
                <div className="flex gap-3 pt-2 border-t border-neutral-100">
                  <button
                    onClick={handleSubmitResponse}
                    className="btn-primary text-sm px-4 py-2"
                    disabled={!responseText.trim() || updating === selectedContact.id}
                  >
                    {updating === selectedContact.id ? 'Saving...' : 'Send Response'}
                  </button>
                  <button onClick={() => { setShowResponseModal(false); setResponseText(''); }} className="btn-outline text-sm px-4 py-2">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setPendingAction(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Contact Message"
          message="Are you sure you want to delete this contact message? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}

