'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import ProductLoader from '@/components/ui/ProductLoader';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { toast } from 'sonner';

function fmt(n: number) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  for (let p = lo; p <= hi; p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':    return 'bg-secondary-100 text-secondary-700';
    case 'confirmed':  return 'bg-primary-100 text-primary-700';
    case 'processing': return 'bg-neutral-100 text-neutral-700';
    case 'shipped':    return 'bg-primary-50 text-primary-600';
    case 'delivered':  return 'bg-primary-100 text-primary-700';
    case 'cancelled':  return 'bg-error-50 text-error-600';
    case 'refunded':   return 'bg-neutral-100 text-neutral-600';
    default:           return 'bg-neutral-100 text-neutral-600';
  }
}

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
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  address: Address;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'cash_on_delivery' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<{ id: string; orderNumber: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [isLoading, user, router]);

  const fetchOrders = async (page = currentPage, status = selectedStatus) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (status) params.append('status', status);

      const response = await fetch(`/api/v1/orders?${params}`, {
        headers: {
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedOrders = data.data?.orders || data.orders || [];
        const total = data.data?.totalPages || data.totalPages || 1;
        setOrders(fetchedOrders);
        setTotalPages(total);
      } else if (response.status === 401) {
        // Token expired or invalid - use logout to handle cleanup and redirect
        await logout();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
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
    fetchOrders(page, selectedStatus);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    fetchOrders(1, status);
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;

    try {
      setIsCancelling(true);

      const response = await fetch(`/api/v1/orders/${pendingCancel.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: cancellationReason || 'Customer requested cancellation',
        }),
      });

      if (response.ok) {
        toast.success(`Order #${pendingCancel.orderNumber} has been cancelled`);
        setCancellationReason('');
        // Refresh orders list
        await fetchOrders(currentPage, selectedStatus);
      } else if (response.status === 401) {
        await logout();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
      setShowConfirmDialog(false);
      setPendingCancel(null);
    }
  };

  const handleCancelCancel = () => {
    setShowConfirmDialog(false);
    setPendingCancel(null);
    setCancellationReason('');
  };

  if (isLoading || !user) {
    return null; // Will redirect once auth resolves
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-custom py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="text-neutral-500 hover:text-primary-600 transition-colors"
            >
              Home
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-900 font-medium">My Orders</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Orders</h1>
          <p className="text-neutral-600">Track and manage your organic product orders</p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleStatusFilter('')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedStatus === ''
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-primary-50 hover:border-primary-300'
              }`}
            >
              All Orders
            </button>
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap ${
                  selectedStatus === status
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-primary-50 hover:border-primary-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center space-y-3">
              <ProductLoader size="lg" />
              <p className="text-neutral-500 text-sm">Loading your orders…</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-24 w-24 relative mx-auto mb-6">
              <Image
                src="/images/logo.png"
                alt="Khaalis Harvest Logo"
                fill
                sizes="96px"
                className="object-contain opacity-50"
              />
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-3">No Orders Found</h3>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              {selectedStatus
                ? `No ${selectedStatus} orders found.`
                : "You haven't placed any orders yet. Start exploring our fresh organic products!"
              }
            </p>
            <button
              onClick={() => router.push('/products')}
              className="btn-cta mx-auto flex items-center space-x-3"
            >
              <Icon name="plus" className="w-5 h-5" />
              <span>Start Shopping</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.08, 0.3) }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-neutral-100 hover:border-primary-200"
              >
                <div className="p-4 sm:p-6">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                      <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(order.status)}`}>
                        <Icon name={getStatusIcon(order.status)} className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                        <span className="hidden sm:inline">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        <span className="sm:hidden">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      </span>
                      <p className="text-base sm:text-lg font-bold text-neutral-900">
                        ₨{fmt(Number(order.totalAmount))}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-neutral-100">
                          {item.itemImage ? (
                            <Image
                              src={item.itemImage}
                              alt={item.itemName || 'Product'}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                              <Icon name="photo" className="w-4 h-4 text-neutral-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-neutral-600">
                            +{order.items.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-2">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {getPaymentMethodLabel(order.paymentMethod)}
                    </p>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 mb-1">Delivery Address</h4>
                      <p className="text-sm text-neutral-600">
                        {order.address?.fullName ?? 'Address not available'}{order.address?.city ? `, ${order.address.city}` : ''}
                      </p>
                    </div>

                    {order.trackingNumber && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900 mb-1">Tracking Number</h4>
                        <p className="text-sm text-neutral-600 font-mono">{order.trackingNumber}</p>
                      </div>
                    )}

                    {order.estimatedDelivery && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900 mb-1">Estimated Delivery</h4>
                        <p className="text-sm text-neutral-600">
                          {new Date(order.estimatedDelivery).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-neutral-100 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors duration-200"
                      >
                        <Icon name="view" className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>View Details</span>
                      </button>

                      {order.status === 'pending' && (
                        <button
                          onClick={() => {
                            setPendingCancel({ id: order.id, orderNumber: order.orderNumber });
                            setShowConfirmDialog(true);
                          }}
                          className="text-error-500 hover:text-error-600 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors duration-200"
                        >
                          <Icon name="x-circle" className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-neutral-500">
                      Payment: <span className={`font-medium ${
                        order.paymentStatus === 'paid' ? 'text-primary-600' :
                        order.paymentStatus === 'failed' ? 'text-error-600' :
                        'text-secondary-600'
                      }`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-1 sm:space-x-2 mt-8 overflow-x-auto">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 border border-neutral-200 rounded-lg text-xs sm:text-sm font-medium text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all duration-200"
                >
                  ← Prev
                </button>

                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-neutral-500 text-xs sm:text-sm">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-200 text-neutral-600 bg-white hover:bg-primary-50 hover:border-primary-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 border border-neutral-200 rounded-lg text-xs sm:text-sm font-medium text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all duration-200"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={handleCancelCancel}
          onConfirm={handleConfirmCancel}
          title="Cancel Order"
          message={`Are you sure you want to cancel order #${pendingCancel?.orderNumber}? This action cannot be undone.`}
          confirmText="Cancel Order"
          cancelText="Keep Order"
          type="warning"
          isLoading={isCancelling}
        >
          <div className="mt-4">
            <label htmlFor="cancellation-reason" className="block text-sm font-medium text-neutral-700 mb-2">
              Reason for cancellation (optional)
            </label>
            <textarea
              id="cancellation-reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancelling this order..."
              className="textarea-field text-sm"
              rows={3}
              disabled={isCancelling}
            />
          </div>
        </ConfirmationDialog>
      </div>
    </div>
  );
}
