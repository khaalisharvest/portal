'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
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
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const itemsPerPage = 10;
  
  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<{ id: string; orderNumber: string } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchOrders();
  }, [user, router]);

  // Filter orders locally when selectedStatus changes
  useEffect(() => {
    if (selectedStatus === '') {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(allOrders.filter(order => order.status === selectedStatus));
    }
  }, [allOrders, selectedStatus]);

  // Paginate filtered orders when they change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredOrders.length / itemsPerPage));
  }, [filteredOrders, currentPage, itemsPerPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '100'); // Fetch more orders to have enough for filtering

      const response = await fetch(`/api/v1/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedOrders = data.data?.orders || data.orders || [];
        setAllOrders(fetchedOrders);
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
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;

    try {
      // TODO: Implement cancel order
      toast.error('Cancel order functionality coming soon');
    } finally {
      setShowConfirmDialog(false);
      setPendingCancel(null);
    }
  };

  const handleCancelCancel = () => {
    setShowConfirmDialog(false);
    setPendingCancel(null);
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-orange-50 to-green-50 border-b border-orange-200">
        <div className="container-custom py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-orange-600 transition-colors font-['Open_Sans']"
            >
              Home
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium font-['Poppins']">My Orders</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-['Poppins']">My Orders</h1>
          <p className="text-gray-600 font-['Open_Sans']">Track and manage your organic product orders</p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleStatusFilter('')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap font-['Poppins'] ${
                selectedStatus === ''
                  ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-green-50 hover:border-orange-300'
              }`}
            >
              All Orders
            </button>
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap font-['Poppins'] ${
                  selectedStatus === status
                    ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-green-50 hover:border-orange-300'
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
            <div className="text-center">
              <div className="h-16 w-16 relative mx-auto mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Khaalis Harvest Logo"
                  fill
                  sizes="64px"
                  className="object-contain animate-pulse"
                />
              </div>
              <p className="text-gray-600 font-['Open_Sans']">Loading your orders...</p>
            </div>
          </div>
        ) : paginatedOrders.length === 0 ? (
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
            <h3 className="text-2xl font-semibold text-gray-900 mb-3 font-['Poppins']">No Orders Found</h3>
            <p className="text-gray-600 mb-8 font-['Open_Sans'] max-w-md mx-auto">
              {selectedStatus 
                ? `No ${selectedStatus} orders found.` 
                : "You haven't placed any orders yet. Start exploring our fresh organic products!"
              }
            </p>
            <button
              onClick={() => router.push('/products')}
              className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-8 py-4 rounded-full hover:from-orange-600 hover:to-green-600 transition-all duration-200 flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl font-['Poppins'] font-medium"
            >
              <Icon name="plus" className="w-5 h-5" />
              <span>Start Shopping</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200"
              >
                <div className="p-4 sm:p-6">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 font-['Poppins']">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 font-['Open_Sans']">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                      <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold font-['Poppins'] ${getStatusColor(order.status)}`}>
                        <Icon name={getStatusIcon(order.status)} className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                        <span className="hidden sm:inline">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        <span className="sm:hidden">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      </span>
                      <p className="text-base sm:text-lg font-bold text-gray-900 font-['Poppins']">
                        ₨{Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                      {order.items.slice(0, 3).map((item, itemIndex) => (
                        <div key={item.id} className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                          {item.itemImage ? (
                            <Image
                              src={item.itemImage}
                              alt={item.itemName || 'Product'}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                              <Icon name="photo" className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            +{order.items.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2 font-['Open_Sans']">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {getPaymentMethodLabel(order.paymentMethod)}
                    </p>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1 font-['Poppins']">Delivery Address</h4>
                      <p className="text-sm text-gray-600 font-['Open_Sans']">
                        {order.address.fullName}, {order.address.city}
                      </p>
                    </div>
                    
                    {order.trackingNumber && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1 font-['Poppins']">Tracking Number</h4>
                        <p className="text-sm text-gray-600 font-mono font-['Open_Sans']">{order.trackingNumber}</p>
                      </div>
                    )}

                    {order.estimatedDelivery && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1 font-['Poppins']">Estimated Delivery</h4>
                        <p className="text-sm text-gray-600 font-['Open_Sans']">
                          {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="text-orange-600 hover:text-orange-800 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors duration-200 font-['Poppins']"
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
                          className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors duration-200 font-['Poppins']"
                        >
                          <Icon name="x-circle" className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-gray-500 font-['Open_Sans']">
                      Payment: <span className={`font-medium ${
                        order.paymentStatus === 'paid' ? 'text-green-600' : 
                        order.paymentStatus === 'failed' ? 'text-red-600' : 
                        'text-yellow-600'
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
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-green-50 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all duration-200 font-['Poppins']"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 font-['Poppins'] ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white border-orange-500 shadow-lg'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-green-50 hover:border-orange-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                {totalPages > 3 && (
                  <span className="px-2 text-gray-500 text-xs sm:text-sm">...</span>
                )}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-green-50 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all duration-200 font-['Poppins']"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
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
        />
      </div>
    </div>
  );
}
