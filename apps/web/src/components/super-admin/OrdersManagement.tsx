'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { toast } from 'sonner';
import { API_URL } from '@/config/env';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';
import StatusBadge from '@/components/admin/StatusBadge';

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
  userId: string | null;
  user: User | null;
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

const PAGE_SIZE = 10;

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
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
    { value: 'refunded', label: 'Refunded', color: 'gray' },
  ];

  // Payment status options for dropdown
  const paymentStatusOptions: DropdownOption[] = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
    { value: 'refunded', label: 'Refunded', color: 'blue' },
  ];

  // Debounced search effect - delays API calls until user stops typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', PAGE_SIZE.toString());
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }
      if (selectedPaymentStatus) {
        params.append('paymentStatus', selectedPaymentStatus);
      }
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.append('dateTo', dateTo);
      }

      const response = await fetch(`/api/v1/admin/orders?${params}`, {
        headers: {
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
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, selectedPaymentStatus, debouncedSearchTerm, dateFrom, dateTo]);

  // Fetch orders when page, status, payment status, or debounced search term changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string, additionalData: any = {}) => {
    try {
      setIsUpdating(orderId);
      const response = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, ...additionalData }),
      });

      if (response.ok) {
        toast.success('Order status updated successfully');
        fetchOrders();
      } else {
        throw new Error('Failed to update order status');
      }
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(null);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      setIsUpdating(orderId);
      const response = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus }),
      });

      if (response.ok) {
        toast.success('Payment status updated successfully');
        fetchOrders();
      } else {
        throw new Error('Failed to update payment status');
      }
    } catch {
      toast.error('Failed to update payment status');
    } finally {
      setIsUpdating(null);
    }
  };

  function getValidNextStatuses(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };
    return transitions[currentStatus] ?? [];
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-primary-100 text-primary-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-neutral-100 text-neutral-800';
      default: return 'bg-neutral-100 text-neutral-800';
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


  const printPackingSlip = () => {
    if (!selectedOrder) return;
    const items = selectedOrder.items.map((item) => `
      <tr>
        <td style="padding:8px 12px 8px 0;border-bottom:1px solid #e5e5e5;font-size:13px">${item.itemName}</td>
        <td style="padding:8px 12px 8px 0;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px 8px 0;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right">₨${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding:8px 0 8px 0;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right">₨${Number(item.totalPrice).toFixed(2)}</td>
      </tr>`).join('');

    const addr = selectedOrder.address;
    const customer = selectedOrder.user;
    const orderDate = new Date(selectedOrder.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Karachi' });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Packing Slip — #${selectedOrder.orderNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#111;background:#fff;padding:32px}
  @page{size:A4;margin:20mm}
  h1{font-size:22px;font-weight:700}
  .sub{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#777;margin-top:4px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2px solid #111;margin-bottom:20px}
  .header-right{text-align:right}
  .header-right .order{font-size:16px;font-weight:700}
  .header-right .date{font-size:12px;color:#666;margin-top:2px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px}
  .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:6px}
  .info p{font-size:13px;line-height:1.6;color:#333}
  .info .name{font-weight:600;color:#111}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  thead tr{border-bottom:2px solid #111}
  th{font-size:11px;font-weight:700;padding:6px 12px 6px 0;text-align:left}
  th:last-child,td:last-child{text-align:right;padding-right:0}
  th:nth-child(2),td:nth-child(2){text-align:center}
  th:nth-child(3),td:nth-child(3){text-align:right}
  .totals{display:flex;justify-content:flex-end;margin-bottom:24px}
  .totals-box{width:220px;font-size:13px}
  .totals-row{display:flex;justify-content:space-between;padding:4px 0;color:#555}
  .totals-row.total{border-top:2px solid #111;margin-top:6px;padding-top:8px;font-weight:700;font-size:15px;color:#111}
  .footer{display:flex;justify-content:space-between;font-size:11px;color:#777;padding-top:12px;border-top:1px solid #ddd}
</style>
</head><body>
<div class="header">
  <div><h1>Khaalis Harvest</h1><p class="sub">Packing Slip</p></div>
  <div class="header-right">
    <p class="order">Order #${selectedOrder.orderNumber}</p>
    <p class="date">${orderDate}</p>
  </div>
</div>
<div class="grid">
  <div>
    <p class="section-label">Ship To</p>
    <div class="info">
      <p class="name">${addr.fullName}</p>
      <p>${addr.phone}</p>
      <p>${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}</p>
      <p>${addr.city}, ${addr.state} ${addr.postalCode}</p>
      <p>${addr.country}</p>
    </div>
  </div>
  <div>
    <p class="section-label">Customer</p>
    <div class="info">
      <p class="name">${customer ? customer.name : addr.fullName}</p>
      <p>${customer ? customer.phone : addr.phone}</p>
      ${!customer ? '<p style="font-size:11px;color:#888;margin-top:4px">Guest Order</p>' : ''}
    </div>
  </div>
</div>
<table>
  <thead><tr>
    <th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th>
  </tr></thead>
  <tbody>${items}</tbody>
</table>
<div class="totals"><div class="totals-box">
  <div class="totals-row"><span>Subtotal</span><span>₨${Number(selectedOrder.subtotal).toFixed(2)}</span></div>
  <div class="totals-row"><span>Delivery</span><span>${selectedOrder.deliveryFee > 0 ? '₨' + Number(selectedOrder.deliveryFee).toFixed(2) : 'Free'}</span></div>
  ${selectedOrder.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>−₨${Number(selectedOrder.discount).toFixed(2)}</span></div>` : ''}
  <div class="totals-row total"><span>Total</span><span>₨${Number(selectedOrder.totalAmount).toFixed(2)}</span></div>
</div></div>
<div class="footer">
  <span>Payment: <strong>${getPaymentMethodLabel(selectedOrder.paymentMethod)}</strong> · Status: <strong>${selectedOrder.paymentStatus.toUpperCase()}</strong></span>
  ${selectedOrder.trackingNumber ? `<span>Tracking: <strong>${selectedOrder.trackingNumber}</strong></span>` : ''}
</div>
</body></html>`;

    const w = window.open('', '_blank', 'width=794,height=1123');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.print(); };
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

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order); // show immediately with current data
    setShowOrderDetails(true);
    // Then fetch fresh data
    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data.data || data);
      }
    } catch { /* keep stale data */ }
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Orders' }]}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-neutral-700">Search Order Number</label>
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order number (e.g., ORD-20251114-9147, 9147, 20251114)"
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <Icon name="x" className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-xs text-neutral-500 mt-1">
                Searching for orders containing "{searchTerm}"
              </p>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-6">
            {/* Order Status Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-neutral-700">Order Status</label>
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
              <label className="text-sm font-medium text-neutral-700">Payment Status</label>
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

            {/* Date From */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-neutral-700">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-neutral-700">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Clear date filters */}
            {(dateFrom || dateTo) && (
              <div className="flex flex-col justify-end space-y-2">
                <label className="text-sm font-medium text-transparent select-none">Clear</label>
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                  className="px-3 py-2 text-sm text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-50"
                >
                  Clear Dates
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200 relative">
        <div className="overflow-x-auto pb-20">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={7} />)
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Icon name="shopping-bag" className="w-12 h-12 text-neutral-400" />
                      <p>No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 relative">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">#{order.orderNumber}</div>
                        <div className="text-sm text-neutral-500">
                          {new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {order.user ? order.user.name : order.address.fullName}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {order.user ? order.user.phone : order.address.phone}
                        </div>
                        {!order.user && (
                          <div className="text-xs text-primary-600 mt-1">Guest Order</div>
                        )}
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
                          <span className="text-xs text-neutral-500">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">₨{Number(order.totalAmount).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-6" style={{ overflow: 'visible' }}>
                      <div className="space-y-2">
                        {/* Order Status with Visual Indicator */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${
                            order.status === 'delivered' ? 'bg-green-500 ring-2 ring-green-200' :
                            order.status === 'cancelled' ? 'bg-red-500 ring-2 ring-red-200' :
                            order.status === 'shipped' ? 'bg-primary-500 ring-2 ring-blue-200' :
                            order.status === 'processing' ? 'bg-purple-500 ring-2 ring-purple-200' :
                            order.status === 'confirmed' ? 'bg-indigo-500 ring-2 ring-indigo-200' :
                            'bg-yellow-500 ring-2 ring-yellow-200'
                          }`}></div>
                          <div className="w-40" style={{ overflow: 'visible' }}>
                            {getValidNextStatuses(order.status).length === 0 ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            ) : (
                              <Dropdown
                                options={getValidNextStatuses(order.status).map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                                value={order.status}
                                onChange={(value) => handleStatusUpdate(order.id, value as string)}
                                disabled={isUpdating === order.id}
                                size="sm"
                                variant="outline"
                                showCheckmark={false}
                                className="text-xs"
                                align="right"
                              />
                            )}
                          </div>
                          {isUpdating === order.id && (
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
                            order.paymentStatus === 'refunded' ? 'bg-primary-500 ring-2 ring-blue-200' :
                            'bg-yellow-500 ring-2 ring-yellow-200'
                          }`}></div>
                          <div className="relative">
                            <Dropdown
                              options={paymentStatusOptions}
                              value={order.paymentStatus}
                              onChange={(value) => {
                                const newStatus = value as string;
                                if (newStatus && newStatus !== order.paymentStatus) {
                                  setPendingPaymentUpdate({ orderId: order.id, paymentStatus: newStatus });
                                }
                              }}
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
                        <div className="text-sm text-neutral-500">
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
        <div className="px-6 py-4 border-t border-neutral-200">
          <div className="flex items-center justify-between gap-4">
            {/* Count */}
            <p className="text-sm text-neutral-600 shrink-0">
              {totalOrders === 0 ? 'No orders' : (
                <>
                  Showing{' '}
                  <span className="font-medium text-neutral-900">
                    {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalOrders)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium text-neutral-900">{totalOrders}</span>
                  {' '}orders
                </>
              )}
            </p>

            {/* Controls — only render when more than 1 page */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <Icon name="chevron-double-left" className="w-4 h-4" />
                </button>

                {/* Previous */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <Icon name="chevron-left" className="w-4 h-4" />
                </button>

                {/* Page numbers with ellipsis */}
                {(() => {
                  const pages: (number | '…')[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (currentPage > 4) pages.push('…');
                    const start = Math.max(2, currentPage - 2);
                    const end = Math.min(totalPages - 1, currentPage + 2);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (currentPage < totalPages - 3) pages.push('…');
                    pages.push(totalPages);
                  }
                  return pages.map((p, idx) =>
                    p === '…' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-neutral-400 select-none">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p as number)}
                        className={`min-w-[36px] h-9 rounded-md border text-sm font-medium transition-colors ${
                          currentPage === p
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : 'border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <Icon name="chevron-right" className="w-4 h-4" />
                </button>

                {/* Last */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <Icon name="chevron-double-right" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal — full screen, no scroll */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white shrink-0">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">#{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-neutral-500">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Karachi' })}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                <Icon name={getStatusIcon(selectedOrder.status)} className="w-3 h-3" />
                {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={printPackingSlip}
                className="flex items-center space-x-1.5 px-3 py-2 text-sm border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Icon name="download" className="w-4 h-4" />
                <span>Packing Slip</span>
              </button>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body — 3-column grid, fills remaining height */}
          <div className="flex-1 grid grid-cols-3 gap-0 min-h-0">

            {/* Col 1: Customer + Address + Payment */}
            <div className="border-r border-neutral-200 p-6 flex flex-col gap-5 overflow-y-auto">
              {/* Customer */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Customer</p>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-1">
                  {selectedOrder.user ? (
                    <>
                      <p className="font-medium text-neutral-900">{selectedOrder.user.name}</p>
                      <p className="text-sm text-neutral-600">{selectedOrder.user.phone}</p>
                      {selectedOrder.user.email && <p className="text-sm text-neutral-600">{selectedOrder.user.email}</p>}
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-neutral-900">{selectedOrder.address.fullName}</p>
                      <p className="text-sm text-neutral-600">{selectedOrder.address.phone}</p>
                      <span className="inline-block text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full mt-1">Guest Order</span>
                    </>
                  )}
                </div>
              </section>

              {/* Delivery Address */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Delivery Address</p>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-1 text-sm">
                  <p className="font-medium text-neutral-900">{selectedOrder.address.fullName}</p>
                  <p className="text-neutral-600">{selectedOrder.address.phone}</p>
                  <p className="text-neutral-600">
                    {selectedOrder.address.addressLine1}{selectedOrder.address.addressLine2 ? `, ${selectedOrder.address.addressLine2}` : ''}
                  </p>
                  <p className="text-neutral-600">
                    {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postalCode}
                  </p>
                  <p className="text-neutral-600">{selectedOrder.address.country}</p>
                  {selectedOrder.address.instructions && (
                    <p className="text-neutral-500 mt-2 pt-2 border-t border-neutral-200">
                      <span className="font-medium">Note:</span> {selectedOrder.address.instructions}
                    </p>
                  )}
                </div>
              </section>

              {/* Payment */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Payment</p>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Method</span>
                    <span className="font-medium text-neutral-900">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Status</span>
                    <span className={`font-semibold ${
                      selectedOrder.paymentStatus === 'paid' ? 'text-green-600' :
                      selectedOrder.paymentStatus === 'failed' ? 'text-red-600' :
                      selectedOrder.paymentStatus === 'refunded' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                    </span>
                  </div>
                  {selectedOrder.paymentReference && (
                    <div className="pt-2 border-t border-neutral-200">
                      <span className="text-neutral-600 block mb-0.5">Reference</span>
                      <span className="font-mono text-xs text-neutral-900">{selectedOrder.paymentReference}</span>
                    </div>
                  )}
                </div>
              </section>

              {selectedOrder.trackingNumber && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Tracking</p>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="font-mono text-sm text-neutral-900">{selectedOrder.trackingNumber}</p>
                  </div>
                </section>
              )}

              {selectedOrder.notes && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Order Notes</p>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-sm text-neutral-600">{selectedOrder.notes}</p>
                  </div>
                </section>
              )}
            </div>

            {/* Col 2: Items */}
            <div className="border-r border-neutral-200 p-6 flex flex-col gap-3 overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Items ({selectedOrder.items.length})
              </p>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-200">
                    <Image
                      src={item.itemImage || '/images/placeholder.svg'}
                      alt={item.itemName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 text-sm truncate">{item.itemName}</p>
                    <p className="text-xs text-neutral-500">₨{Number(item.unitPrice).toFixed(2)} / {item.unit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-neutral-900">×{item.quantity}</p>
                    <p className="text-xs text-neutral-500">₨{Number(item.totalPrice).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Col 3: Summary */}
            <div className="p-6 flex flex-col gap-5">
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Order Summary</p>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="font-medium">₨{Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Delivery</span>
                    <span className={`font-medium ${selectedOrder.deliveryFee > 0 ? '' : 'text-green-600'}`}>
                      {selectedOrder.deliveryFee > 0 ? `₨${Number(selectedOrder.deliveryFee).toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Discount</span>
                      <span className="font-medium text-green-600">-₨{Number(selectedOrder.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t-2 border-neutral-300">
                    <span className="font-bold text-neutral-900 text-base">Total</span>
                    <span className="font-bold text-neutral-900 text-base">₨{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </section>
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
          <p className="text-xs text-primary-600 mt-2">
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
              <label htmlFor="cancellation-reason" className="block text-sm font-medium text-neutral-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                rows={3}
              />
            </div>
          </div>
        )}
      </ConfirmationDialog>

      {/* Payment Status Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!pendingPaymentUpdate}
        onClose={() => setPendingPaymentUpdate(null)}
        onConfirm={async () => {
          if (pendingPaymentUpdate) {
            await updatePaymentStatus(pendingPaymentUpdate.orderId, pendingPaymentUpdate.paymentStatus);
          }
          setPendingPaymentUpdate(null);
        }}
        title="Update Payment Status"
        message={`Change payment status to "${pendingPaymentUpdate?.paymentStatus?.toUpperCase()}"? ${pendingPaymentUpdate?.paymentStatus === 'refunded' ? 'This action may be irreversible.' : ''}`}
        confirmText="Confirm"
        cancelText="Cancel"
        type={pendingPaymentUpdate?.paymentStatus === 'refunded' ? 'danger' : 'warning'}
      />

    </div>
  );
}
