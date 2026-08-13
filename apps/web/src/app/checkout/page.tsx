'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import ProductLoader from '@/components/ui/ProductLoader';
import Dropdown from '@/components/ui/Dropdown';
import { toast } from 'sonner';
import {  DeliveryCalculation } from '@/services/settings';
import { configService } from '@/services/config';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';
import { usePublicSettings } from '@/hooks/usePublicSettings';

function fmt(n: number) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string; // Optional - defaults to Punjab
  postalCode: string;
  country?: string; // Optional - defaults to Pakistan
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
  instructions?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'login' | 'guest'>('select');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'bank_transfer'>('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const { settings: publicSettings }   = usePublicSettings();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculation | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [guestPhoneError, setGuestPhoneError] = useState('');
  const [addressPhoneError, setAddressPhoneError] = useState('');
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Punjab', // Default to Punjab for Pakistani app
    postalCode: '54000', // Default postal code for Pakistani app
    country: 'Pakistan', // Default to Pakistan for Pakistani app
    type: 'home' as 'home' | 'work' | 'other',
    isDefault: false,
    instructions: ''
  });
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Track if order was successfully placed to prevent showing "basket is empty" error
  const orderPlacedSuccessfully = useRef(false);

  useEffect(() => {
    if (cartState.isLoading) {
      return; // Don't redirect while loading
    }

    if (cartState.items.length === 0) {
      // Only show error if order wasn't successfully placed
      if (!orderPlacedSuccessfully.current) {
        toast.error('Your basket is empty');
        router.push('/cart');
      }
      return;
    }

    // Reset the flag when cart has items
    orderPlacedSuccessfully.current = false;

    // If user is logged in, fetch addresses and set checkout mode
    if (user) {
      setCheckoutMode('login');
      fetchAddresses();
    } else {
      // If no user, show checkout mode selection
      setCheckoutMode('select');
    }
  }, [user?.id, cartState.items.length]); // Only depend on user.id instead of entire user object

  // Calculate delivery fee when cart total changes
  useEffect(() => {
    if (cartState.totalPrice > 0) {
      calculateDeliveryFee().catch(() => {});
    }
  }, [cartState.totalPrice]);

  const calculateDeliveryFee = async () => {
    if (cartState.totalPrice <= 0) return;

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

      if (cartState.totalPrice >= deliverySettings.freeDeliveryThreshold) {
        setDeliveryCalculation({
          deliveryFee: 0,
          isFree: true,
          reason: `Your order qualifies for free delivery`
        });
        return;
      }

      const amountNeeded = deliverySettings.freeDeliveryThreshold - cartState.totalPrice;
      setDeliveryCalculation({
        deliveryFee: deliverySettings.deliveryFee,
        isFree: false,
        reason: `Add ₨${fmt(amountNeeded)} more to get free delivery (spend ₨${fmt(deliverySettings.freeDeliveryThreshold)} or more)`
      });
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      throw error; // Don't fallback, let the error propagate
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  const validateGuestPhone = (phone: string) => {
    const validation = validatePakistaniPhone(phone);
    if (!validation.isValid) {
      setGuestPhoneError(validation.error || 'Invalid phone number');
      return null;
    }
    setGuestPhoneError('');
    return validation.normalizedNumber;
  };

  const validateAddressPhone = (phone: string) => {
    const validation = validatePakistaniPhone(phone);
    if (!validation.isValid) {
      setAddressPhoneError(validation.error || 'Invalid phone number');
      return null;
    }
    setAddressPhoneError('');
    return validation.normalizedNumber;
  };

  const fetchAddresses = async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingAddresses) return;

    setIsFetchingAddresses(true);
    try {
      const response = await fetch(`/api/v1/orders/addresses`, {
        headers: {
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const addresses = data.data || [];
        setAddresses(addresses);

        // Select default address if available
        const defaultAddress = addresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsFetchingAddresses(false);
    }
  };

  const handleShowAddressForm = () => {
    // Pre-populate address form with user's information for logged-in users
    if (user) {
      setNewAddress({
        ...newAddress,
        fullName: user.name || '',
        phone: user.phone || '',
      });
    }
    setShowAddressForm(!showAddressForm);
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate phone number if it's being entered
      if (!user && newAddress.phone) {
        const phoneValidation = validateAddressPhone(newAddress.phone);
        if (!phoneValidation) {
          toast.error('Please enter a valid Pakistani phone number');
          return;
        }
      }

      // For logged-in users, use their profile information
      const addressData = user ? {
        ...newAddress,
        fullName: user.name,
        phone: user.phone,
      } : {
        ...newAddress,
        phone: newAddress.phone ? validateAddressPhone(newAddress.phone) : newAddress.phone
      };

      const response = await fetch(`/api/v1/orders/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses([...addresses, data.data || data]);
        setSelectedAddress(data.data?.id || data.id);
        setShowAddressForm(false);
        setNewAddress({
          fullName: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: 'Punjab', // Default to Punjab for Pakistani app
          postalCode: '54000', // Default postal code for Pakistani app
          country: 'Pakistan',
          type: 'home',
          isDefault: false,
          instructions: ''
        });
        toast.success('Address added successfully');
      } else {
        throw new Error('Failed to create address');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      toast.error('Failed to create address');
    }
  };

  const handlePlaceOrder = async () => {
    // Validate based on checkout mode
    if (checkoutMode === 'guest') {
      // Guest checkout validation
      if (!guestInfo.name || !guestInfo.phone) {
        toast.error('Please fill in your contact information');
        return;
      }

      if (!newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
        toast.error('Please fill in all required address fields');
        return;
      }
    } else {
      // Logged-in user validation
      if (!selectedAddress) {
        toast.error('Please select a delivery address');
        return;
      }
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate phone before setting the loading flag so an early return
    // never leaves isCreatingOrder stuck at true.
    let validatedPhone: string | null = null;
    if (checkoutMode === 'guest') {
      validatedPhone = validateGuestPhone(guestInfo.phone);
      if (!validatedPhone) {
        toast.error('Please enter a valid Pakistani phone number');
        return;
      }
    }

    // Check minimum order amount — only enforce when the setting has loaded and is > 0
    const minOrder = Number(publicSettings.min_order_amount);
    if (minOrder > 0 && cartState.totalPrice < minOrder) {
      toast.error(`Minimum order amount is ₨${minOrder.toLocaleString('en-PK')}`);
      return;
    }

    setIsCreatingOrder(true);

    try {
      let orderData;

      if (checkoutMode === 'guest') {
        // Guest order data
        orderData = {
          guestInfo: {
            name: guestInfo.name,
            phone: validatedPhone,
            email: guestInfo.email
          },
          address: {
            fullName: guestInfo.name,
            phone: validatedPhone,
            email: guestInfo.email,
            addressLine1: newAddress.addressLine1,
            addressLine2: newAddress.addressLine2,
            city: newAddress.city,
            state: newAddress.state,
            postalCode: newAddress.postalCode,
            country: newAddress.country,
            type: newAddress.type,
            instructions: newAddress.instructions
          },
          items: cartState.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant,
            variantPrice: item.variantPrice ? Number(item.variantPrice) : undefined,
            variantOriginalPrice: item.variantOriginalPrice ? Number(item.variantOriginalPrice) : undefined
          })),
          paymentMethod,
          notes
        };

        const response = await fetch(`/api/v1/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          const responseData = await response.json();
          const order = responseData.data || responseData;
          const orderNumber = order.orderNumber || order.order_number || 'N/A';
          const totalAmount = order.totalAmount || order.total_amount || 0;
          // Mark order as successfully placed AFTER validating response, then clear cart
          orderPlacedSuccessfully.current = true;
          clearCart();
          toast.success('Order placed successfully!');
          sessionStorage.setItem('pending_confirmation', '1');
          const confirmUrl = `/orders/confirmation?orderNumber=${encodeURIComponent(orderNumber)}&total=${totalAmount}&paymentMethod=${encodeURIComponent(orderData.paymentMethod || 'cash_on_delivery')}&guest=true`;
          router.push(confirmUrl);
        } else {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Failed to place order');
        }
      } else {
        // Logged-in user order data
        orderData = {
          addressId: selectedAddress,
          items: cartState.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant,
            variantPrice: item.variantPrice ? Number(item.variantPrice) : undefined,
            variantOriginalPrice: item.variantOriginalPrice ? Number(item.variantOriginalPrice) : undefined
          })),
          paymentMethod,
          notes
        };

        const response = await fetch(`/api/v1/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          const responseData = await response.json();
          const order = responseData.data || responseData;
          const orderNumber = order.orderNumber || order.order_number || 'N/A';
          const totalAmount = order.totalAmount || order.total_amount || 0;
          // Mark order as successfully placed AFTER validating response, then clear cart
          orderPlacedSuccessfully.current = true;
          clearCart();
          toast.success('Order placed successfully!');
          sessionStorage.setItem('pending_confirmation', '1');
          const confirmUrl = `/orders/confirmation?orderNumber=${encodeURIComponent(orderNumber)}&total=${totalAmount}&paymentMethod=${encodeURIComponent(orderData.paymentMethod || 'cash_on_delivery')}&guest=false`;
          router.push(confirmUrl);
        } else {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Failed to place order');
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const msg = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Show loading state while cart is being loaded
  if (cartState.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <ProductLoader size="lg" />
          <p className="text-neutral-600">Loading your basket...</p>
        </div>
      </div>
    );
  }

  if (cartState.items.length === 0) {
    return null; // Will redirect
  }

  // Compute total savings for discount row
  const totalSavings = cartState.items.reduce((acc, item) => {
    const orig = item.variantOriginalPrice ?? item.originalPrice;
    if (orig && orig > item.price) acc += (orig - item.price) * item.quantity;
    return acc;
  }, 0);

  // Show checkout mode selection for non-logged-in users
  if (checkoutMode === 'select') {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-neutral-100">
          <div className="container-custom py-3">
            <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
              <button onClick={() => router.push('/')} className="hover:text-primary-600 transition-colors">Home</button>
              <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
              <button onClick={() => router.push('/cart')} className="hover:text-primary-600 transition-colors">Basket</button>
              <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
              <span className="text-neutral-900 font-medium">Checkout</span>
            </nav>
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4 sm:mb-6 text-center">Checkout Options</h1>

            <div className="card space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Guest Checkout */}
                <button
                  onClick={() => setCheckoutMode('guest')}
                  className="p-4 border-2 border-neutral-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="user" className="w-4 h-4 text-neutral-400 group-hover:text-primary-500" />
                    <h3 className="text-sm sm:text-base font-semibold text-neutral-900">Guest Checkout</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500">No account required</p>
                </button>

                {/* Login */}
                <button
                  onClick={() => router.push('/auth/login?redirect=/checkout')}
                  className="p-4 border-2 border-neutral-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="check-circle" className="w-4 h-4 text-neutral-400 group-hover:text-primary-500" />
                    <h3 className="text-sm sm:text-base font-semibold text-neutral-900">Log In</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500">Use saved addresses &amp; track orders</p>
                </button>
              </div>

              <div className="pt-3 border-t border-neutral-100 text-center text-sm text-neutral-500">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Create one here
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 lg:pb-8">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
            <button onClick={() => router.push('/')} className="hover:text-primary-600 transition-colors">Home</button>
            <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
            <button onClick={() => router.push('/cart')} className="hover:text-primary-600 transition-colors">Basket</button>
            <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-neutral-900 font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Guest Information Form */}
            {checkoutMode === 'guest' && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Contact Information</h2>
                  <button
                    onClick={() => setCheckoutMode('select')}
                    className="text-sm text-neutral-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                  >
                    <Icon name="arrow-left" className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                        className="input-field"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        onBlur={(e) => validateGuestPhone(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${guestPhoneError ? 'border-error-500' : 'border-neutral-200'}`}
                        placeholder={getPhonePlaceholder()}
                      />
                      {guestPhoneError && (
                        <p className="mt-1 text-sm text-error-600">{guestPhoneError}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        className="input-field"
                        placeholder="your@email.com"
                      />
                      <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                        We'll use this to send you order updates and tracking information
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Delivery Address</h2>
              </div>

              <div className="p-5">
                {checkoutMode === 'guest' ? (
                  /* Guest Address Form */
                  <div className="space-y-4">
                    {/* Contact Information Summary */}
                    <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-neutral-900 mb-2">Delivery Contact</h3>
                      <div className="text-sm text-neutral-600">
                        <p><span className="font-medium">Name:</span> {guestInfo.name}</p>
                        <p><span className="font-medium">Phone:</span> {guestInfo.phone}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                        className="input-field"
                        placeholder="Street address, house number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={newAddress.addressLine2}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                        className="input-field"
                        placeholder="Apartment, suite, unit, etc. (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Dropdown
                          label="City *"
                          options={[
                            { value: 'Lahore', label: 'Lahore' }
                          ]}
                          value={newAddress.city}
                          onChange={(value) => setNewAddress({ ...newAddress, city: Array.isArray(value) ? value[0] : value })}
                          placeholder="Select city"
                          size="md"
                          variant="default"
                          showCheckmark={false}
                        />
                      </div>
                      {/* State/Province - Hidden field with default value */}
                      <input
                        type="hidden"
                        value={newAddress.state}
                      />
                      {/* Country - Hidden field with default value */}
                      <input
                        type="hidden"
                        value={newAddress.country}
                      />
                      {/* Postal Code - Hidden field with default value */}
                      <input type="hidden" value={newAddress.postalCode} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Currently delivering to Lahore only
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Delivery Instructions
                      </label>
                      <textarea
                        value={newAddress.instructions}
                        onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                        rows={3}
                        className="textarea-field"
                        placeholder="Any special delivery instructions..."
                      />
                    </div>
                  </div>
                ) : isFetchingAddresses ? (
                  <div className="flex items-center justify-center py-10 gap-3 text-neutral-400">
                    <span className="w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading addresses…</span>
                  </div>
                ) : (
                  /* Logged-in User Address Selection */
                  addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex items-start space-x-3 p-3 sm:p-4 border rounded-xl cursor-pointer transition-colors ${selectedAddress === address.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddress === address.id}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="mt-1 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-neutral-900 truncate">{address.fullName}</h3>
                              <span className="text-xs text-neutral-500 capitalize flex-shrink-0 ml-2">{address.type}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-600 mt-1">{address.phone}</p>
                            <p className="text-xs sm:text-sm text-neutral-600">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-600">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-600">{address.country}</p>
                            {address.instructions && (
                              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                                <strong>Instructions:</strong> {address.instructions}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icon name="location" className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-600 mb-4">No addresses found</p>
                    </div>
                  )
                )}

                {checkoutMode === 'login' && (
                  <button
                    onClick={handleShowAddressForm}
                    className="w-full mt-4 border-2 border-dashed border-neutral-300 rounded-lg py-3 sm:py-4 text-neutral-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Icon name="plus" className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Add New Address</span>
                  </button>
                )}

                {/* Address Form */}
                {showAddressForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 sm:mt-6 p-3 sm:p-4 border border-neutral-100 rounded-xl bg-neutral-50"
                  >
                    <form onSubmit={handleCreateAddress} className="space-y-3 sm:space-y-4">
                      {/* Show contact info as read-only for logged-in users, editable for guests */}
                      {user ? (
                        <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                          <h4 className="text-xs sm:text-sm font-medium text-primary-800 mb-2">Contact Information</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs font-medium text-primary-700 mb-1">
                                Full Name
                              </label>
                              <div className="px-3 py-2 bg-white border border-primary-100 rounded-md text-neutral-700">
                                {user.name}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-primary-700 mb-1">
                                Phone Number
                              </label>
                              <div className="px-3 py-2 bg-white border border-primary-100 rounded-md text-neutral-700">
                                {user.phone}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.fullName}
                              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              required
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              onBlur={(e) => validateAddressPhone(e.target.value)}
                              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${addressPhoneError ? 'border-error-500' : 'border-neutral-200'}`}
                              placeholder={getPhonePlaceholder()}
                            />
                            {addressPhoneError && (
                              <p className="mt-1 text-sm text-error-600">{addressPhoneError}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <Dropdown
                          label="City *"
                          options={[{ value: 'Lahore', label: 'Lahore' }]}
                          value={newAddress.city}
                          onChange={(value) => setNewAddress({ ...newAddress, city: Array.isArray(value) ? value[0] : value })}
                          placeholder="Select city"
                          size="md"
                          variant="default"
                          showCheckmark={false}
                        />
                        <p className="text-xs text-neutral-400 mt-1">Currently delivering to Lahore only</p>
                        <input type="hidden" value={newAddress.state} />
                        <input type="hidden" value={newAddress.country} />
                        <input type="hidden" value={newAddress.postalCode} />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                            className="rounded border-neutral-200 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-neutral-700">Set as default address</span>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          type="submit"
                          className="flex-1 btn-primary py-2"
                        >
                          Add Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="flex-1 btn-outline py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Payment Method</h2>
              </div>

              <div className="p-5">
                <div className="space-y-4">
                  {[
                    { value: 'cash_on_delivery', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
                    { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer to our bank account' }
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === method.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-neutral-900">{method.label}</h3>
                        <p className="text-xs text-neutral-600">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Bank Transfer Details */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary-50 border border-primary-100 rounded-lg">
                    <h3 className="text-sm font-semibold text-primary-800 mb-3">Bank Transfer Details</h3>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-xl border border-primary-100">
                        <h4 className="text-xs sm:text-sm font-medium text-neutral-900 mb-2 sm:mb-3">Account Information</h4>
                        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-neutral-700">
                          {publicSettings.bank_name && <p><span className="font-medium">Bank:</span> {publicSettings.bank_name}</p>}
                          {publicSettings.bank_account_name && <p><span className="font-medium">Account:</span> {publicSettings.bank_account_name}</p>}
                          {publicSettings.bank_account_number && <p><span className="font-medium">Account Number:</span> {publicSettings.bank_account_number}</p>}
                          {publicSettings.bank_iban && <p className="break-all"><span className="font-medium">IBAN:</span> {publicSettings.bank_iban}</p>}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-primary-100">
                        <h4 className="text-xs sm:text-sm font-medium text-neutral-900 mb-2">Transfer Amount</h4>
                        <p className="text-xl sm:text-2xl font-bold text-primary-700">
                          ₨{fmt((cartState.totalPrice || 0) + (deliveryCalculation?.deliveryFee || 0))}
                        </p>
                      </div>

                      <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-xs text-neutral-500">
                        <p className="text-xs sm:text-sm text-neutral-700">
                          <strong>Simple Process:</strong> Transfer the exact amount above to our account.
                          {publicSettings.admin_whatsapp && (
                            <> Send payment screenshot to <strong>{publicSettings.admin_whatsapp}</strong> on WhatsApp to confirm your order.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Order Notes (Optional)</h2>
              </div>

              <div className="p-5">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special instructions for your order..."
                  className="textarea-field"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4 p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Order Summary</h2>
              </div>

              <div className="px-5 py-5 space-y-3 sm:space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartState.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-neutral-100">
                        <Image
                          src={item.image || '/images/placeholder.svg'}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-neutral-900 truncate">{item.name}</h4>
                        {item.selectedVariant && (
                          <p className="text-[10px] text-secondary-600 font-medium">{item.selectedVariant}</p>
                        )}
                        <p className="text-xs text-neutral-500">Qty: {item.quantity} × ₨{fmt(Number(item.price))}</p>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-neutral-900 flex-shrink-0">
                        ₨{fmt(Number(item.price) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-100 pt-3 sm:pt-4 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-neutral-600">Subtotal ({cartState.totalItems} items)</span>
                    <span className="font-medium">₨{fmt(cartState.totalPrice)}</span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-neutral-600">Delivery Fee</span>
                    <span className="font-medium">
                      {isCalculatingDelivery ? (
                        <span className="text-neutral-500">Calculating...</span>
                      ) : deliveryCalculation ? (
                        deliveryCalculation.isFree ? (
                          <span className="text-primary-600">Free</span>
                        ) : (
                          <span className="text-neutral-900">₨{fmt(deliveryCalculation.deliveryFee || 0)}</span>
                        )
                      ) : (
                        <span className="text-neutral-500">₨0</span>
                      )}
                    </span>
                  </div>

                  {/* Delivery Information */}
                  {deliveryCalculation && !isCalculatingDelivery && (
                    <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-xs text-neutral-500">
                      {deliveryCalculation.reason}
                    </div>
                  )}

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600 font-medium">You save</span>
                      <span className="font-semibold text-primary-600">-₨{fmt(totalSavings)}</span>
                    </div>
                  )}

                  <div className="border-t border-neutral-100 pt-2">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Total</span>
                      <span>
                        ₨{fmt((cartState.totalPrice || 0) + (deliveryCalculation?.deliveryFee || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Min order notice — shown when total is below threshold */}
                {(() => {
                  const minOrder = Number(publicSettings.min_order_amount);
                  return minOrder > 0 && cartState.totalPrice < minOrder ? (
                    <div className="flex items-start gap-2 bg-secondary-50 border border-secondary-200 rounded-xl px-3 py-2.5">
                      <svg className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                      <p className="text-xs text-secondary-700 leading-relaxed">
                        Minimum order is <span className="font-semibold">₨{Number(publicSettings.min_order_amount).toLocaleString('en-PK')}</span>.
                        Your cart is <span className="font-semibold">₨{(minOrder - cartState.totalPrice).toLocaleString('en-PK')}</span> short.
                      </p>
                    </div>
                  ) : null;
                })()}

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    isCreatingOrder ||
                    !!guestPhoneError ||
                    !!addressPhoneError ||
                    (Number(publicSettings.min_order_amount) > 0 && cartState.totalPrice < Number(publicSettings.min_order_amount)) ||
                    (checkoutMode === 'guest'
                      ? (!guestInfo.name || !guestInfo.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.postalCode)
                      : !selectedAddress
                    )
                  }
                  className="btn-cta w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {isCreatingOrder ? (
                    <>
                      <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky mobile Place Order bar ────────────────────────────────── */}
      <div className="fixed bottom-16 inset-x-0 z-30 lg:hidden">
        <div className="mx-3 mb-2 bg-white rounded-2xl border border-neutral-100 shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-400">
              {cartState.totalItems} {cartState.totalItems === 1 ? 'item' : 'items'}
              {deliveryCalculation?.isFree ? ' · Free delivery' : deliveryCalculation?.deliveryFee ? ` · +₨${fmt(deliveryCalculation.deliveryFee)} delivery` : ''}
            </div>
            <div className="text-base font-bold text-neutral-900 tabular-nums">
              ₨{fmt((cartState.totalPrice || 0) + (deliveryCalculation?.deliveryFee || 0))}
            </div>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={
              isCreatingOrder ||
              !!guestPhoneError ||
              !!addressPhoneError ||
              (Number(publicSettings.min_order_amount) > 0 && cartState.totalPrice < Number(publicSettings.min_order_amount)) ||
              (checkoutMode === 'guest'
                ? (!guestInfo.name || !guestInfo.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.postalCode)
                : !selectedAddress
              )
            }
            className="btn-cta flex-shrink-0 py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingOrder ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
