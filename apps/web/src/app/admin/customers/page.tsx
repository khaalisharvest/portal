'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import PasswordHint from '@/components/ui/PasswordHint';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  orderStats?: {
    totalOrders: number;
    completedOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    pendingOrders: number;
  };
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

interface CustomerStats {
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    isActive: boolean;
    joinedAt: string;
    lastLoginAt?: string;
  };
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    pendingOrders: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{customerId: string, isActive: boolean, customerName: string} | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [setPasswordModal, setSetPasswordModal] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (pagination.currentPage || 1).toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/v1/admin/users/customers?${params}`, {
        headers: {
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        // Extract data from the response envelope
        const data = responseData.data || responseData;
        
        setCustomers(data.users || []);
        setPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          hasNextPage: data.hasNextPage || false,
          hasPrevPage: data.hasPrevPage || false
        });
      } else {
        toast.error(`Failed to fetch customers: ${response.status}`);
      }
    } catch {
      toast.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);


  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    
    // Use the customer data we already have from the list (includes orderStats and recentOrders)
    const customerStats = {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isActive: customer.isActive,
        joinedAt: customer.createdAt,
        lastLoginAt: customer.lastLoginAt
      },
      stats: customer.orderStats || {
        totalOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        pendingOrders: 0
      },
      recentOrders: customer.recentOrders || []
    };
    
    setCustomerStats(customerStats);
  };

  const handleUpdateStatus = async (customerId: string, isActive: boolean) => {
    try {
      setUpdating(customerId);
      const response = await fetch(`/api/v1/admin/users/${customerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast.success(`Customer ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchCustomers();
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer({ ...selectedCustomer, isActive });
        }
      } else {
        toast.error('Failed to update customer status');
      }
    } catch {
      toast.error('Error updating customer status');
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusUpdateClick = (customerId: string, isActive: boolean, customerName: string) => {
    setPendingAction({ customerId, isActive, customerName });
    setShowConfirmDialog(true);
  };

  const confirmStatusUpdate = async () => {
    if (pendingAction) {
      await handleUpdateStatus(pendingAction.customerId, pendingAction.isActive);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const cancelStatusUpdate = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
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

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Remove old filtering logic since we're now using server-side filtering

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-primary-100 text-primary-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Customers"
            breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Customers' }]}
          />

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Search</label>
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">
                All Customers ({pagination.total})
              </h3>
              <div className="text-sm text-neutral-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>

            {loading ? (
              <div className="overflow-x-auto">
                <table className="min-w-full"><tbody>{Array.from({ length: 6 }).map((_, i) => <AdminSkeletonRow key={i} cols={7} />)}</tbody></table>
              </div>
            ) : !customers || customers.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="user" className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-48">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {customers?.map((customer) => (
                      <tr key={customer.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">{customer.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">{customer.phone}</div>
                          {customer.email && (
                            <div className="text-sm text-neutral-500">{customer.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(customer.role)}`}>
                            {customer.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {customer.lastLoginAt ? (
                            <div>
                              <div className="text-neutral-900">{new Date(customer.lastLoginAt).toLocaleDateString()}</div>
                              <div className="text-neutral-500 text-xs">{new Date(customer.lastLoginAt).toLocaleTimeString()}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewDetails(customer)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-md transition-colors duration-200"
                              title="View Details"
                            >
                              <Icon name="eye" className="w-3 h-3 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => handleStatusUpdateClick(customer.id, !customer.isActive, customer.name)}
                              disabled={updating === customer.id}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 disabled:opacity-50 ${
                                customer.isActive
                                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                              title={customer.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {updating === customer.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-neutral-300 border-t-gray-600 mr-1"></div>
                              ) : (
                                <Icon name={customer.isActive ? 'user-minus' : 'user-plus'} className="w-3 h-3 mr-1" />
                              )}
                              {customer.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => { setSetPasswordModal({ id: customer.id, name: customer.name }); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                              className="text-xs font-medium text-neutral-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                              title="Set Password"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Set Password
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
              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-neutral-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="chevron-left" className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="chevron-right" className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details Modal */}
        {showDetailsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
            <div className="relative my-8 bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-4xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Customer — {selectedCustomer.name}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
                  >
                    <Icon name="close" className="h-5 w-5" />
                  </button>
                </div>

                {!customerStats ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-primary-500 mx-auto mb-4"></div>
                    <p className="text-neutral-500">Loading customer details...</p>
                  </div>
                ) : customerStats && customerStats.customer ? (
                  <div className="space-y-6">
                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Basic Information</h4>
                          <div className="space-y-2 text-sm text-neutral-700">
                            <p><span className="font-medium text-neutral-900">Name:</span> {customerStats.customer.name}</p>
                            <p><span className="font-medium text-neutral-900">Phone:</span> {customerStats.customer.phone}</p>
                            <p><span className="font-medium text-neutral-900">Email:</span> {customerStats.customer.email || 'Not provided'}</p>
                            <p className="flex items-center gap-2">
                              <span className="font-medium text-neutral-900">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${customerStats.customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {customerStats.customer.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                            <p><span className="font-medium text-neutral-900">Joined:</span> {new Date(customerStats.customer.joinedAt).toLocaleDateString()}</p>
                            <p><span className="font-medium text-neutral-900">Last Login:</span>{' '}
                              {customerStats.customer.lastLoginAt
                                ? <span className="text-green-600">{new Date(customerStats.customer.lastLoginAt).toLocaleString()}</span>
                                : <span className="text-neutral-400 italic">Never</span>}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Order Statistics</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-neutral-200">
                              <p className="text-xs text-neutral-500 mb-1">Total Orders</p>
                              <p className="text-2xl font-bold text-neutral-900">{customerStats.stats.totalOrders}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-neutral-200">
                              <p className="text-xs text-neutral-500 mb-1">Completed</p>
                              <p className="text-2xl font-bold text-green-600">{customerStats.stats.completedOrders}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-neutral-200">
                              <p className="text-xs text-neutral-500 mb-1">Total Spent</p>
                              <p className="text-xl font-bold text-primary-600">₨{Number(customerStats.stats.totalSpent).toFixed(0)}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-neutral-200">
                              <p className="text-xs text-neutral-500 mb-1">Avg Order</p>
                              <p className="text-xl font-bold text-purple-600">₨{Number(customerStats.stats.averageOrderValue).toFixed(0)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Recent Orders</h4>
                      {customerStats.recentOrders.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-neutral-200">
                          <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                              <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Order #</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Status</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Amount</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-100">
                              {customerStats.recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-neutral-50">
                                  <td className="px-5 py-3 text-sm font-medium text-neutral-900">{order.orderNumber}</td>
                                  <td className="px-5 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      'bg-primary-100 text-primary-700'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 text-sm text-neutral-700">₨{Number(order.totalAmount).toFixed(0)}</td>
                                  <td className="px-5 py-3 text-sm text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-neutral-400 text-center py-6 text-sm">No orders yet</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">Failed to load customer details</p>
                    <p className="text-neutral-500 text-sm mt-2">Please try again or contact support.</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end gap-3">
                  <button onClick={() => setShowDetailsModal(false)} className="btn-outline text-sm px-4 py-2">
                    Close
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedCustomer.id, !selectedCustomer.isActive)}
                    className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCustomer.isActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedCustomer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
                  </button>
                </div>
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

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={cancelStatusUpdate}
          onConfirm={confirmStatusUpdate}
          title={pendingAction ? (!pendingAction.isActive ? 'Deactivate Customer' : 'Activate Customer') : ''}
          message={pendingAction ? `Are you sure you want to ${!pendingAction.isActive ? 'deactivate' : 'activate'} this customer?` : ''}
          confirmText={pendingAction ? (!pendingAction.isActive ? 'Deactivate' : 'Activate') + ' Customer' : ''}
          cancelText="Cancel"
          type={pendingAction && !pendingAction.isActive ? 'danger' : 'info'}
          isLoading={updating !== null}
        >
          {pendingAction && (
            <div className="bg-neutral-50 p-3 rounded-md">
              <p className="text-sm text-neutral-700">
                <span className="font-medium">Customer:</span> {pendingAction.customerName}
              </p>
            </div>
          )}
        </ConfirmationDialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
