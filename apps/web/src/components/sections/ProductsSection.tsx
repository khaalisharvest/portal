'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import { useMultiDropdown, useSingleDropdown, dropdownUtils } from '@/hooks/useDropdown';
import FilterBar from '@/components/ui/FilterBar';
import CategoryTabs from '@/components/ui/CategoryTabs';
import ProductLoader from '@/components/ui/ProductLoader';
import Icon from '@/components/ui/Icon';
import { useFilter } from '@/contexts/FilterContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId: string;
  specifications: {
    variety?: string;
    grade?: string;
    origin?: string;
  };
  nutritionInfo: {
    calories: string;
    fiber: string;
    sugar: string;
    vitamins?: string[];
    minerals?: string[];
  };
  isFresh: boolean;
  isOrganic: boolean;
  isAvailable: boolean;
  unit: string;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  sortOrder: number;
  productTypes?: ProductType[];
}

interface ProductType {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  category?: Category;
}

interface ProductsSectionProps {
  showOnly?: number; // Number of products to show (for main page)
  showPagination?: boolean; // Whether to show pagination (for products page)
  className?: string;
  // External filter props for mobile category dropdown
  selectedCategory?: string;
  selectedProductType?: string;
}

export default function ProductsSection({ 
  showOnly, 
  showPagination = false, 
  className = ''
}: ProductsSectionProps) {
  const { selectedCategory, selectedProductType } = useFilter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Dropdown hooks
  const categoryDropdown = useMultiDropdown([], (values) => {
    setCurrentPage(1);
    // Clear product type selection when categories change
    productTypeDropdown.clear();
    fetchProducts(1, values, [], searchTerm);
  });

  const productTypeDropdown = useMultiDropdown([], (values) => {
    setCurrentPage(1);
    fetchProducts(1, Array.isArray(categoryDropdown.value) ? categoryDropdown.value : [], values, searchTerm);
  });


  useEffect(() => {
    // Single call now returns products + categories + productTypes
    fetchProducts(1, [], [], '', true);
  }, []);

  // Handle external filter changes from mobile category dropdown
  useEffect(() => {
    if (selectedCategory !== undefined || selectedProductType !== undefined) {
      const categories = selectedCategory ? [selectedCategory] : [];
      const types = selectedProductType ? [selectedProductType] : [];
      setCurrentPage(1);
      fetchProducts(1, categories, types, searchTerm);
    }
  }, [selectedCategory, selectedProductType]);


  // Update products when category or product type filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1, Array.isArray(categoryDropdown.value) ? categoryDropdown.value : [], Array.isArray(productTypeDropdown.value) ? productTypeDropdown.value : [], searchTerm);
  }, [categoryDropdown.value, productTypeDropdown.value]);


  const fetchProducts = async (
    page: number = 1, 
    categories: string[] = [], 
    types: string[] = [], 
    search: string = '',
    isInitialLoad: boolean = false
  ) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', showOnly ? showOnly.toString() : '12');
      
      if (categories.length > 0) {
        params.append('category', categories.join(','));
      }
      if (types.length > 0) {
        params.append('type', types.join(','));
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/public/products?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        // Add a small delay for smoother transition
        await new Promise(resolve => setTimeout(resolve, 150));
        
        setProducts(data.data.products || []);
        // Hydrate filters from combined payload when available
        if (Array.isArray(data.data.categories)) {
          setCategories(data.data.categories);
        }
        if (Array.isArray(data.data.productTypes)) {
          setProductTypes(data.data.productTypes);
        }
        // Calculate totalPages from total and limit
        const limit = parseInt(showOnly ? showOnly.toString() : '12');
        const total = data.data.total || 0;
        const calculatedTotalPages = Math.ceil(total / limit);
        setTotalPages(calculatedTotalPages);
        setTotalProducts(total);
      }
    } catch (error) {
      // Error fetching products
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setHasSearched(true);
      setCurrentPage(1);
      fetchProducts(1, Array.isArray(categoryDropdown.value) ? categoryDropdown.value : [], Array.isArray(productTypeDropdown.value) ? productTypeDropdown.value : [], searchTerm);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setHasSearched(false);
    setCurrentPage(1);
    fetchProducts(1, Array.isArray(categoryDropdown.value) ? categoryDropdown.value : [], Array.isArray(productTypeDropdown.value) ? productTypeDropdown.value : [], '');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(page, Array.isArray(categoryDropdown.value) ? categoryDropdown.value : [], Array.isArray(productTypeDropdown.value) ? productTypeDropdown.value : [], searchTerm);
  };

  // Convert data to dropdown options - only show categories/types that have products
  const categoryOptions: DropdownOption[] = dropdownUtils.toOptions(categories);

  // Filter product types based on selected categories
  const getFilteredProductTypes = () => {
    const selectedCategories = Array.isArray(categoryDropdown.value) ? categoryDropdown.value : [];
    
    if (selectedCategories.length === 0) {
      // If no categories selected, show all product types that have products
      return productTypes;
    }
    
    // Filter product types that belong to selected categories
    return productTypes.filter(productType => 
      selectedCategories.includes(productType.categoryId)
    );
  };

  const productTypeOptions: DropdownOption[] = dropdownUtils.toOptions(getFilteredProductTypes());

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <ProductLoader size="lg" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for organic products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-3 pl-10 pr-12 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
          {hasSearched && searchTerm ? (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-red-500 transition-colors"
              title="Clear search"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSearch}
              disabled={!searchTerm.trim()}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={searchTerm.trim() ? "Search" : "Enter search term"}
            >
              <Icon name="search" className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        productTypes={productTypes}
        selectedCategory={Array.isArray(categoryDropdown.value) ? categoryDropdown.value[0] || '' : categoryDropdown.value}
        selectedProductType={Array.isArray(productTypeDropdown.value) ? productTypeDropdown.value[0] || '' : productTypeDropdown.value}
        onCategoryChange={(value) => {
          const values = Array.isArray(value) ? value : (value ? [value] : []);
          categoryDropdown.setValue(values);
        }}
        onProductTypeChange={(value) => {
          const values = Array.isArray(value) ? value : (value ? [value] : []);
          productTypeDropdown.setValue(values);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          categoryDropdown.clear();
          productTypeDropdown.clear();
          setCurrentPage(1);
          fetchProducts(1, [], [], '', true);
        }}
        className="mb-6"
      />

      {/* Products Grid */}
      <div className="relative">
        {products.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <Image
                src="/images/logo.png"
                alt="Khaalis Harvest Logo"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No organic products found</h3>
            <p className="text-neutral-600">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className={`grid gap-3 sm:gap-6 transition-all duration-300 ${
              showOnly 
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' 
                : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
            {products.map((product) => {
              const category = categories.find(c => c.id === product.categoryId);
              const productType = productTypes.find(p => p.id === product.productTypeId);
              // Coerce prices to numbers to avoid NaN in UI
              const priceNumber = Number((product as any).price);
              const safePrice = Number.isFinite(priceNumber) ? priceNumber : 0;
              const originalPriceNumber = product.originalPrice !== undefined && product.originalPrice !== null
                ? Number((product as any).originalPrice)
                : undefined;
              const hasDiscount = typeof originalPriceNumber === 'number' && Number.isFinite(originalPriceNumber) && originalPriceNumber > safePrice;
              
              return (
                <Link 
                  key={product.id} 
                  href={`/products/${product.id}`}
                  className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer block text-left w-full flex flex-col"
                >
                  {/* Full Image Background */}
                  <div className="relative h-36 sm:h-40 md:h-44 lg:h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={product.images?.[0] || '/images/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover w-full h-full"
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  
                  {/* Content - Always Visible */}
                  <div className="px-2 py-2 flex-1 flex flex-col justify-between">
                    <h3 className="text-xs sm:text-sm md:text-base font-bold mb-1 line-clamp-1 text-gray-900">{product.name}</h3>
                    
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0 flex-1">
                        {hasDiscount && (
                          <span className="text-[10px] sm:text-xs line-through text-gray-500">₨{originalPriceNumber}</span>
                        )}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">₨{safePrice}</span>
                          {hasDiscount && (
                            <span className="text-[8px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                              -{Math.round(((originalPriceNumber! - safePrice) / originalPriceNumber!) * 100)}%
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] sm:text-[10px] text-gray-500 whitespace-nowrap">per {product.unit}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            </div>

            {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    page === currentPage
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

        </>
      )}
      </div>

    </div>
  );
}
