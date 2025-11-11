'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Icon name="alert-circle" className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/orders')}
            className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-green-600 transition-all duration-200"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container-custom py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-orange-600 transition-colors"
            >
              Home
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => router.push('/orders')}
              className="text-gray-500 hover:text-orange-600 transition-colors"
            >
              Orders
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Order #{order.orderNumber}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                    <p className="text-sm sm:text-base text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(order.status)} self-start sm:self-auto`}>
                    <Icon name={getStatusIcon(order.status)} className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Payment Method</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{getPaymentMethodLabel(order.paymentMethod)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className={`font-medium ${
                        order.paymentStatus === 'paid' ? 'text-green-600' : 
                        order.paymentStatus === 'failed' ? 'text-red-600' : 
                        'text-yellow-600'
                      }`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </p>
                  </div>
                  
                  {order.trackingNumber && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Tracking Number</h3>
                      <p className="text-xs sm:text-sm text-gray-600 font-mono break-all">{order.trackingNumber}</p>
                    </div>
                  )}

                  {order.estimatedDelivery && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Estimated Delivery</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                    </div>
                  )}

                  {order.deliveredAt && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Delivered On</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{new Date(order.deliveredAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Items</h2>
              </div>

              <div className="divide-y divide-gray-200">
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
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon name="photo" className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 line-clamp-2">
                          {item.itemName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          ₨{item.unitPrice} per {item.unit}
                        </p>
                        {item.specifications && (
                          <div className="mt-1 text-xs text-gray-500">
                            {item.specifications.variety && (
                              <span className="mr-2">Variety: {item.specifications.variety}</span>
                            )}
                            {item.specifications.quality && (
                              <span>Quality: {item.specifications.quality}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm sm:text-lg font-bold text-gray-900">
                          ₨{Number(item.totalPrice).toFixed(2)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Delivery Address</h2>
              </div>

              <div className="px-4 sm:px-6 py-4">
                <div className="flex items-start space-x-3">
                  <Icon name="location" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">{order.address.fullName}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{order.address.phone}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                      {order.address.addressLine1}
                      {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {order.address.city}, {order.address.state} {order.address.postalCode}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">{order.address.country}</p>
                    {order.address.instructions && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        <strong>Instructions:</strong> {order.address.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Order Notes</h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-gray-600">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Cancellation Info */}
            {order.status === 'cancelled' && order.cancellationReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Icon name="x-circle" className="w-5 h-5 text-red-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-red-900">Order Cancelled</h3>
                    <p className="text-sm text-red-700 mt-1">
                      <strong>Reason:</strong> {order.cancellationReason}
                    </p>
                    {order.cancelledAt && (
                      <p className="text-xs text-red-600 mt-1">
                        Cancelled on {new Date(order.cancelledAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-4">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>

              <div className="px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Subtotal ({order.items.length} items)</span>
                  <span className="font-medium">₨{Number(order.subtotal).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-green-600">
                    {order.deliveryFee === 0 ? 'Free' : `₨${Number(order.deliveryFee).toFixed(2)}`}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">₨{Number(order.discount).toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>₨{Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  <button
                    onClick={() => router.push('/orders')}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-xs sm:text-sm"
                  >
                    <Icon name="arrow-left" className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Back to Orders</span>
                  </button>

                  <button
                    onClick={() => router.push('/products')}
                    className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-white py-2 px-3 sm:px-4 rounded-lg hover:from-orange-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2 text-xs sm:text-sm"
                  >
                    <Icon name="plus" className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Continue Shopping</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
