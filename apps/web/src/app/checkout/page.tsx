'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import Dropdown from '@/components/ui/Dropdown';
import toast from 'react-hot-toast';
import {  DeliveryCalculation } from '@/services/settings';
import { configService } from '@/services/config';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';
import {  ADMIN_WHATSAPP, BANK_NAME, BANK_ACCOUNT_NAME, BANK_ACCOUNT_NUMBER, BANK_IBAN } from '@/config/env';

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
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'login' | 'guest' | 'register'>('select');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'bank_transfer'>('cash_on_delivery');
  const [notes, setNotes] = useState('');
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
      calculateDeliveryFee();
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
        reason: `Add ₨${amountNeeded.toFixed(2)} more to get free delivery (spend ₨${deliverySettings.freeDeliveryThreshold} or more)`
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
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
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
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
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

    setIsCreatingOrder(true);

    try {
      let orderData;

      if (checkoutMode === 'guest') {
        // Get validated phone number
        const validatedPhone = validateGuestPhone(guestInfo.phone);
        if (!validatedPhone) {
          toast.error('Please enter a valid Pakistani phone number');
          return;
        }

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
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          // Mark order as successfully placed before clearing cart
          orderPlacedSuccessfully.current = true;
          clearCart();
          toast.success('Order placed successfully!');
          router.push('/products');
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to place order');
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
            'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
          },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          const order = await response.json();
          // Mark order as successfully placed before clearing cart
          orderPlacedSuccessfully.current = true;
          clearCart();
          toast.success('Order placed successfully!');
          router.push(`/orders/${order.data?.id || order.id}`);
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to place order');
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Show loading state while cart is being loaded
  if (cartState.isLoading) {
    return (
      <div className="min-h-screen organic-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your basket...</p>
        </div>
      </div>
    );
  }

  if (cartState.items.length === 0) {
    return null; // Will redirect
  }

  // Show checkout mode selection for non-logged-in users
  if (checkoutMode === 'select') {
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
              <button
                onClick={() => router.push('/cart')}
                className="text-neutral-500 hover:text-primary-600 transition-colors"
              >
                Basket
              </button>
              <Icon name="chevron-right" className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-900 font-medium">Checkout</span>
            </nav>
          </div>
        </div>

      <div className="container-custom py-4 sm:py-6 lg:py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Checkout Options</h1>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Guest Checkout */}
                <button
                  onClick={() => setCheckoutMode('guest')}
                  className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors text-left"
                >
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">Guest Checkout</h3>
                  <p className="text-xs sm:text-sm text-gray-600">No account required</p>
                </button>

                {/* Login */}
                <button
                  onClick={() => router.push('/auth/login')}
                  className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors text-left"
                >
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">Login</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Access saved addresses</p>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                  Don't have an account?
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="text-gray-700 hover:text-gray-900 font-medium ml-1"
                  >
                    Create one here
                  </button>
                </p>
              </div>
            </div>
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
            <button
              onClick={() => router.push('/cart')}
              className="text-neutral-500 hover:text-primary-600 transition-colors"
            >
              Basket
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-900 font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Guest Information Form */}
            {checkoutMode === 'guest' && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Contact Information</h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestInfo.phone}
                        onChange={(e) => {
                          setGuestInfo({ ...guestInfo, phone: e.target.value });
                          validateGuestPhone(e.target.value);
                        }}
                        onBlur={(e) => validateGuestPhone(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${guestPhoneError ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder={getPhonePlaceholder()}
                      />
                      {guestPhoneError && (
                        <p className="mt-1 text-sm text-red-600">{guestPhoneError}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        placeholder="your@email.com"
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        We'll use this to send you order updates and tracking information
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Delivery Address</h2>
              </div>

              <div className="p-4 sm:p-6">
                {checkoutMode === 'guest' ? (
                  /* Guest Address Form */
                  <div className="space-y-4">
                    {/* Contact Information Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Delivery Contact</h3>
                      <div className="text-sm text-gray-600">
                        <p><span className="font-medium">Name:</span> {guestInfo.name}</p>
                        <p><span className="font-medium">Phone:</span> {guestInfo.phone}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Street address, house number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={newAddress.addressLine2}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
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
                        <input
                          type="hidden"
                          value={newAddress.postalCode}
                        />
                      </div>

                    {/* Country - Hidden field with default value */}
                    <input
                      type="hidden"
                      value={newAddress.country}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Instructions
                      </label>
                      <textarea
                        value={newAddress.instructions}
                        onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Any special delivery instructions..."
                      />
                    </div>
                  </div>
                ) : (
                  /* Logged-in User Address Selection */
                  addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex items-start space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress === address.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddress === address.id}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{address.fullName}</h3>
                              <span className="text-xs text-gray-500 capitalize flex-shrink-0 ml-2">{address.type}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{address.phone}</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">{address.country}</p>
                            {address.instructions && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                <strong>Instructions:</strong> {address.instructions}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icon name="location" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No addresses found</p>
                    </div>
                  )
                )}

                {checkoutMode === 'login' && (
                  <button
                    onClick={handleShowAddressForm}
                    className="w-full mt-4 border-2 border-dashed border-gray-300 rounded-lg py-3 sm:py-4 text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors flex items-center justify-center space-x-2"
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
                    className="mt-4 sm:mt-6 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <form onSubmit={handleCreateAddress} className="space-y-3 sm:space-y-4">
                      {/* Show contact info as read-only for logged-in users, editable for guests */}
                      {user ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                          <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-2">Contact Information</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs font-medium text-blue-700 mb-1">
                                Full Name
                              </label>
                              <div className="px-3 py-2 bg-white border border-blue-200 rounded-md text-gray-700">
                                {user.name}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-blue-700 mb-1">
                                Phone Number
                              </label>
                              <div className="px-3 py-2 bg-white border border-blue-200 rounded-md text-gray-700">
                                {user.phone}
                              </div>
                            </div>
                          </div>
                        </div>
                        ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddress.fullName}
                              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              required
                              value={newAddress.phone}
                              onChange={(e) => {
                                setNewAddress({ ...newAddress, phone: e.target.value });
                                validateAddressPhone(e.target.value);
                              }}
                              onBlur={(e) => validateAddressPhone(e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${addressPhoneError ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder={getPhonePlaceholder()}
                            />
                            {addressPhoneError && (
                              <p className="mt-1 text-sm text-red-600">{addressPhoneError}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
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
                        <input
                          type="hidden"
                          value={newAddress.postalCode}
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Set as default address</span>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors text-sm sm:text-base"
                        >
                          Add Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
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
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Payment Method</h2>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {[
                    { value: 'cash_on_delivery', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
                    { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer to our bank account' }
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === method.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">{method.label}</h3>
                        <p className="text-xs text-gray-600">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Bank Transfer Details */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">Bank Transfer Details</h3>
                    <div className="space-y-3">
                      <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Account Information</h4>
                        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                          {BANK_NAME && <p><span className="font-medium">Bank:</span> {BANK_NAME}</p>}
                          {BANK_ACCOUNT_NAME && <p><span className="font-medium">Account:</span> {BANK_ACCOUNT_NAME}</p>}
                          {BANK_ACCOUNT_NUMBER && <p><span className="font-medium">Account Number:</span> {BANK_ACCOUNT_NUMBER}</p>}
                          {BANK_IBAN && <p className="break-all"><span className="font-medium">IBAN:</span> {BANK_IBAN}</p>}
                        </div>
                      </div>

                      <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Transfer Amount</h4>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          ₨{((cartState.totalPrice || 0) + (deliveryCalculation?.deliveryFee || 0)).toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs sm:text-sm text-blue-800">
                          <strong>Simple Process:</strong> Transfer the exact amount above to our account.
                          {ADMIN_WHATSAPP && (
                            <> Send payment screenshot to <strong>{ADMIN_WHATSAPP}</strong> on WhatsApp to confirm your order.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Notes (Optional)</h2>
              </div>

              <div className="p-4 sm:p-6">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special instructions for your order..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
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
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartState.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ₨{item.price}</p>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0">
                        ₨{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-3 sm:pt-4 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Subtotal ({cartState.totalItems} items)</span>
                    <span className="font-medium">₨{cartState.totalPrice.toFixed(2)}</span>
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

                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Total</span>
                      <span>
                        ₨{((cartState.totalPrice || 0) + (deliveryCalculation?.deliveryFee || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    isCreatingOrder ||
                    !!guestPhoneError ||
                    !!addressPhoneError ||
                    (checkoutMode === 'guest'
                      ? (!guestInfo.name || !guestInfo.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.postalCode)
                      : !selectedAddress
                    )
                  }
                  className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-white py-3 sm:py-4 rounded-lg hover:from-orange-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {isCreatingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
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
    </div>
  );
}
