'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';
import { API_URL } from '@/config/env';

interface OrderItem {
  id: string;
  productId: string;
  itemName: string;
  itemImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  unit: string;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: 'home' | 'work' | 'other';
  instructions?: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  address: Address;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'cash_on_delivery' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{orderId: string, status: string} | null>(null);
  const [pendingPaymentUpdate, setPendingPaymentUpdate] = useState<{orderId: string, paymentStatus: string} | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Status options for dropdown
  const statusOptions: DropdownOption[] = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'blue' },
    { value: 'processing', label: 'Processing', color: 'purple' },
    { value: 'shipped', label: 'Shipped', color: 'indigo' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
  ];

  // Payment status options for dropdown
  const paymentStatusOptions: DropdownOption[] = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
    { value: 'refunded', label: 'Refunded', color: 'blue' },
  ];

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedStatus, selectedPaymentStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }
      if (selectedPaymentStatus) {
        params.append('paymentStatus', selectedPaymentStatus);
      }

      const response = await fetch(`${API_URL}/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data?.orders || data.orders || []);
        setTotalPages(data.data?.totalPages || data.totalPages || 1);
        setTotalOrders(data.data?.total || data.total || 0);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, additionalData: any = {}) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
        body: JSON.stringify({ status, ...additionalData }),
      });

      if (response.ok) {
        toast.success('Order status updated successfully');
        fetchOrders();
        setShowOrderDetails(false);
        setSelectedOrder(null);
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
        body: JSON.stringify({ paymentStatus }),
      });

      if (response.ok) {
        toast.success('Payment status updated successfully');
        fetchOrders();
        setShowOrderDetails(false);
        setSelectedOrder(null);
      } else {
        throw new Error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock';
      case 'confirmed': return 'check-circle';
      case 'processing': return 'cog';
      case 'shipped': return 'truck';
      case 'delivered': return 'check-circle';
      case 'cancelled': return 'x-circle';
      case 'refunded': return 'arrow-uturn-left';
      default: return 'question-mark-circle';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash_on_delivery': return 'Cash on Delivery';
      case 'credit_card': return 'Credit Card';
      case 'debit_card': return 'Debit Card';
      case 'bank_transfer': return 'Bank Transfer';
      case 'digital_wallet': return 'Digital Wallet';
      default: return method;
    }
  };


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePaymentStatusFilter = (paymentStatus: string) => {
    setSelectedPaymentStatus(paymentStatus);
    setCurrentPage(1);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // Show confirmation for ALL status changes
    setPendingStatusUpdate({ orderId, status: newStatus });
    setShowConfirmDialog(true);
  };

  const performStatusUpdate = async (orderId: string, newStatus: string) => {
    const additionalData: any = {};
    
    
    if (newStatus === 'delivered') {
      additionalData.deliveredAt = new Date().toISOString();
    }
    
    if (newStatus === 'cancelled') {
      if (cancellationReason.trim()) {
        additionalData.cancellationReason = cancellationReason.trim();
      }
    }

    await updateOrderStatus(orderId, newStatus, additionalData);
  };

  const handleConfirmStatusUpdate = async () => {
    if (pendingStatusUpdate) {
      await performStatusUpdate(pendingStatusUpdate.orderId, pendingStatusUpdate.status);
      setShowConfirmDialog(false);
      setPendingStatusUpdate(null);
      setCancellationReason('');
    }
  };

  const handleCancelStatusUpdate = () => {
    setShowConfirmDialog(false);
    setPendingStatusUpdate(null);
    setCancellationReason('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Orders: {totalOrders}
          {selectedStatus && (
            <span className="ml-4 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              Status: {selectedStatus}
            </span>
          )}
          {selectedPaymentStatus && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Payment: {selectedPaymentStatus}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-6">
            {/* Order Status Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Order Status</label>
              <div className="w-48">
                <Dropdown
                  options={[
                    { value: '', label: 'All Orders' },
                    ...statusOptions
                  ]}
                  value={selectedStatus}
                  onChange={(value) => handleStatusFilter(value as string)}
                  placeholder="Select Status"
                  clearable={false}
                  searchable={false}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>

            {/* Payment Status Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Payment Status</label>
              <div className="w-48">
                <Dropdown
                  options={[
                    { value: '', label: 'All Payments' },
                    ...paymentStatusOptions
                  ]}
                  value={selectedPaymentStatus}
                  onChange={(value) => handlePaymentStatusFilter(value as string)}
                  placeholder="Select Payment Status"
                  clearable={false}
                  searchable={false}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm relative">
        <div className="overflow-x-auto pb-20">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Icon name="shopping-bag" className="w-12 h-12 text-gray-400" />
                      <p>No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 relative">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                        <div className="text-sm text-gray-500">{order.user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex-shrink-0 w-8 h-8">
                            <Image
                              src={item.itemImage || '/images/placeholder.svg'}
                              alt={item.itemName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder.svg';
                              }}
                            />
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-xs text-gray-500">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₨{Number(order.totalAmount).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-6" style={{ overflow: 'visible' }}>
                      <div className="space-y-2">
                        {/* Order Status with Visual Indicator */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${
                            order.status === 'delivered' ? 'bg-green-500 ring-2 ring-green-200' :
                            order.status === 'cancelled' ? 'bg-red-500 ring-2 ring-red-200' :
                            order.status === 'shipped' ? 'bg-blue-500 ring-2 ring-blue-200' :
                            order.status === 'processing' ? 'bg-purple-500 ring-2 ring-purple-200' :
                            order.status === 'confirmed' ? 'bg-indigo-500 ring-2 ring-indigo-200' :
                            'bg-yellow-500 ring-2 ring-yellow-200'
                          }`}></div>
                          <div className="w-40" style={{ overflow: 'visible' }}>
                            <Dropdown
                              options={statusOptions}
                              value={order.status}
                              onChange={(value) => handleStatusUpdate(order.id, value as string)}
                              disabled={isUpdating}
                              size="sm"
                              variant="outline"
                              showCheckmark={false}
                              className="text-xs"
                              align="right"
                            />
                          </div>
                          {isUpdating && (
                            <div className="animate-spin rounded-full h-4 w-4 border border-orange-500 border-t-transparent"></div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        {/* Payment Status with Visual Indicator */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${
                            order.paymentStatus === 'paid' ? 'bg-green-500 ring-2 ring-green-200' :
                            order.paymentStatus === 'failed' ? 'bg-red-500 ring-2 ring-red-200' :
                            order.paymentStatus === 'refunded' ? 'bg-blue-500 ring-2 ring-blue-200' :
                            'bg-yellow-500 ring-2 ring-yellow-200'
                          }`}></div>
                          <div className="relative">
                            <Dropdown
                              options={paymentStatusOptions}
                              value={order.paymentStatus}
                              onChange={(value) => updatePaymentStatus(order.id, value as string)}
                              placeholder="Select Status"
                              clearable={false}
                              searchable={false}
                              variant="outline"
                              size="sm"
                              className="w-full min-w-[120px]"
                              align="right"
                            />
                          </div>
                        </div>
                        
                        {/* Payment Method */}
                        <div className="text-sm text-gray-500">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1"
                        title="View order details"
                      >
                        <Icon name="eye" className="w-4 h-4" />
                        <span className="hidden sm:inline">View Details</span>
                      </button>
                      
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - #{selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Order Status</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      <Icon name={getStatusIcon(selectedOrder.status)} className="w-4 h-4 mr-1" />
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-medium text-gray-900">Total Amount</h4>
                    <p className="text-lg font-bold text-gray-900">₨{Number(selectedOrder.totalAmount).toFixed(2)}</p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₨{Number(selectedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className={`font-medium ${selectedOrder.deliveryFee > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                        {selectedOrder.deliveryFee > 0 ? `₨${Number(selectedOrder.deliveryFee).toFixed(2)}` : 'Free'}
                      </span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-green-600">-₨{Number(selectedOrder.discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="font-bold text-gray-900">₨{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{selectedOrder.user.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.user.phone}</p>
                    {selectedOrder.user.email && (
                      <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Address</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{selectedOrder.address.fullName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.address.phone}</p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.address.addressLine1}
                      {selectedOrder.address.addressLine2 && `, ${selectedOrder.address.addressLine2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postalCode}
                    </p>
                    <p className="text-sm text-gray-600">{selectedOrder.address.country}</p>
                    {selectedOrder.address.instructions && (
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>Instructions:</strong> {selectedOrder.address.instructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-12 h-12">
                          <Image
                            src={item.itemImage || '/images/placeholder.svg'}
                            alt={item.itemName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.itemName}</h5>
                          <p className="text-sm text-gray-600">₨{Number(item.unitPrice).toFixed(2)} per {item.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                          <p className="text-sm text-gray-600">₨{Number(item.totalPrice).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Method</p>
                        <p className="font-medium text-gray-900">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className={`font-medium ${
                          selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : 
                          selectedOrder.paymentStatus === 'failed' ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                          {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.paymentReference && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Reference</p>
                        <p className="font-mono text-sm text-gray-900">{selectedOrder.paymentReference}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Order Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Tracking Info */}
                {selectedOrder.trackingNumber && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tracking Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-mono text-sm text-gray-900">{selectedOrder.trackingNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelStatusUpdate}
        onConfirm={handleConfirmStatusUpdate}
        title="Confirm Status Change"
        message={`Are you sure you want to change this order status to ${pendingStatusUpdate?.status.toUpperCase()}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        type={pendingStatusUpdate?.status === 'cancelled' ? 'danger' : 'warning'}
      >
        {/* Status-specific messages */}
        {pendingStatusUpdate?.status === 'pending' && (
          <p className="text-xs text-yellow-600 mt-2">
            This will mark the order as pending.
          </p>
        )}
        {pendingStatusUpdate?.status === 'confirmed' && (
          <p className="text-xs text-blue-600 mt-2">
            This will confirm the order and start processing.
          </p>
        )}
        {pendingStatusUpdate?.status === 'processing' && (
          <p className="text-xs text-purple-600 mt-2">
            This will mark the order as being processed.
          </p>
        )}
        {pendingStatusUpdate?.status === 'shipped' && (
          <p className="text-xs text-indigo-600 mt-2">
            This will mark the order as shipped.
          </p>
        )}
        {pendingStatusUpdate?.status === 'delivered' && (
          <p className="text-xs text-green-600 mt-2">
            This will mark the order as completed.
          </p>
        )}
        {pendingStatusUpdate?.status === 'cancelled' && (
          <div className="mt-4">
            <p className="text-xs text-red-600 mb-2">
              This action cannot be undone.
            </p>
            <div>
              <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                rows={3}
              />
            </div>
          </div>
        )}
      </ConfirmationDialog>
    </div>
  );
}
