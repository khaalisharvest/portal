'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import ProductLoader from '@/components/ui/ProductLoader';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';
import { settingsApi, DeliveryCalculation } from '@/services/settings';
import { configService } from '@/services/config';
import { useEffect } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [deliveryCalc, setDeliveryCalc] = useState<DeliveryCalculation | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'remove' | 'clear';
    productId?: string;
    selectedVariant?: string;
    productName?: string;
  } | null>(null);

  // ── Delivery fee ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.totalPrice > 0) calcDelivery();
  }, [state.totalPrice]);

  const calcDelivery = async () => {
    setCalcLoading(true);
    try {
      const s = await configService.getDeliverySettings();
      if (!s.isDeliveryEnabled) {
        setDeliveryCalc({ deliveryFee: 0, isFree: true, reason: 'Delivery is disabled' });
        return;
      }
      if (state.totalPrice >= s.freeDeliveryThreshold) {
        setDeliveryCalc({ deliveryFee: 0, isFree: true, reason: 'Your order qualifies for free delivery' });
        return;
      }
      const needed = s.freeDeliveryThreshold - state.totalPrice;
      setDeliveryCalc({
        deliveryFee: s.deliveryFee,
        isFree: false,
        reason: `Add ₨${fmt(needed)} more for free delivery (min ₨${fmt(s.freeDeliveryThreshold)})`,
      });
    } catch {
      // silent — show ₨0 fallback
    } finally {
      setCalcLoading(false);
    }
  };

  // ── Quantity & remove ─────────────────────────────────────────────────────

  const handleQty = (productId: string, variant: string | undefined, next: number) => {
    if (next < 1) {
      removeFromCart(productId, variant);
      toast.success('Item removed from basket');
      return;
    }
    setIsUpdating(`${productId}-${variant ?? ''}`);
    try {
      updateQuantity(productId, variant, next);
    } finally {
      setIsUpdating(null);
    }
  };

  const askRemove = (productId: string, variant: string | undefined, name: string) => {
    setPendingAction({ type: 'remove', productId, selectedVariant: variant, productName: name });
    setShowConfirm(true);
  };

  const askClear = () => {
    setPendingAction({ type: 'clear' });
    setShowConfirm(true);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'remove' && pendingAction.productId) {
      setIsUpdating(`${pendingAction.productId}-${pendingAction.selectedVariant ?? ''}`);
      removeFromCart(pendingAction.productId, pendingAction.selectedVariant);
      toast.success(`${pendingAction.productName} removed from basket`);
      setIsUpdating(null);
    } else if (pendingAction.type === 'clear') {
      clearCart();
      toast.success('Basket cleared');
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  // ── Checkout ──────────────────────────────────────────────────────────────

  const goToCheckout = () => {
    if (state.items.length === 0) { toast.error('Your basket is empty'); return; }
    const hasUnavailable = state.items.some(i => !i.isAvailable);
    if (hasUnavailable) {
      toast.error('Some items are unavailable. Please remove them before checking out.');
      return;
    }
    router.push('/checkout');
  };

  // ── Computed totals ───────────────────────────────────────────────────────

  const totalSavings = state.items.reduce((acc, item) => {
    const orig = item.variantOriginalPrice ?? item.originalPrice;
    if (orig && orig > item.price) acc += (orig - item.price) * item.quantity;
    return acc;
  }, 0);

  const deliveryFee = deliveryCalc?.deliveryFee ?? 0;
  const grandTotal = state.totalPrice + deliveryFee;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (state.isLoading) {
    return (
      <div className="min-h-screen organic-gradient flex items-center justify-center">
        <div className="text-center space-y-3">
          <ProductLoader size="lg" />
          <p className="text-neutral-500 text-sm">Loading your basket…</p>
        </div>
      </div>
    );
  }

  // ── Empty basket ──────────────────────────────────────────────────────────

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen organic-gradient">
        <Breadcrumb />
        <div className="container-custom py-16 text-center space-y-5">
          <div className="w-28 h-28 mx-auto">
            <Image src="/images/logo.png" alt="Khaalis Harvest" width={112} height={112} className="w-full h-full object-contain opacity-60" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Your Basket is Empty</h1>
          <p className="text-neutral-500">Add some organic products to get started!</p>
          <button onClick={() => router.push('/products')} className="btn-primary mx-auto">
            <Icon name="plus" className="w-4 h-4" />
            Browse Organic Products
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen organic-gradient">
      <Breadcrumb />

      <div className="container-custom py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* ── Cart items ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="card p-0 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h1 className="text-xl font-bold text-neutral-900">
                  Your Basket
                  <span className="ml-2 text-sm font-normal text-neutral-400">
                    ({state.totalItems} {state.totalItems === 1 ? 'item' : 'items'})
                  </span>
                </h1>
                <button
                  onClick={askClear}
                  className="text-error-500 hover:text-error-600 text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Icon name="delete" className="w-4 h-4" />
                  Clear Basket
                </button>
              </div>

              {/* Items */}
              <div className="divide-y divide-neutral-100">
                {state.items.map((item, i) => {
                  const origPrice = item.variantOriginalPrice ?? item.originalPrice;
                  const hasDiscount = origPrice != null && origPrice > item.price;
                  const lineTotal = item.price * item.quantity;
                  const spinning = isUpdating === `${item.productId}-${item.selectedVariant ?? ''}`;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.06 }}
                      className="p-4 sm:p-5"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {/* Image */}
                        <Link href={`/products/${item.productId}`} className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-neutral-100 hover:opacity-90 transition-opacity">
                          <Image
                            src={item.image || '/images/placeholder.svg'}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 relative">
                          {/* Remove button */}
                          <button
                            onClick={() => askRemove(item.productId, item.selectedVariant, item.name)}
                            className="absolute top-0 right-0 p-1.5 text-error-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors z-10"
                            title="Remove item"
                          >
                            <Icon name="delete" className="w-4 h-4" />
                          </button>

                          {/* Name */}
                          <Link href={`/products/${item.productId}`} className="block pr-8 hover:text-primary-600 transition-colors">
                            <h3 className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-2 leading-snug">
                              {item.name}
                            </h3>
                          </Link>

                          {/* Variant */}
                          {item.selectedVariant && (
                            <p className="text-xs text-secondary-600 font-medium mt-0.5">{item.selectedVariant}</p>
                          )}

                          {/* Unit price row */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-neutral-900">₨{fmt(item.price)}</span>
                            {hasDiscount && (
                              <span className="text-xs text-neutral-400 line-through">₨{fmt(origPrice!)}</span>
                            )}
                            <span className="text-xs text-neutral-400">/ {item.unit}</span>
                            {!item.isAvailable && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-error-50 text-error-600 border border-error-100">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          {/* Quantity stepper + line total */}
                          <div className="flex items-center justify-between mt-3">
                            {/* Stepper */}
                            <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-white">
                              <button
                                onClick={() => handleQty(item.productId, item.selectedVariant, item.quantity - 1)}
                                disabled={spinning}
                                className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                              >
                                <Icon name="minus" className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 py-1.5 font-semibold text-neutral-900 min-w-[2.5rem] text-center text-sm tabular-nums">
                                {spinning ? (
                                  <span className="animate-spin inline-block h-3.5 w-3.5 rounded-full border-b-2 border-primary-500" />
                                ) : item.quantity}
                              </span>
                              <button
                                onClick={() => handleQty(item.productId, item.selectedVariant, item.quantity + 1)}
                                disabled={spinning || !item.isAvailable}
                                className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                              >
                                <Icon name="plus" className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Line total */}
                            <div className="text-right">
                              <div className="text-base font-bold text-neutral-900">₨{fmt(lineTotal)}</div>
                              <div className="text-xs text-neutral-400 tabular-nums">
                                {item.quantity} × ₨{fmt(item.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Order summary ───────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="card p-0 overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="text-base font-bold text-neutral-900">Order Summary</h2>
              </div>

              <div className="px-5 py-5 space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal ({state.totalItems} {state.totalItems === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-neutral-900">₨{fmt(state.totalPrice)}</span>
                </div>

                {/* Savings — only shown when there are actual discounts */}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600 font-medium">You save</span>
                    <span className="font-semibold text-primary-600">-₨{fmt(totalSavings)}</span>
                  </div>
                )}

                {/* Delivery */}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Delivery</span>
                  <span className="font-semibold">
                    {calcLoading ? (
                      <span className="text-neutral-400 text-xs">Calculating…</span>
                    ) : deliveryCalc ? (
                      deliveryCalc.isFree ? (
                        <span className="text-primary-600 font-semibold">Free</span>
                      ) : (
                        <span className="text-neutral-900">₨{fmt(deliveryCalc.deliveryFee)}</span>
                      )
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </span>
                </div>

                {/* Delivery info */}
                {deliveryCalc && !calcLoading && (
                  <div className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 leading-relaxed">
                    {deliveryCalc.reason}
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-neutral-100 pt-3">
                  <div className="flex justify-between text-lg font-bold text-neutral-900">
                    <span>Total</span>
                    {calcLoading ? (
                      <span className="text-neutral-400 text-sm">Calculating...</span>
                    ) : (
                      <span>₨{fmt(grandTotal)}</span>
                    )}
                  </div>
                  {totalSavings > 0 && (
                    <p className="text-xs text-primary-600 mt-1 text-right">
                      You're saving ₨{fmt(totalSavings)} on this order
                    </p>
                  )}
                </div>

                {/* CTAs */}
                <div className="space-y-2 pt-1">
                  <button onClick={goToCheckout} className="btn-cta w-full">
                    <Icon name="credit-card" className="w-4 h-4" />
                    Proceed to Checkout
                  </button>
                  <button onClick={() => router.push('/products')} className="btn-outline w-full">
                    <Icon name="plus" className="w-4 h-4" />
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingAction(null); }}
        onConfirm={confirmAction}
        title={pendingAction?.type === 'remove' ? 'Remove Item' : 'Clear Basket'}
        message={
          pendingAction?.type === 'remove'
            ? `Remove "${pendingAction.productName}" from your basket?`
            : 'Remove all items from your basket?'
        }
        confirmText={pendingAction?.type === 'remove' ? 'Remove' : 'Clear All'}
        cancelText="Keep"
        type="danger"
        isLoading={isUpdating !== null}
      />
    </div>
  );
}

function Breadcrumb() {
  const router = useRouter();
  return (
    <div className="bg-white border-b border-neutral-100">
      <div className="container-custom py-3">
        <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
          <button onClick={() => router.push('/')} className="hover:text-primary-600 transition-colors">
            Home
          </button>
          <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-900 font-medium">Basket</span>
        </nav>
      </div>
    </div>
  );
}
