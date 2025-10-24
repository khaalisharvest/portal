'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useCart } from '@/contexts/CartContext';
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

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldDisplayConfig[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProductDetails(params.id as string);
    }
  }, [params.id]);

  const fetchProductDetails = async (id: string) => {
    try {
      setLoading(true);
      
      // Single API call that returns complete product data with category and productType
      const productResponse = await fetch(`${API_URL}/products/${id}`);
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
              <div className="flex items-center space-x-2 mb-2">
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
      </div>
    </div>
  );
}
