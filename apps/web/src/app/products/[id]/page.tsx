'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { API_URL } from '@/config/env';
import DynamicDetailsSection from '@/components/ui/DynamicDetailsSection';
import { DynamicFieldDisplayConfig } from '@/components/ui/DynamicFieldDisplay';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId: string;
  category?: Category;
  productType?: ProductType;
  specifications: {
    quality: string;
    variety: string;
    season: string;
    origin: string;
  };
  nutritionInfo: {
    calories: string;
    fiber: string;
    sugar: string;
    minerals: string[];
  };
  isFresh: boolean;
  isOrganic: boolean;
  isAvailable: boolean;
  unit: string;
  featured: boolean;
  tags: string[];
  hasVariants?: boolean;
  variantName?: string;
  variants?: Array<{
    name: string;
    price: number;
    originalPrice?: number;
    isAvailable?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface ProductType {
  id: string;
  name: string;
  displayName: string;
  color: string;
  specifications?: {
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
      required: boolean;
      options?: Array<{ label: string; value: string }>;
      unit?: string;
      category?: string;
    }>;
  };
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  user?: { name: string };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDisplayConfig[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProductDetails(params.id as string);
      fetchReviews(params.id as string);
      if (user) fetchWishlistStatus(params.id as string);
    }
  }, [params.id, user]);

  const fetchProductDetails = async (id: string) => {
    try {
      setLoading(true);
      
      // Single API call that returns complete product data with category and productType
      const productResponse = await fetch(`/api/v1/products/${id}`);
      if (!productResponse.ok) throw new Error('Product not found');
      
      const productData = await productResponse.json();
      const product = productData.data || productData;
      
      setProduct(product);
      
      // Extract category and productType from the product data (already included via relations)
      if (product.category) {
        setCategory(product.category);
      }
      
      if (product.productType) {
        setProductType(product.productType);
        
        // Set up dynamic fields from product type
        if (product.productType.specifications?.fields) {
          const fields: DynamicFieldDisplayConfig[] = product.productType.specifications.fields.map((field: any) => ({
            name: field.name,
            label: field.label,
            type: field.type,
            options: field.options,
            unit: field.unit,
            category: field.category,
            value: product.specifications?.[field.name] || null
          }));
          setDynamicFields(fields);
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (id: string) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/v1/reviews?productId=${id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data.data || []);
    } catch {
      // silently fail
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchWishlistStatus = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/wishlist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsWishlisted(data.isWishlisted ?? data.wishlisted ?? false);
      }
    } catch {
      // silently fail
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!product) return;
    setWishlistLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      await fetch(`/api/v1/wishlist/${product.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }
    setSubmittingReview(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/reviews?productId=${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...reviewForm, productId: params.id }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      toast.success('Review submitted successfully');
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchReviews(params.id as string);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type={interactive ? 'button' : 'button'}
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
  };

  // Get current price based on selected variant
  const getCurrentPrice = () => {
    if (!product) return 0;
    if (product.hasVariants && selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.name === selectedVariant);
      return variant ? variant.price : product.price;
    }
    return product.price;
  };

  // Get current original price based on selected variant
  const getCurrentOriginalPrice = () => {
    if (!product) return undefined;
    if (product.hasVariants && selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.name === selectedVariant);
      return variant ? variant.originalPrice : product.originalPrice;
    }
    return product.originalPrice;
  };

  // Check if a variant is selected (required for products with variants)
  const isVariantSelected = () => {
    if (!product) return true;
    if (product.hasVariants) {
      return selectedVariant !== null;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      // Add to cart using context
      addToCart({
        productId: product.id,
        name: product.name,
        price: Number(getCurrentPrice()),
        originalPrice: getCurrentOriginalPrice() ? Number(getCurrentOriginalPrice()) : undefined,
        quantity: quantity,
        image: product.images?.[0] || '/images/placeholder.svg',
        unit: product.unit,
        specifications: product.specifications,
        isAvailable: product.isAvailable,
        selectedVariant: selectedVariant || undefined,
        variantPrice: Number(getCurrentPrice()),
        variantOriginalPrice: getCurrentOriginalPrice() ? Number(getCurrentOriginalPrice()) : undefined
      });
      
      // Show success message
      const unitText = product.unit === 'kg' ? 'kg' : 
                      product.unit === 'piece' ? 'pieces' : 
                      product.unit === 'dozen' ? 'dozens' : 
                      product.unit === 'box' ? 'boxes' : 'units';
      
      toast.success(`${quantity} ${unitText} of ${product.name} added to basket!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to basket. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    try {
      // Add to cart first, then redirect to checkout
      addToCart({
        productId: product.id,
        name: product.name,
        price: Number(getCurrentPrice()),
        originalPrice: getCurrentOriginalPrice() ? Number(getCurrentOriginalPrice()) : undefined,
        quantity: quantity,
        image: product.images?.[0] || '/images/placeholder.svg',
        unit: product.unit,
        specifications: product.specifications,
        isAvailable: product.isAvailable,
        selectedVariant: selectedVariant || undefined,
        variantPrice: Number(getCurrentPrice()),
        variantOriginalPrice: getCurrentOriginalPrice() ? Number(getCurrentOriginalPrice()) : undefined
      });
      
      // Redirect to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error with buy now:', error);
      toast.error('Failed to proceed to checkout. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Icon name="alert-circle" className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/products')}
            className="btn-primary"
          >
            Browse All Products
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
              onClick={() => router.push('/products')}
              className="text-gray-500 hover:text-orange-600 transition-colors"
            >
              Products
            </button>
            <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
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

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-orange-500 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {product.isOrganic && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Organic
                    </span>
                  )}
                  {product.featured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                      Featured
                    </span>
                  )}
                  {product.isFresh && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Fresh
                    </span>
                  )}
                </div>
                {/* Wishlist Button */}
                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className="p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                  title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWishlisted ? (
                    <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-neutral-400 hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-xl p-6">
              <div>
                <div className="text-4xl font-bold text-gray-900">₨{getCurrentPrice()}</div>
                {getCurrentOriginalPrice() && getCurrentOriginalPrice()! > getCurrentPrice() && (
                  <div className="text-lg text-gray-500 line-through">₨{getCurrentOriginalPrice()}</div>
                )}
                <div className="text-gray-600">per {product.unit}</div>
              </div>
            </div>

            {/* Variant Selector */}
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <Dropdown
                  label={`Select ${product.variantName || 'Option'}`}
                  placeholder={`Choose ${product.variantName?.toLowerCase() || 'option'}...`}
                  value={selectedVariant || ''}
                  onChange={(value) => setSelectedVariant(value as string)}
                  options={product.variants.map((variant) => ({
                    value: variant.name,
                    label: variant.name,
                    description: `₨${variant.price}${variant.originalPrice ? ` (was ₨${variant.originalPrice})` : ''}`,
                    disabled: !variant.isAvailable,
                    badge: !variant.isAvailable ? 'Out of Stock' : undefined,
                    color: !variant.isAvailable ? 'red' : 'green'
                  }))}
                  size="lg"
                  variant="outline"
                  className="w-full"
                />
                {!isVariantSelected() && (
                  <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    Please select a {product.variantName?.toLowerCase() || 'option'} to continue
                  </div>
                )}
              </div>
            )}

            {/* Category & Type */}
            <div className="flex flex-wrap gap-3">
              {category && (
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
              )}
              {productType && (
                <div 
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: productType.color }}
                >
                  <span className="text-sm font-medium">{productType.displayName}</span>
                </div>
              )}
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  {product.unit === 'kg' ? 'Weight (kg):' : 
                   product.unit === 'piece' ? 'Quantity:' : 
                   product.unit === 'dozen' ? 'Dozens:' : 
                   product.unit === 'box' ? 'Boxes:' : 'Quantity:'}
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <Icon name="minus" className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.unit === 'kg' ? 'kg' : 
                   product.unit === 'piece' ? 'pieces' : 
                   product.unit === 'dozen' ? 'dozens' : 
                   product.unit === 'box' ? 'boxes' : 'units'}
                </span>
              </div>

              {/* Calculated Price */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total Price:
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ₨{(getCurrentPrice() * quantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {quantity} {product.unit === 'kg' ? 'kg' : 
                                 product.unit === 'piece' ? 'pieces' : 
                                 product.unit === 'dozen' ? 'dozens' : 
                                 product.unit === 'box' ? 'boxes' : 'units'} × ₨{getCurrentPrice()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable || addingToCart || !isVariantSelected()}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-white px-4 sm:px-6 py-3 sm:py-3 rounded-lg hover:from-orange-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : !isVariantSelected() ? (
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
                  disabled={!product.isAvailable || !isVariantSelected()}
                  className="flex-1 bg-gray-900 text-white px-4 sm:px-6 py-3 sm:py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Icon name="credit-card" className="w-4 h-4" />
                  <span>{!isVariantSelected() ? `Select ${product.variantName || 'Option'}` : 'Buy Now'}</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Product Information */}
        {dynamicFields.length > 0 && (
          <div className="mt-16">
            <DynamicDetailsSection
              title={`${productType?.displayName || 'Product'} Specifications`}
              fields={dynamicFields}
              productData={product.specifications || {}}
              animationDelay={0}
            />
          </div>
        )}

        {/* Nutrition Information - Only show if there's actual data */}
        {(() => {
          if (!product.nutritionInfo) return null;
          
          const validEntries = Object.entries(product.nutritionInfo).filter(([key, value]) => {
            return value !== null && value !== undefined && value !== '' && 
                   (Array.isArray(value) ? value.length > 0 : true);
          });
          
          if (validEntries.length === 0) return null;
          
          return (
            <div className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Nutrition Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validEntries.map(([key, value]) => {
                    const humanize = (key: string) => {
                      return key
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/_/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .replace(/^\w/, c => c.toUpperCase());
                    };

                    return (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 block mb-1">
                          {humanize(key)}
                        </span>
                        <span className="text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          );
        })()}
        {/* Reviews Section */}
        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length))}
                  <span className="text-sm text-gray-500">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-6 mb-8">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {review.user?.name ? review.user.name.split(' ')[0] : 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="ml-auto">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.title && <p className="font-medium text-gray-800 mb-1">{review.title}</p>}
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Write Review Form */}
            <div className="border-t border-gray-100 pt-6">
              {user ? (
                <>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Write a Review</h4>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                      {renderStars(reviewForm.rating, true, (r) => setReviewForm(f => ({ ...f, rating: r })))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Summarise your review"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comment *</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        placeholder="Share your experience with this product..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-3">Want to share your experience?</p>
                  <Link
                    href={`/auth/login?redirect=/products/${params.id}`}
                    className="btn-outline inline-block"
                  >
                    Login to write a review
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
