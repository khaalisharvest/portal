'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import ProductLoader from '@/components/ui/ProductLoader';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';

function fmt(n: number) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
  specifications?: any;
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

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (params.id) {
      fetchOrderDetails(params.id as string);
    }
  }, [user, params.id, router]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.data || data);
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      router.push('/orders');
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

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    const backendToken = localStorage.getItem('backend_token');
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${backendToken}` },
        body: JSON.stringify({ reason: cancellationReason || 'Customer requested cancellation' }),
      });
      if (res.ok) {
        toast.success(`Order #${order.orderNumber} cancelled`);
        setCancellationReason('');
        fetchOrderDetails(order.id);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to cancel order');
      }
    } catch {
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ProductLoader size="lg" />
          <p className="text-neutral-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <Icon name="alert-circle" className="w-8 h-8 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Order Not Found</h1>
          <p className="text-neutral-600 mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/orders')}
            className="btn-primary"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
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
            <button
              onClick={() => router.push('/orders')}
              className="text-neutral-500 hover:text-primary-600 transition-colors"
            >
              Orders
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-900 font-medium">Order #{order.orderNumber}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Order #{order.orderNumber}</h1>
                    <p className="text-sm sm:text-base text-neutral-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(order.status)} self-start sm:self-auto`}>
                    <Icon name={getStatusIcon(order.status)} className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-neutral-900 mb-2">Payment</h3>
                    <p className="text-xs sm:text-sm text-neutral-700 font-medium">{getPaymentMethodLabel(order.paymentMethod)}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Status:{' '}
                      <span className={`font-medium ${
                        order.paymentStatus === 'paid'   ? 'text-primary-600' :
                        order.paymentStatus === 'failed' ? 'text-error-600' :
                        'text-secondary-600'
                      }`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </p>
                    {order.paymentReference && (
                      <p className="text-xs text-neutral-500 mt-0.5 font-mono break-all">
                        Ref: {order.paymentReference}
                      </p>
                    )}
                  </div>

                  {order.trackingNumber && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-neutral-900 mb-2">Tracking Number</h3>
                      <p className="text-xs sm:text-sm text-neutral-600 font-mono break-all">{order.trackingNumber}</p>
                    </div>
                  )}

                  {order.estimatedDelivery && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-neutral-900 mb-2">Estimated Delivery</h3>
                      <p className="text-xs sm:text-sm text-neutral-600">
                        {new Date(order.estimatedDelivery).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {order.deliveredAt && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-neutral-900 mb-2">Delivered On</h3>
                      <p className="text-xs sm:text-sm text-neutral-600">
                        {new Date(order.deliveredAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Order Items</h2>
              </div>

              <div className="divide-y divide-neutral-100">
                {order.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 sm:p-6"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16">
                        {item.itemImage ? (
                          <Image
                            src={item.itemImage}
                            alt={item.itemName || 'Product'}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-100 rounded-xl flex items-center justify-center">
                            <Icon name="photo" className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-semibold text-neutral-900 line-clamp-2">
                          {item.itemName}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-500">
                          ₨{fmt(Number(item.unitPrice))} per {item.unit}
                        </p>
                        {item.specifications && Object.keys(item.specifications).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {Object.entries(item.specifications).map(([k, v]) => (
                              <span key={k} className="text-xs text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm sm:text-lg font-bold text-neutral-900">
                          ₨{fmt(Number(item.totalPrice))}
                        </div>
                        <div className="text-xs sm:text-sm text-neutral-500">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Delivery Address</h2>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-start space-x-3">
                  <Icon name="location" className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-neutral-900">{order.address.fullName}</h3>
                    <p className="text-xs sm:text-sm text-neutral-600">{order.address.phone}</p>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1 break-words">
                      {order.address.addressLine1}
                      {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-600">
                      {order.address.city}, {order.address.state} {order.address.postalCode}
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-600">{order.address.country}</p>
                    {order.address.instructions && (
                      <p className="text-xs sm:text-sm text-neutral-500 mt-2">
                        <strong>Instructions:</strong> {order.address.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100">
                  <h2 className="text-lg font-semibold text-neutral-900">Order Notes</h2>
                </div>
                <div className="px-5 py-4">
                  <p className="text-neutral-600">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Cancellation Info */}
            {order.status === 'cancelled' && order.cancellationReason && (
              <div className="bg-error-50 border border-error-100 rounded-2xl p-5">
                <div className="flex items-start space-x-3">
                  <Icon name="x-circle" className="w-5 h-5 text-error-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-error-700">Order Cancelled</h3>
                    <p className="text-sm text-error-600 mt-1">
                      <strong>Reason:</strong> {order.cancellationReason}
                    </p>
                    {order.cancelledAt && (
                      <p className="text-xs text-error-500 mt-1">
                        Cancelled on {new Date(order.cancelledAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-0 overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Order Summary</h2>
              </div>

              <div className="px-5 py-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-neutral-600">Subtotal ({order.items.length} items)</span>
                  <span className="font-medium">₨{fmt(Number(order.subtotal))}</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-neutral-600">Delivery Fee</span>
                  <span className={`font-medium ${order.deliveryFee === 0 ? 'text-primary-600' : ''}`}>
                    {order.deliveryFee === 0 ? 'Free' : `₨${fmt(Number(order.deliveryFee))}`}
                  </span>
                </div>

                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-primary-600 font-medium">Savings</span>
                    <span className="font-medium text-primary-600">-₨{fmt(Number(order.discount))}</span>
                  </div>
                )}

                <div className="border-t border-neutral-100 pt-3 sm:pt-4">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>₨{fmt(Number(order.totalAmount))}</span>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  <button
                    onClick={() => router.push('/orders')}
                    className="btn-outline w-full text-xs sm:text-sm"
                  >
                    <Icon name="arrow-left" className="w-3.5 h-3.5" />
                    Back to Orders
                  </button>

                  <button
                    onClick={() => router.push('/products')}
                    className="btn-cta w-full text-xs sm:text-sm"
                  >
                    <Icon name="plus" className="w-3.5 h-3.5" />
                    Continue Shopping
                  </button>

                  {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'refunded' && (
                    <button
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full text-xs sm:text-sm font-medium text-error-500 hover:text-error-600 flex items-center justify-center gap-1.5 py-2 transition-colors"
                    >
                      <Icon name="x-circle" className="w-3.5 h-3.5" />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => { setShowCancelDialog(false); setCancellationReason(''); }}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message={`Cancel order #${order.orderNumber}? This cannot be undone.`}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        type="warning"
        isLoading={isCancelling}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Reason (optional)
          </label>
          <textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Why are you cancelling this order?"
            className="textarea-field text-sm"
            rows={3}
            disabled={isCancelling}
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
}
