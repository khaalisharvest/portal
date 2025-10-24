'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';
import { settingsApi, DeliveryCalculation } from '@/services/settings';
import { configService } from '@/services/config';

export default function CartPage() {
  const router = useRouter();
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculation | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'remove' | 'clear';
    productId?: string;
    selectedVariant?: string;
    productName?: string;
  } | null>(null);

  // Calculate delivery fee when cart total changes
  useEffect(() => {
    if (state.totalPrice > 0) {
      calculateDeliveryFee();
    }
  }, [state.totalPrice]);

  const calculateDeliveryFee = async () => {
    if (state.totalPrice <= 0) return;
    
    setIsCalculatingDelivery(true);
    try {
      // Get delivery settings from config
      const deliverySettings = await configService.getDeliverySettings();
      
      if (!deliverySettings.isDeliveryEnabled) {
        setDeliveryCalculation({
          deliveryFee: 0,
          isFree: true,
          reason: 'Delivery is disabled'
        });
        return;
      }

      if (state.totalPrice >= deliverySettings.freeDeliveryThreshold) {
        setDeliveryCalculation({
          deliveryFee: 0,
          isFree: true,
          reason: `Your order qualifies for free delivery`
        });
        return;
      }

      const amountNeeded = deliverySettings.freeDeliveryThreshold - state.totalPrice;
      setDeliveryCalculation({
        deliveryFee: deliverySettings.deliveryFee,
        isFree: false,
        reason: `Add ₨${amountNeeded.toFixed(2)} more to get free delivery (spend ₨${deliverySettings.freeDeliveryThreshold} or more)`
      });
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      throw error; // Don't fallback, let the error propagate
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  const handleQuantityChange = async (productId: string, selectedVariant: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId, selectedVariant);
      return;
    }

    setIsUpdating(productId);
    try {
      updateQuantity(productId, selectedVariant, newQuantity);
      toast.success('Quantity updated');
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = (productId: string, selectedVariant: string | undefined, productName: string) => {
    setPendingAction({
      type: 'remove',
      productId,
      selectedVariant,
      productName
    });
    setShowConfirmDialog(true);
  };

  const handleClearCart = () => {
    setPendingAction({
      type: 'clear'
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'remove' && pendingAction.productId && pendingAction.productName) {
        setIsUpdating(pendingAction.productId);
        removeFromCart(pendingAction.productId, pendingAction.selectedVariant);
        toast.success(`${pendingAction.productName} removed from basket`);
      } else if (pendingAction.type === 'clear') {
        clearCart();
        toast.success('Basket cleared successfully');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    } finally {
      setIsUpdating(null);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const handleProceedToCheckout = () => {
    if (state.isLoading) {
      return; // Don't proceed while loading
    }
    
    if (state.items.length === 0) {
      toast.error('Your basket is empty');
      return;
    }

    router.push('/checkout');
  };

  // Show loading state while cart is being loaded
  if (state.isLoading) {
    return (
      <div className="min-h-screen organic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your basket...</p>
        </div>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen organic-gradient">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-primary-100">
          <div className="container-custom py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => router.push('/')}
                className="text-neutral-500 hover:text-primary-600 transition-colors"
              >
                Home
              </button>
              <Icon name="chevron-right" className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-900 font-medium">Basket</span>
            </nav>
          </div>
        </div>

        <div className="container-custom py-8 sm:py-12">
          <div className="text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Khaalis Harvest"
                width={128}
                height={128}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Your Basket is Empty</h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Add some organic products to get started!
            </p>
            <button
              onClick={() => router.push('/products')}
              className="btn-primary flex items-center space-x-2 mx-auto text-sm sm:text-base"
            >
              <Icon name="plus" className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Browse Organic Products</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen organic-gradient">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-primary-100">
        <div className="container-custom py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="text-neutral-500 hover:text-primary-600 transition-colors"
            >
              Home
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-900 font-medium">Basket</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900">
                    Your Basket
                    <span className="ml-2 text-xs sm:text-sm font-normal text-neutral-500">
                      ({state.totalItems} items)
                    </span>
                  </h1>
                  <button
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium flex items-center space-x-1 self-start sm:self-auto"
                  >
                    <Icon name="delete" className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Clear Basket</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {state.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-3 sm:p-4 lg:p-6"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                        <Link 
                          href={`/products/${item.productId}`}
                          className="block w-full h-full hover:opacity-90 transition-opacity duration-200"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover rounded-lg cursor-pointer"
                          />
                        </Link>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/products/${item.productId}`}
                              className="block hover:text-orange-600 transition-colors duration-200"
                            >
                              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors duration-200">
                                {item.name}
                              </h3>
                            </Link>
                            {item.selectedVariant && (
                              <p className="text-xs sm:text-sm text-orange-600 font-medium mt-1">
                                {item.selectedVariant}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              per {item.unit}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm sm:text-base font-bold text-gray-900">
                                  ₨{item.price}
                                </span>
                                {item.variantOriginalPrice && item.variantOriginalPrice > item.price && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₨{item.variantOriginalPrice}
                                  </span>
                                )}
                              </div>
                              {!item.isAvailable && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Unavailable
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Mobile Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.selectedVariant, item.name)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-lg transition-colors sm:hidden"
                            title="Remove item"
                          >
                            <Icon name="delete" className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quantity Controls and Total - Mobile */}
                        <div className="flex items-center justify-between mt-3 sm:hidden">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.selectedVariant, item.quantity - 1)}
                              disabled={isUpdating === item.productId}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <Icon name="minus" className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                              {isUpdating === item.productId ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mx-auto"></div>
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.selectedVariant, item.quantity + 1)}
                              disabled={isUpdating === item.productId || !item.isAvailable}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <Icon name="plus" className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-gray-900">
                              ₨{(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} × ₨{item.price}
                              {item.variantOriginalPrice && item.variantOriginalPrice > item.price && (
                                <span className="ml-1 line-through">₨{item.variantOriginalPrice}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout: Quantity Controls and Total */}
                        <div className="hidden sm:flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.selectedVariant, item.quantity - 1)}
                                disabled={isUpdating === item.productId}
                                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Icon name="minus" className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                                {isUpdating === item.productId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mx-auto"></div>
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.selectedVariant, item.quantity + 1)}
                                disabled={isUpdating === item.productId || !item.isAvailable}
                                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Icon name="plus" className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Desktop Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.productId, item.selectedVariant, item.name)}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Icon name="delete" className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ₨{(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.quantity} × ₨{item.price}
                              {item.variantOriginalPrice && item.variantOriginalPrice > item.price && (
                                <span className="ml-1 line-through">₨{item.variantOriginalPrice}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-4">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>

              <div className="px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Subtotal ({state.totalItems} items)</span>
                  <span className="font-medium">₨{state.totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">
                    {isCalculatingDelivery ? (
                      <span className="text-gray-500">Calculating...</span>
                    ) : deliveryCalculation ? (
                      deliveryCalculation.isFree ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span className="text-gray-900">₨{(deliveryCalculation.deliveryFee || 0).toFixed(2)}</span>
                      )
                    ) : (
                      <span className="text-gray-500">₨0.00</span>
                    )}
                  </span>
                </div>
                
                {/* Delivery Information */}
                {deliveryCalculation && !isCalculatingDelivery && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {deliveryCalculation.reason}
                  </div>
                )}
                
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">₨0.00</span>
                </div>

                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>
                      ₨{((state.totalPrice || 0) + (deliveryCalculation?.deliveryFee || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-white py-3 sm:py-4 rounded-lg hover:from-orange-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Icon name="credit-card" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Proceed to Checkout</span>
                </button>

                <button
                  onClick={() => router.push('/products')}
                  className="w-full border border-gray-300 text-gray-700 py-3 sm:py-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Icon name="plus" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Continue Shopping</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title={pendingAction?.type === 'remove' ? 'Remove Item' : 'Clear Basket'}
        message={
          pendingAction?.type === 'remove' 
            ? `Remove ${pendingAction.productName} from your basket?`
            : 'Clear your entire basket?'
        }
        confirmText={pendingAction?.type === 'remove' ? 'Remove' : 'Clear Basket'}
        cancelText="Cancel"
        type="danger"
        isLoading={isUpdating !== null}
      />
    </div>
  );
}
