'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import ProductLoader from '@/components/ui/ProductLoader';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { configService } from '@/services/config';
import { usePublicSettings } from '@/hooks/usePublicSettings';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  const { settings }                   = usePublicSettings();
  const minOrderAmount                  = settings.min_order_amount;
  const [isUpdating, setIsUpdating]    = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee]  = useState<number>(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [deliveryReason, setDeliveryReason] = useState('');
  const [calcLoading, setCalcLoading]  = useState(false);
  const [showConfirm, setShowConfirm]  = useState(false);
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
        setDeliveryFee(0); setIsFreeDelivery(true); setDeliveryReason('');
        return;
      }
      if (state.totalPrice >= s.freeDeliveryThreshold) {
        setDeliveryFee(0); setIsFreeDelivery(true);
        setDeliveryReason('Your order qualifies for free delivery!');
        return;
      }
      const needed = s.freeDeliveryThreshold - state.totalPrice;
      setDeliveryFee(s.deliveryFee); setIsFreeDelivery(false);
      setDeliveryReason(`Add ₨${fmt(needed)} more for free delivery`);
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

  const grandTotal = state.totalPrice + deliveryFee;
  const belowMin   = minOrderAmount > 0 && state.totalPrice < minOrderAmount;
  const canCheckout = state.items.length > 0 && !belowMin && !state.items.some(i => !i.isAvailable);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-neutral-50">
        <Breadcrumb />
        <div className="container-custom py-20 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
            <ShoppingCartIcon className="w-12 h-12 text-neutral-300" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Your Basket is Empty</h1>
          <p className="text-neutral-400 mb-8 max-w-xs mx-auto">
            Looks like you haven't added anything yet. Start shopping for fresh organic products!
          </p>
          <button onClick={() => router.push('/products')} className="btn-cta mx-auto">
            <ShoppingCartIcon className="w-4 h-4" />
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 lg:pb-8">
      <Breadcrumb count={state.totalItems} />

      <div className="container-custom py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">

          {/* ── Cart items ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs overflow-hidden">

              {/* Section header */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                <h1 className="font-bold text-neutral-900">
                  Basket
                  <span className="ml-2 text-sm font-normal text-neutral-400">
                    ({state.totalItems} {state.totalItems === 1 ? 'item' : 'items'})
                  </span>
                </h1>
                <button
                  onClick={askClear}
                  className="text-error-500 hover:text-error-600 text-sm font-medium inline-flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-error-50"
                >
                  <Icon name="delete" className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>

              {/* Items list */}
              <div className="divide-y divide-neutral-50">
                <AnimatePresence initial={false}>
                  {state.items.map((item, i) => {
                    const origPrice  = item.variantOriginalPrice ?? item.originalPrice;
                    const hasDiscount = origPrice != null && origPrice > item.price;
                    const lineTotal  = item.price * item.quantity;
                    const key        = `${item.productId}-${item.selectedVariant ?? ''}`;
                    const spinning   = isUpdating === key;
                    const atOne      = item.quantity === 1;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 sm:px-5 py-4 flex gap-3 sm:gap-4">

                          {/* Image */}
                          <Link
                            href={`/products/${item.productId}`}
                            className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-neutral-100 hover:opacity-90 transition-opacity"
                          >
                            <Image
                              src={item.image || '/images/placeholder.svg'}
                              alt={item.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                            />
                          </Link>

                          {/* Details */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">

                            {/* Row 1: name + remove */}
                            <div className="flex items-start justify-between gap-2">
                              <Link href={`/products/${item.productId}`} className="hover:text-primary-600 transition-colors flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2">
                                  {item.name}
                                </h3>
                              </Link>
                              <button
                                onClick={() => askRemove(item.productId, item.selectedVariant, item.name)}
                                className="flex-shrink-0 p-1 text-neutral-300 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                                title="Remove item"
                              >
                                <Icon name="delete" className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Row 2: variant + availability */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.selectedVariant && (
                                <span className="text-xs font-medium text-secondary-700 bg-secondary-50 border border-secondary-100 px-2 py-0.5 rounded-md">
                                  {item.selectedVariant}
                                </span>
                              )}
                              {!item.isAvailable && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-50 text-error-600 border border-error-100">
                                  Out of Stock
                                </span>
                              )}
                            </div>

                            {/* Row 3: price */}
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-semibold text-neutral-900 tabular-nums">₨{fmt(item.price)}</span>
                              {hasDiscount && (
                                <span className="text-xs text-neutral-400 line-through tabular-nums">₨{fmt(origPrice!)}</span>
                              )}
                              <span className="text-xs text-neutral-400">/{item.unit}</span>
                            </div>

                            {/* Row 4: stepper + line total */}
                            <div className="flex items-center justify-between mt-1">
                              {/* Stepper */}
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => atOne
                                    ? askRemove(item.productId, item.selectedVariant, item.name)
                                    : handleQty(item.productId, item.selectedVariant, item.quantity - 1)
                                  }
                                  disabled={spinning}
                                  className={`w-8 h-8 flex items-center justify-center rounded-l-xl border transition-colors disabled:opacity-40 ${
                                    atOne
                                      ? 'border-error-200 bg-error-50 text-error-500 hover:bg-error-100'
                                      : 'border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                                  }`}
                                  title={atOne ? 'Remove item' : 'Decrease quantity'}
                                >
                                  {atOne
                                    ? <Icon name="delete" className="w-3 h-3" />
                                    : <Icon name="minus" className="w-3 h-3" />
                                  }
                                </button>
                                <div className="h-8 px-3 flex items-center justify-center border-y border-neutral-200 bg-white font-semibold text-neutral-900 text-sm tabular-nums min-w-[2.5rem] text-center">
                                  {spinning
                                    ? <span className="w-3 h-3 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin inline-block" />
                                    : item.quantity
                                  }
                                </div>
                                <button
                                  onClick={() => handleQty(item.productId, item.selectedVariant, item.quantity + 1)}
                                  disabled={spinning || !item.isAvailable}
                                  className="w-8 h-8 flex items-center justify-center rounded-r-xl border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                                >
                                  <Icon name="plus" className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Line total */}
                              <div className="text-right">
                                <div className="text-sm font-bold text-neutral-900 tabular-nums">₨{fmt(lineTotal)}</div>
                                {item.quantity > 1 && (
                                  <div className="text-[10px] text-neutral-400 tabular-nums">
                                    {item.quantity} × ₨{fmt(item.price)}
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Free delivery progress bar */}
              {!isFreeDelivery && !calcLoading && deliveryReason && (
                <div className="px-4 sm:px-5 py-3 border-t border-neutral-50 bg-primary-50/50">
                  <p className="text-xs text-primary-700 font-medium">{deliveryReason}</p>
                </div>
              )}
              {isFreeDelivery && deliveryReason && (
                <div className="px-4 sm:px-5 py-3 border-t border-neutral-50 bg-primary-50">
                  <div className="flex items-center gap-1.5 text-xs text-primary-700 font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {deliveryReason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Order summary ───────────────────────────────────────────────── */}
          <div className="lg:col-span-1 lg:self-start lg:sticky lg:top-4">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100">
                <h2 className="font-bold text-neutral-900">Order Summary</h2>
              </div>

              <div className="px-5 py-4 space-y-3">

                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal ({state.totalItems} {state.totalItems === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">₨{fmt(state.totalPrice)}</span>
                </div>

                {/* Savings */}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600 font-medium">Discount savings</span>
                    <span className="font-semibold text-primary-600 tabular-nums">-₨{fmt(totalSavings)}</span>
                  </div>
                )}

                {/* Delivery */}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Delivery</span>
                  <span className="font-semibold tabular-nums">
                    {calcLoading ? (
                      <span className="text-neutral-400 text-xs">Calculating…</span>
                    ) : isFreeDelivery ? (
                      <span className="text-primary-600">Free</span>
                    ) : deliveryFee > 0 ? (
                      <span className="text-neutral-900">₨{fmt(deliveryFee)}</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </span>
                </div>

                {/* Grand total */}
                <div className="border-t border-neutral-100 pt-3 flex justify-between">
                  <span className="text-base font-bold text-neutral-900">Total</span>
                  {calcLoading ? (
                    <span className="text-neutral-400 text-sm">Calculating…</span>
                  ) : (
                    <span className="text-lg font-bold text-neutral-900 tabular-nums">₨{fmt(grandTotal)}</span>
                  )}
                </div>
                {totalSavings > 0 && (
                  <p className="text-xs text-primary-600 text-right -mt-1">
                    You're saving ₨{fmt(totalSavings)} on this order
                  </p>
                )}

                {/* Min order notice */}
                {belowMin && (
                  <div className="flex items-start gap-2 bg-secondary-50 border border-secondary-200 rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                    <p className="text-xs text-secondary-700 leading-relaxed">
                      Minimum order is <span className="font-semibold">₨{fmt(minOrderAmount)}</span>.
                      Add <span className="font-semibold">₨{fmt(minOrderAmount - state.totalPrice)}</span> more to proceed.
                    </p>
                  </div>
                )}

                {/* CTAs */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={goToCheckout}
                    disabled={!canCheckout}
                    className="btn-cta w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="credit-card" className="w-4 h-4" />
                    Proceed to Checkout
                  </button>
                  <button onClick={() => router.push('/products')} className="btn-outline w-full">
                    <ShoppingCartIcon className="w-4 h-4" />
                    Continue Shopping
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky mobile checkout bar ────────────────────────────────────── */}
      <div className="fixed bottom-16 inset-x-0 z-30 lg:hidden">
        <div className="mx-3 mb-2 bg-white rounded-2xl border border-neutral-100 shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-400">
              {state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}
              {isFreeDelivery ? ' · Free delivery' : deliveryFee > 0 ? ` · +₨${fmt(deliveryFee)} delivery` : ''}
            </div>
            <div className="text-base font-bold text-neutral-900 tabular-nums">
              ₨{fmt(grandTotal)}
            </div>
          </div>
          <button
            onClick={goToCheckout}
            disabled={!canCheckout}
            className="btn-cta flex-shrink-0 py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {belowMin ? `₨${fmt(minOrderAmount - state.totalPrice)} more` : 'Checkout'}
          </button>
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

function Breadcrumb({ count }: { count?: number }) {
  const router = useRouter();
  return (
    <div className="bg-white border-b border-neutral-100">
      <div className="container-custom py-3">
        <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
          <button onClick={() => router.push('/')} className="hover:text-primary-600 transition-colors">
            Home
          </button>
          <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-900 font-medium">
            Basket{count !== undefined && count > 0 ? ` (${count})` : ''}
          </span>
        </nav>
      </div>
    </div>
  );
}
