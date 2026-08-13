'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import ProductLoader from '@/components/ui/ProductLoader';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Dropdown from '@/components/ui/Dropdown';

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
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
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
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!params.id) return;
    const id = params.id as string;
    fetchProduct(id);
    fetchReviews(id);
    if (user) fetchWishlistStatus(id);
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
      toast.success(`${quantity} ${unitLabel(product.unit, quantity)} of ${product.name} added to basket!`);
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
    try {
      await fetch(`/api/v1/wishlist/${product.id}`, {
        method: 'POST',
        credentials: 'include',
      });
      setIsWishlisted(prev => !prev);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch {
      toast.error('Failed to update wishlist');
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
        body: JSON.stringify({ ...reviewForm, productId: params.id }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchReviews(params.id as string);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
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
          <div className="space-y-5">

            {/* Badges row + wishlist */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {!product.isAvailable && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-error-50 text-error-600 border border-error-100">
                    Out of Stock
                  </span>
                )}
                {product.isOrganic && (
                  <span className="badge-organic inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold">
                    Organic
                  </span>
                )}
                {product.featured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary-100 text-secondary-700 border border-secondary-200">
                    Featured
                  </span>
                )}
                {product.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                    {product.category.name}
                  </span>
                )}
                {product.productType && (
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: product.productType.color || '#3d7a2e' }}
                  >
                    {product.productType.displayName}
                  </span>
                )}
              </div>

              {/* Wishlist */}
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className="flex-shrink-0 p-2 rounded-full hover:bg-error-50 transition-colors disabled:opacity-40"
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isWishlisted ? (
                  <svg className="w-6 h-6 text-error-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-neutral-400 hover:text-error-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Name + description */}
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2 leading-tight">{product.name}</h1>
              <p className="text-neutral-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Review summary (if any) */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRow rating={Math.round(avgRating)} />
                <span className="text-sm text-neutral-500">
                  {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price block */}
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-4xl font-bold text-neutral-900">
                  ₨{currentPrice.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-neutral-400 line-through">
                      ₨{currentOriginal!.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-error-500 text-white">
                      -{discountPct}% off
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-1">per {product.unit}</p>
            </div>

            {/* Variant selector */}
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-neutral-200 space-y-3">
                <Dropdown
                  label={`Select ${product.variantName || 'Option'}`}
                  placeholder={`Choose ${product.variantName?.toLowerCase() || 'option'}…`}
                  value={selectedVariant || ''}
                  onChange={(v) => setSelectedVariant(v as string)}
                  options={product.variants.map((v) => ({
                    value: v.name,
                    label: v.name,
                    description: `₨${Number(v.price).toLocaleString('en-PK')}${v.originalPrice ? ` (was ₨${Number(v.originalPrice).toLocaleString('en-PK')})` : ''}`,
                    disabled: !v.isAvailable,
                    badge: !v.isAvailable ? 'Out of Stock' : undefined,
                    color: !v.isAvailable ? 'red' : 'green',
                  }))}
                  size="lg"
                  variant="outline"
                  className="w-full"
                />
                {!isVariantSelected && (
                  <p className="text-sm text-secondary-600 bg-secondary-50 border border-secondary-100 rounded-lg px-3 py-2">
                    Please select a {product.variantName?.toLowerCase() || 'option'} to continue
                  </p>
                )}
              </div>
            )}

            {/* Quantity stepper */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-neutral-700 w-32 flex-shrink-0">
                  {qtyLabel(product.unit)}
                </label>
                <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors"
                  >
                    <Icon name="minus" className="w-4 h-4" />
                  </button>
                  <span className="px-5 py-2 font-semibold text-neutral-900 min-w-[3rem] text-center tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3 py-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-neutral-400">{unitLabel(product.unit, quantity)}</span>
              </div>

              {/* Total */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-neutral-900">
                    ₨{(currentPrice * quantity).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {quantity} {unitLabel(product.unit, quantity)} × ₨{currentPrice.toLocaleString('en-PK', { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!product.isAvailable || addingToCart || !isVariantSelected}
                className="btn-cta flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Adding…</span>
                  </>
                ) : !product.isAvailable ? (
                  <>
                    <Icon name="x-circle" className="w-4 h-4" />
                    <span>Out of Stock</span>
                  </>
                ) : !isVariantSelected ? (
                  <>
                    <Icon name="shopping-cart" className="w-4 h-4" />
                    <span>Select {product.variantName || 'Option'}</span>
                  </>
                ) : (
                  <>
                    <Icon name="shopping-cart" className="w-4 h-4" />
                    <span>Add to Basket</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.isAvailable || !isVariantSelected}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="credit-card" className="w-4 h-4" />
                <span>
                  {!product.isAvailable
                    ? 'Unavailable'
                    : !isVariantSelected
                    ? `Select ${product.variantName || 'Option'}`
                    : 'Buy Now'}
                </span>
              </button>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Specifications ────────────────────────────────────────────────── */}
        {product.specifications && typeof product.specifications === 'object' && !Array.isArray(product.specifications) && Object.keys(product.specifications).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-5">Product Details</h2>
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
          </motion.div>
        )}

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRow rating={Math.round(avgRating)} />
                <span className="text-sm text-neutral-500">
                  {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Review list */}
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <ProductLoader size="sm" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-neutral-400 text-center py-6 text-sm">
                No reviews yet — be the first to review this product!
              </p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {reviews.map(review => (
                  <div key={review.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800">
                          {review.user?.name ? review.user.name.split(' ')[0] : 'Anonymous'}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {new Date(review.createdAt).toLocaleDateString('en-PK', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <StarRow rating={review.rating} />
                    </div>
                    {review.title && (
                      <p className="text-sm font-semibold text-neutral-800 mb-1">{review.title}</p>
                    )}
                    <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Write review */}
            <div className="border-t border-neutral-100 pt-6">
              {user ? (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-neutral-800">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Your Rating</label>
                      <StarRow
                        rating={reviewForm.rating}
                        interactive
                        onRate={(r) => setReviewForm(f => ({ ...f, rating: r }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Title (optional)</label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                        className="input-field"
                        placeholder="Summarise your review"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Comment *</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        rows={4}
                        className="textarea-field"
                        placeholder="Share your experience with this product…"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-neutral-500 text-sm">Want to share your experience?</p>
                  <Link href={`/auth/login?redirect=/products/${params.id}`} className="btn-outline inline-flex">
                    Log in to write a review
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
