'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import toast from 'react-hot-toast';

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

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(filterStatus && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/v1/contacts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        // Handle wrapped response from backend interceptor
        const data = responseData.data || responseData;
        setContacts(data.contacts || []);
        setPagination({
          ...pagination,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
        });
      } else {
        toast.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Error fetching contacts');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filterStatus, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/contacts/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        // Handle wrapped response from backend interceptor
        const data = responseData.data || responseData;
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [fetchContacts, fetchStats]);

  const handleStatusChange = (value: string | string[]) => {
    setFilterStatus(Array.isArray(value) ? value[0] : value);
    setPagination({ ...pagination, currentPage: 1 });
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
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
        body: JSON.stringify({ adminResponse: responseText.trim() }),
      });

      if (response.ok) {
        toast.success('Response saved successfully');
        setShowResponseModal(false);
        setResponseText('');
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
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
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
      read: 'bg-blue-100 text-blue-800',
      replied: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-gray-600">Manage and respond to customer inquiries</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon name="envelope" className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Icon name="clock" className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon name="eye" className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Read</p>
                    <p className="text-xl font-bold text-blue-600">{stats.read}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon name="check-circle" className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Replied</p>
                    <p className="text-xl font-bold text-green-600">{stats.replied}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon name="archive" className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Archived</p>
                    <p className="text-xl font-bold text-gray-600">{stats.archived}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination({ ...pagination, currentPage: 1 });
                  }}
                  placeholder="Search by name, email, subject..."
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <Icon name="spinner" className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                <p className="mt-2 text-gray-600">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="inbox" className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-600">No contact messages found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                            {contact.phone && (
                              <div className="text-sm text-gray-500">{contact.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{contact.subject}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {contact.message.substring(0, 50)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(contact.status)}`}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetails(contact)}
                              className="text-blue-600 hover:text-blue-900"
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
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Contact Message Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="x-mark" className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">From</h3>
                  <p className="text-lg font-medium text-gray-900">{selectedContact.name}</p>
                  <p className="text-sm text-gray-600">{selectedContact.email}</p>
                  {selectedContact.phone && (
                    <p className="text-sm text-gray-600">{selectedContact.phone}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                  <p className="text-lg text-gray-900">{selectedContact.subject}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Message</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedContact.status)}`}>
                    {selectedContact.status}
                  </span>
                </div>
                {selectedContact.adminResponse && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Admin Response</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.adminResponse}</p>
                    {selectedContact.respondedAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        Responded on {new Date(selectedContact.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleRespond(selectedContact);
                    }}
                    className="btn-primary"
                    disabled={selectedContact.status === 'replied'}
                  >
                    {selectedContact.adminResponse ? 'Update Response' : 'Respond'}
                  </button>
                  {selectedContact.status !== 'archived' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedContact.id, 'archived');
                        setShowDetailsModal(false);
                      }}
                      className="btn-secondary"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Respond to {selectedContact.name}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={6}
                    className="textarea-field w-full"
                    placeholder="Type your response here..."
                  />
                </div>
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSubmitResponse}
                    className="btn-primary"
                    disabled={!responseText.trim() || updating === selectedContact.id}
                  >
                    {updating === selectedContact.id ? 'Saving...' : 'Send Response'}
                  </button>
                  <button
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseText('');
                    }}
                    className="btn-secondary"
                  >
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

