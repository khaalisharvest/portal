'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';
import { API_URL } from '@/config/env';

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
  const [filterRole, setFilterRole] = useState('');
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

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (pagination.currentPage || 1).toString(),
        limit: '10',
        ...(filterRole && { role: filterRole }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/v1/admin/users/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
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
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        toast.error(`Failed to fetch customers: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      toast.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filterRole, searchTerm]);

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
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
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
    } catch (error) {
      console.error('Error updating customer status:', error);
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

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Remove old filtering logic since we're now using server-side filtering

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers Management</h1>
            <p className="text-gray-600">Manage your customer accounts and information</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                All Customers ({pagination.total})
              </h3>
              <div className="text-sm text-gray-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>
            
            {!customers || customers.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="user" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers?.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.phone}</div>
                          {customer.email && (
                            <div className="text-sm text-gray-500">{customer.email}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {customer.lastLoginAt ? (
                            <div>
                              <div className="text-gray-900">{new Date(customer.lastLoginAt).toLocaleDateString()}</div>
                              <div className="text-gray-500 text-xs">{new Date(customer.lastLoginAt).toLocaleTimeString()}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewDetails(customer)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors duration-200"
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
                                <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600 mr-1"></div>
                              ) : (
                                <Icon name={customer.isActive ? 'user-minus' : 'user-plus'} className="w-3 h-3 mr-1" />
                              )}
                              {customer.isActive ? 'Deactivate' : 'Activate'}
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
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="chevron-left" className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Customer Details - {selectedCustomer.name}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="x" className="h-6 w-6" />
                  </button>
                </div>

                {!customerStats ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border border-gray-300 border-t-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading customer details...</p>
                  </div>
                ) : customerStats && customerStats.customer ? (
                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Name:</span> {customerStats.customer.name}</p>
                            <p><span className="font-medium">Phone:</span> {customerStats.customer.phone}</p>
                            <p><span className="font-medium">Email:</span> {customerStats.customer.email || 'Not provided'}</p>
                            <p><span className="font-medium">Status:</span> 
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                customerStats.customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {customerStats.customer.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                            <p><span className="font-medium">Joined:</span> {new Date(customerStats.customer.joinedAt).toLocaleDateString()}</p>
                            <p><span className="font-medium">Last Login:</span> {customerStats.customer.lastLoginAt ? (
                              <span className="text-green-600">
                                {new Date(customerStats.customer.lastLoginAt).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">Never logged in</span>
                            )}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Order Statistics</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-500">Total Orders</p>
                              <p className="text-2xl font-bold text-gray-900">{customerStats.stats.totalOrders}</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-500">Completed</p>
                              <p className="text-2xl font-bold text-green-600">{customerStats.stats.completedOrders}</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-500">Total Spent</p>
                              <p className="text-2xl font-bold text-blue-600">₨{Number(customerStats.stats.totalSpent).toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-500">Avg Order</p>
                              <p className="text-2xl font-bold text-purple-600">₨{Number(customerStats.stats.averageOrderValue).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Recent Orders</h4>
                      {customerStats.recentOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {customerStats.recentOrders.map((order) => (
                                <tr key={order.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {order.orderNumber}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {order.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₨{Number(order.totalAmount).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No orders found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">Failed to load customer details</p>
                    <p className="text-gray-500 text-sm mt-2">Please try again or contact support if the issue persists.</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedCustomer.id, !selectedCustomer.isActive)}
                    className={`px-4 py-2 rounded-md ${
                      selectedCustomer.isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedCustomer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
                  </button>
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
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Customer:</span> {pendingAction.customerName}
              </p>
            </div>
          )}
        </ConfirmationDialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}
