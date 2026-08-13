'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import ProductLoader from '@/components/ui/ProductLoader';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useWishlist } from '@/contexts/WishlistContext';
import { COUNTABLE_UNITS } from '@/constants/units';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Variant {
  name: string;
  price: number;
  originalPrice?: number;
  isAvailable?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  category?: { id: string; name: string; description?: string };
  productType?: { id: string; displayName: string; color?: string };
  specifications?: Record<string, any>;
  isOrganic: boolean;
  isAvailable: boolean;
  unit: string;
  featured: boolean;
  tags?: string[];
  hasVariants?: boolean;
  variantName?: string;
  variants?: Variant[];
  inventoryType?: 'marketplace' | 'warehouse';
  marketplaceInfo?: { supplierName?: string; supplierContact?: string };
  inventory?: Array<{ quantity: number; reservedQuantity: number; availableQuantity: number; isActive: boolean }>;
  // Food labeling
  ingredients?: string;
  nutritionalInfo?: Record<string, string>;
  expiryInfo?: string;
  batchNumber?: string;
  cprNumber?: string;
  allergens?: string;
  manufacturerInfo?: string;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  createdAt: string;
  user?: { name: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pluralise a unit for display in text. */
function unitLabel(unit: string, qty = 1): string {
  const map: Record<string, string> = {
    kg: 'kg', g: 'g', lb: 'lb',
    liter: qty > 1 ? 'liters' : 'liter',
    ml: 'ml',
    piece: qty > 1 ? 'pieces' : 'piece',
    dozen: qty > 1 ? 'dozens' : 'dozen',
    pack: qty > 1 ? 'packs' : 'pack',
    bunch: qty > 1 ? 'bunches' : 'bunch',
    box: qty > 1 ? 'boxes' : 'box',
    bag: qty > 1 ? 'bags' : 'bag',
    bottle: qty > 1 ? 'bottles' : 'bottle',
    jar: qty > 1 ? 'jars' : 'jar',
    plant: qty > 1 ? 'plants' : 'plant',
    seedling: qty > 1 ? 'seedlings' : 'seedling',
  };
  return map[unit] ?? unit;
}

/** Quantity label for the stepper (e.g. "Weight (kg):" or "Quantity:"). */
function qtyLabel(unit: string): string {
  if (unit === 'kg') return 'Weight (kg):';
  if (unit === 'liter') return 'Volume (L):';
  return 'Quantity:';
}

function StarRow({
  rating,
  interactive = false,
  onRate,
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={interactive && onRate ? () => onRate(star) : undefined}
          className={interactive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
        >
          <svg
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-neutral-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { settings: publicSettings } = usePublicSettings();
  const { refresh: refreshWishlistCount } = useWishlist();

  const [activeTab, setActiveTab] = useState<'details' | 'labeling' | 'reviews'>('reviews');
  const tabsRef = useRef<HTMLDivElement>(null);

  const switchToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const ratingCounts = useMemo(() => {
    const c: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { c[r.rating] = (c[r.rating] ?? 0) + 1; });
    return c;
  }, [reviews]);

  const hasSpecs = useMemo(() =>
    !!product?.specifications &&
    typeof product.specifications === 'object' &&
    !Array.isArray(product.specifications) &&
    Object.keys(product.specifications).length > 0,
  [product?.specifications]);

  const hasLabeling = useMemo(() =>
    !!(product?.ingredients || product?.cprNumber || product?.expiryInfo ||
       product?.allergens || product?.manufacturerInfo || product?.batchNumber ||
       (product?.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0)),
  [product]);

  const totalAvailableStock = useMemo(() => {
    if (!product?.inventory?.length || product.inventoryType !== 'warehouse') return null;
    if (!COUNTABLE_UNITS.has(product.unit as any)) return null; // weight/volume — only show in-stock dot, not count
    return product.inventory
      .filter(i => i.isActive)
      .reduce((sum, i) => sum + (i.availableQuantity ?? Math.max(0, i.quantity - i.reservedQuantity)), 0);
  }, [product]);

  // ── Data fetching ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!params.id) return;
    const id = params.id as string;
    fetchProduct(id);
    fetchReviews(id);
    if (user) {
      fetchWishlistStatus(id);
      fetchUserReview(id);
    }
  }, [params.id, user]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const json = await res.json();
      setProduct(json.data ?? json);
    } catch {
      // product will remain null → not-found screen shown
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (id: string) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/v1/reviews?productId=${id}`);
      const json = await res.json();
      const payload = json?.data ?? json;
      setReviews(payload?.reviews ?? (Array.isArray(payload) ? payload : []));
    } catch {
      // silent
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchUserReview = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/reviews?productId=${id}&mine=true`, { credentials: 'include' });
      if (!res.ok) { setUserReview(null); return; }
      const json = await res.json();
      // Only treat as a real review if we got an object with an id field
      const candidate = json?.data ?? json;
      setUserReview(candidate && typeof candidate === 'object' && 'id' in candidate ? candidate as Review : null);
    } catch { setUserReview(null); }
  };

  const fetchWishlistStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/wishlist/${id}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const payload = json?.data ?? json;
        setIsWishlisted(payload?.isWishlisted ?? payload?.wishlisted ?? false);
      }
    } catch {
      // silent
    }
  };

  // ── Price helpers ───────────────────────────────────────────────────────────

  const currentVariant = product?.hasVariants && selectedVariant
    ? product.variants?.find(v => v.name === selectedVariant)
    : undefined;

  const currentPrice = Number(currentVariant?.price ?? product?.price ?? 0);
  const currentOriginal = Number(currentVariant?.originalPrice ?? product?.originalPrice ?? 0) || undefined;
  const hasDiscount = currentOriginal != null && currentOriginal > currentPrice;
  const discountPct = hasDiscount ? Math.round(((currentOriginal! - currentPrice) / currentOriginal!) * 100) : 0;
  const isVariantSelected = !product?.hasVariants || selectedVariant !== null;

  // ── Cart / wishlist actions ─────────────────────────────────────────────────

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      addToCart({
        productId: product.id,
        name: product.name,
        price: currentPrice,
        originalPrice: currentOriginal,
        quantity,
        image: product.images?.[0] || '/images/placeholder.svg',
        unit: product.unit,
        specifications: product.specifications,
        isAvailable: product.isAvailable,
        selectedVariant: selectedVariant ?? undefined,
        variantPrice: currentPrice,
        variantOriginalPrice: currentOriginal,
      });
      toast.success(`${product.name} added to basket`, {
        duration: 3500,
        action: { label: 'View Basket', onClick: () => router.push('/cart') },
      });
    } catch {
      toast.error('Failed to add to basket. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      originalPrice: currentOriginal,
      quantity,
      image: product.images?.[0] || '/images/placeholder.svg',
      unit: product.unit,
      specifications: product.specifications,
      isAvailable: product.isAvailable,
      selectedVariant: selectedVariant ?? undefined,
      variantPrice: currentPrice,
      variantOriginalPrice: currentOriginal,
    });
    router.push('/checkout');
  };

  const handleToggleWishlist = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!product) return;
    setWishlistLoading(true);
    const optimistic = !isWishlisted;
    setIsWishlisted(optimistic);
    try {
      const res = await fetch(`/api/v1/wishlist/${product.id}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const actual = (json?.data ?? json)?.added ?? optimistic;
      setIsWishlisted(actual);
      refreshWishlistCount();
      toast.success(actual ? 'Added to wishlist' : 'Removed from wishlist', {
        action: actual ? { label: 'View Wishlist', onClick: () => router.push('/wishlist') } : undefined,
      });
    } catch {
      setIsWishlisted(!optimistic); // revert
      toast.error('Could not update wishlist. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) { toast.error('Please write a review comment'); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/v1/reviews?productId=${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reviewForm),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message || json?.error || 'Failed to submit review';
        throw new Error(Array.isArray(msg) ? msg[0] : msg);
      }
      setUserReview(json?.data ?? json);
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewModal(false);
      toast.success('Review submitted — it will appear once approved.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    setDeletingReview(true);
    try {
      const res = await fetch(
        `/api/v1/reviews/${userReview.id}?productId=${params.id}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!res.ok) throw new Error('Failed to delete review');
      setUserReview(null);
      fetchReviews(params.id as string);
      toast.success('Review removed.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review');
    } finally {
      setDeletingReview(false);
    }
  };

  // ── Loading / not-found screens ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-3">
          <ProductLoader size="lg" />
          <p className="text-neutral-500 text-sm">Loading product…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center">
            <Icon name="alert-circle" className="w-8 h-8 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Product Not Found</h1>
          <p className="text-neutral-500">This product doesn't exist or has been removed.</p>
          <button onClick={() => router.push('/products')} className="btn-primary">
            Browse All Products
          </button>
        </div>
      </div>
    );
  }

  // ── Review stats ────────────────────────────────────────────────────────────

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
            <button onClick={() => router.push('/')} className="hover:text-primary-600 transition-colors">
              Home
            </button>
            <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
            <button onClick={() => router.push('/products')} className="hover:text-primary-600 transition-colors">
              Products
            </button>
            <Icon name="chevron-right" className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-neutral-900 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 space-y-10">

        {/* ── Product main block ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Image gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
              <Image
                src={product.images?.[selectedImage] || '/images/placeholder.svg'}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-18 h-18 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      width={72}
                      height={72}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5">

            {/* ── Row 1: Meta + wishlist ── */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {product.category && (
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {product.category.name}
                  </span>
                )}
                {product.productType && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: product.productType.color || '#3d7a2e' }}
                    >
                      {product.productType.displayName}
                    </span>
                  </>
                )}
                {product.isOrganic && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="badge-organic text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center">
                      Organic
                    </span>
                  </>
                )}
                {!product.isAvailable && (
                  <span className="text-xs font-semibold text-error-600 bg-error-50 border border-error-100 px-2 py-0.5 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Wishlist — animated heart */}
              <motion.button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                whileTap={{ scale: 0.85 }}
                className="flex-shrink-0 p-2 -mr-1 rounded-full hover:bg-error-50 transition-colors disabled:opacity-40"
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <motion.div
                  key={isWishlisted ? 'filled' : 'empty'}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  {isWishlisted ? (
                    <svg className="w-6 h-6 text-error-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-neutral-300 hover:text-error-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </motion.div>
              </motion.button>
            </div>

            {/* ── Row 2: Name ── */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">{product.name}</h1>
              {product.description && (
                <p className="text-neutral-500 leading-relaxed mt-2 text-sm">{product.description}</p>
              )}
            </div>

            {/* ── Row 3: Rating ── */}
            {reviews.length > 0 && (
              <button onClick={switchToReviews} className="flex items-center gap-2 group w-fit -mt-1">
                <StarRow rating={Math.round(avgRating)} />
                <span className="text-sm text-neutral-400 group-hover:text-primary-600 transition-colors">
                  {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </button>
            )}

            {/* ── Row 4: Price (clean, no box) ── */}
            <div className="border-t border-neutral-100 pt-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-bold text-neutral-900 tabular-nums">
                  ₨{currentPrice.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-neutral-300 line-through tabular-nums">
                      ₨{currentOriginal!.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-error-500 text-white">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">per {product.unit}</p>
            </div>

            {/* ── Row 5: Variant selector ── */}
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-neutral-700">
                  {product.variantName || 'Option'}
                  {selectedVariant && <span className="font-normal text-neutral-400"> — {selectedVariant}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant === v.name;
                    const isOOS = !v.isAvailable;
                    const origPrice = v.originalPrice && Number(v.originalPrice) > Number(v.price)
                      ? Number(v.originalPrice) : null;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => !isOOS && setSelectedVariant(v.name)}
                        disabled={isOOS}
                        className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-150 select-none
                          ${isOOS
                            ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed'
                            : isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 cursor-pointer'
                          }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />}
                        <span>{v.name}</span>
                        <span className="text-xs tabular-nums opacity-70">₨{Number(v.price).toLocaleString('en-PK')}</span>
                        {origPrice && !isOOS && (
                          <span className="text-xs text-neutral-300 line-through tabular-nums">₨{origPrice.toLocaleString('en-PK')}</span>
                        )}
                        {isOOS && <span className="text-[10px] font-semibold text-neutral-400">OOS</span>}
                      </button>
                    );
                  })}
                </div>
                {!isVariantSelected && (
                  <p className="text-xs text-secondary-600 bg-secondary-50 border border-secondary-100 rounded-lg px-3 py-2">
                    Please select a {product.variantName?.toLowerCase() || 'option'} to continue
                  </p>
                )}
              </div>
            )}

            {/* ── Row 6: Qty + stock indicator (inline) ── */}
            <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-4">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-l-xl border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <Icon name="minus" className="w-3.5 h-3.5" />
                </button>
                <div className="h-9 px-5 flex items-center justify-center border-y border-neutral-200 bg-white font-semibold text-neutral-900 tabular-nums min-w-[3.5rem] text-center">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-r-xl border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                </button>
                <span className="ml-2 text-sm text-neutral-400">{unitLabel(product.unit, quantity)}</span>
              </div>

              {/* Stock / availability */}
              {product.isAvailable && (
                totalAvailableStock !== null ? (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                    totalAvailableStock <= 5 ? 'text-error-600' : totalAvailableStock <= 20 ? 'text-warning-600' : 'text-primary-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      totalAvailableStock <= 5 ? 'bg-error-500 animate-pulse' : totalAvailableStock <= 20 ? 'bg-warning-500' : 'bg-primary-500'
                    }`} />
                    {totalAvailableStock <= 5 ? `Only ${totalAvailableStock} left` : totalAvailableStock <= 20 ? `${totalAvailableStock} remaining` : 'In stock'}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                    Available
                  </div>
                )
              )}

              {/* Total (inline, minimal) */}
              {quantity > 1 && (
                <div className="text-right hidden sm:block">
                  <div className="text-base font-bold text-neutral-900 tabular-nums">
                    ₨{(currentPrice * quantity).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-neutral-400">total</div>
                </div>
              )}
            </div>

            {/* ── Row 7: CTAs ── */}
            <div className="flex flex-col gap-2.5 pb-2">
              <button
                onClick={handleAddToCart}
                disabled={!product.isAvailable || addingToCart || !isVariantSelected}
                className="btn-cta w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Adding…</span></>
                ) : !product.isAvailable ? (
                  <><Icon name="x-circle" className="w-4 h-4" /><span>Out of Stock</span></>
                ) : !isVariantSelected ? (
                  <><Icon name="shopping-cart" className="w-4 h-4" /><span>Select {product.variantName || 'Option'}</span></>
                ) : (
                  <><Icon name="shopping-cart" className="w-4 h-4" /><span>Add to Basket</span></>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.isAvailable || !isVariantSelected}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="credit-card" className="w-4 h-4" />
                <span>{!product.isAvailable ? 'Unavailable' : !isVariantSelected ? `Select ${product.variantName || 'Option'}` : 'Buy Now'}</span>
              </button>
            </div>

            {/* ── Row 8: Delivery + trust (compact, inline) ── */}
            <div className="border-t border-neutral-100 pt-4 space-y-2.5">
              {/* Delivery line */}
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>
                  {publicSettings.free_delivery_threshold > 0
                    ? `Free delivery above ₨${publicSettings.free_delivery_threshold.toLocaleString('en-PK')}`
                    : 'Fast delivery across Punjab'}
                  {publicSettings.delivery_fee > 0 && ` · ₨${publicSettings.delivery_fee} fee`}
                </span>
              </div>

              {/* Trust row — inline, not boxed */}
              <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  PFA Licensed
                </span>
                <span className="text-neutral-200">|</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-earth-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Pure & Natural
                </span>
                <span className="text-neutral-200">|</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Cash on Delivery
                </span>
              </div>
            </div>

            {/* ── Tags (minimal) ── */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs text-neutral-400 bg-neutral-100">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── Sticky mobile CTA bar ────────────────────────────────────────── */}
        <div className="fixed bottom-16 inset-x-0 z-30 lg:hidden">
          <div className="mx-4 mb-2">
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable || addingToCart || !isVariantSelected}
              className="btn-cta w-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Adding…</span></>
              ) : !product.isAvailable ? (
                <span>Out of Stock</span>
              ) : !isVariantSelected ? (
                <span>Select {product.variantName || 'Option'} to Add</span>
              ) : (
                <>
                  <Icon name="shopping-cart" className="w-4 h-4" />
                  <span>Add to Basket · ₨{(currentPrice * quantity).toLocaleString('en-PK', { minimumFractionDigits: 0 })}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Details & Reviews tabs ───────────────────────────────────────── */}
        <motion.div
          ref={tabsRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
        >
          {/* Tab bar — always shown, pill style */}
          <div className="px-4 pt-4 pb-0 border-b border-neutral-100">
            <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
              {([
                ...(hasSpecs    ? [{ key: 'details'  as const, label: 'Details' }]  : []),
                ...(hasLabeling ? [{ key: 'labeling' as const, label: 'Product Info' }] : []),
                { key: 'reviews' as const, label: reviews.length > 0 ? `Reviews (${reviews.length})` : 'Reviews' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-4 py-2 mb-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab panels */}
          <AnimatePresence mode="wait" initial={false}>

            {hasSpecs && activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="p-6"
              >
                {product.specifications &&
                  typeof product.specifications === 'object' &&
                  !Array.isArray(product.specifications) &&
                  Object.keys(product.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
                          {key
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            .replace(/_/g, ' ')
                            .trim()
                            .replace(/^\w/, c => c.toUpperCase())}
                        </p>
                        <p className="text-sm font-medium text-neutral-800">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <svg className="w-10 h-10 mx-auto mb-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-neutral-400">No additional details for this product</p>
                  </div>
                )}
              </motion.div>
            )}

            {hasLabeling && activeTab === 'labeling' && (
              <motion.div
                key="labeling"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="p-6 space-y-6"
              >
                {/* PFA badge */}
                <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs text-primary-700 font-medium">Product information in compliance with Punjab Food Authority (PFA) labeling requirements.</p>
                </div>

                {/* Key info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product?.cprNumber && (
                    <LabelRow icon="cert" label="PFA CPR Number" value={product.cprNumber} />
                  )}
                  {product?.batchNumber && (
                    <LabelRow icon="batch" label="Batch / Lot No." value={product.batchNumber} />
                  )}
                  {product?.expiryInfo && (
                    <LabelRow icon="expiry" label="Shelf Life / Expiry" value={product.expiryInfo} />
                  )}
                  {product?.allergens && (
                    <LabelRow icon="warning" label="Allergen Warnings" value={product.allergens} highlight />
                  )}
                </div>

                {/* Ingredients */}
                {product?.ingredients && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
                      Ingredients
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                      {product.ingredients}
                    </p>
                  </div>
                )}

                {/* Nutritional Info */}
                {product?.nutritionalInfo && Object.keys(product.nutritionalInfo).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
                      Nutritional Information
                      <span className="text-xs font-normal text-neutral-400">(per 100g)</span>
                    </h3>
                    <div className="rounded-xl border border-neutral-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-100">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nutrient</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                            <tr key={key} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="px-4 py-2.5 text-neutral-700 capitalize">
                                {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}
                              </td>
                              <td className="px-4 py-2.5 text-right font-medium text-neutral-900">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Manufacturer Info */}
                {product?.manufacturerInfo && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
                      Packed By
                    </h3>
                    <p className="text-sm text-neutral-600 bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                      {product.manufacturerInfo}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="p-5 space-y-5"
              >
                {/* ── Rating summary ── */}
                {reviews.length > 0 ? (
                  <div className="flex flex-col sm:flex-row gap-5 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">

                    {/* Big number + stars */}
                    <div className="flex flex-col items-center justify-center sm:border-r sm:border-neutral-200 sm:pr-5 min-w-[90px]">
                      <span className="text-5xl font-bold text-neutral-900 tabular-nums leading-none">{avgRating.toFixed(1)}</span>
                      <StarRow rating={Math.round(avgRating)} />
                      <span className="text-xs text-neutral-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Full-width breakdown bars */}
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingCounts[star] ?? 0;
                        const pct   = (count / reviews.length) * 100;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 w-4 text-right shrink-0">{star}</span>
                            <svg className="w-3 h-3 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-400 w-5 tabular-nums shrink-0">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                      <svg className="w-7 h-7 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-neutral-500">No reviews yet</p>
                    <p className="text-xs text-neutral-400 mt-1">Be the first to share your experience</p>
                  </div>
                )}

                {/* ── Write a Review ── */}
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border-2 border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 hover:border-primary-400 transition-all duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  {userReview ? 'View Your Review' : 'Write a Review'}
                </button>

                {/* ── Reviews list ── */}
                {reviewsLoading ? (
                  <div className="flex justify-center py-8"><ProductLoader size="sm" /></div>
                ) : reviews.length > 0 && (
                  <div className="space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-bold">
                              {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'A'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Name + verified + date */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-neutral-900">
                                {review.user?.name ? review.user.name.split(' ')[0] : 'Anonymous'}
                              </span>
                              {review.isVerified && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-1.5 py-0.5 rounded-full">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                  </svg>
                                  Verified
                                </span>
                              )}
                              <span className="text-[10px] text-neutral-400 ml-auto">
                                {new Date(review.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {/* Stars */}
                            <div className="mt-1 mb-2"><StarRow rating={review.rating} /></div>
                            {/* Comment */}
                            {review.comment && (
                              <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

      </div>

      {/* ── Review modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showReviewModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowReviewModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Modal panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      {userReview ? 'Your Review' : 'Write a Review'}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[280px]">{product.name}</p>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* Modal body */}
                <div className="px-6 py-5">

                  {/* Guest */}
                  {!user && (
                    <div className="text-center space-y-4 py-4">
                      <div className="w-14 h-14 mx-auto rounded-full bg-primary-50 flex items-center justify-center">
                        <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">Sign in to leave a review</p>
                        <p className="text-xs text-neutral-400 mt-1">Share your experience with other shoppers.</p>
                      </div>
                      <Link
                        href={`/auth/login?redirect=/products/${params.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
                      >
                        Sign in
                      </Link>
                    </div>
                  )}

                  {/* User has an existing review */}
                  {user && userReview && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <StarRow rating={userReview.rating} />
                        {userReview.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-secondary-700 bg-secondary-50 border border-secondary-200 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse shrink-0" />
                            Awaiting approval
                          </span>
                        )}
                        {userReview.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            Published
                          </span>
                        )}
                        {userReview.status === 'rejected' && (
                          <span className="text-[11px] font-medium text-error-600 bg-error-50 border border-error-200 px-2.5 py-1 rounded-full">
                            Not approved
                          </span>
                        )}
                      </div>

                      {userReview.comment && (
                        <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
                          {userReview.comment}
                        </p>
                      )}

                      <p className="text-xs text-neutral-400">
                        Submitted {new Date(userReview.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      <div className="flex justify-end pt-1 border-t border-neutral-100">
                        <button
                          onClick={handleDeleteReview}
                          disabled={deletingReview}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-error-600 bg-error-50 hover:bg-error-100 border border-error-200 rounded-xl transition-colors disabled:opacity-40"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          {deletingReview ? 'Removing…' : 'Remove Review'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* User can write a review */}
                  {user && !userReview && (
                    <form onSubmit={handleSubmitReview} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                          Your Rating
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                              className="p-0.5 transition-transform hover:scale-110"
                            >
                              <svg className={`w-8 h-8 transition-colors ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-neutral-200'}`}
                                fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                            </button>
                          ))}
                          <span className="ml-2 text-sm font-semibold text-neutral-700">
                            {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewForm.rating]}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                          Your Review
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none transition-all placeholder:text-neutral-400"
                          placeholder="Share your experience with this product…"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {submittingReview ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                            Submit Review
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-center text-neutral-400">
                        Reviews are moderated and appear once approved by our team.
                      </p>
                    </form>
                  )}

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

function LabelRow({ label, value, icon, highlight }: {
  label: string; value: string; icon: string; highlight?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
      highlight ? 'bg-warning-50 border-warning-200' : 'bg-neutral-50 border-neutral-100'
    }`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        highlight ? 'bg-warning-100' : 'bg-primary-100'
      }`}>
        {icon === 'cert' && (
          <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        )}
        {icon === 'batch' && (
          <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )}
        {icon === 'expiry' && (
          <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {icon === 'warning' && (
          <svg className="w-3.5 h-3.5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-sm font-medium leading-snug ${highlight ? 'text-warning-800' : 'text-neutral-800'}`}>{value}</p>
      </div>
    </div>
  );
}
