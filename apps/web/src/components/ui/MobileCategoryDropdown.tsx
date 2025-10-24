'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  productTypes?: ProductType[];
}

interface ProductType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  category?: Category;
}

interface MobileCategoryDropdownProps {
  categories: Category[];
  productTypes: ProductType[];
  selectedCategory: string;
  selectedProductType: string;
  onCategoryChange: (value: string | string[]) => void;
  onProductTypeChange: (value: string | string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileCategoryDropdown({
  categories,
  productTypes,
  selectedCategory,
  selectedProductType,
  onCategoryChange,
  onProductTypeChange,
  isOpen,
  onClose
}: MobileCategoryDropdownProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isManualClick, setIsManualClick] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle dropdown state based on modal and selection state
  useEffect(() => {
    if (!isOpen) {
      setOpenDropdown(null);
      setIsManualClick(false);
      return;
    }

    // Only auto-open if it's not a manual click
    if (!isManualClick) {
      if (selectedProductType && productTypes && productTypes.length > 0) {
        const selectedType = productTypes.find(type => type.id === selectedProductType);
        if (selectedType && selectedType.categoryId) {
          setOpenDropdown(selectedType.categoryId);
        }
      } else if (selectedCategory) {
        setOpenDropdown(selectedCategory);
      }
    }
  }, [isOpen, selectedCategory, selectedProductType, productTypes, isManualClick]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    // Set manual click flag to prevent useEffect from overriding
    setIsManualClick(true);
    
    // Always update the selected category
    onCategoryChange(categoryId);
    
    // Clear product type selection when switching categories
    onProductTypeChange('');
    
    // Always expand the clicked category, regardless of current state
    setOpenDropdown(categoryId);
  }, [onCategoryChange, onProductTypeChange]);

  const handleProductTypeClick = useCallback((typeId: string) => {
    if (selectedProductType !== typeId) {
      onProductTypeChange(typeId);
    }
    // Don't close the dropdown so user can see their selection
  }, [selectedProductType, onProductTypeChange]);

  // Memoize product types by category for better performance
  const productTypesByCategory = useMemo(() => {
    if (!productTypes || !Array.isArray(productTypes)) return {};
    
    return productTypes.reduce((acc, type) => {
      if (type && type.categoryId) {
        if (!acc[type.categoryId]) {
          acc[type.categoryId] = [];
        }
        acc[type.categoryId].push(type);
      }
      return acc;
    }, {} as Record<string, ProductType[]>);
  }, [productTypes]);

  const getFilteredProductTypes = useCallback((categoryId: string) => {
    return productTypesByCategory[categoryId] || [];
  }, [productTypesByCategory]);

  if (!isOpen) return null;

  return (
    <div 
      className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-dropdown-title"
    >
      <div 
        ref={dropdownRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 id="category-dropdown-title" className="text-lg font-semibold text-gray-900">Categories</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[65vh] bg-white overscroll-contain">
          {/* All Products Link */}
          <div className="px-4 py-2 border-b border-gray-100">
            <button
              onClick={() => {
                onCategoryChange('');
                onProductTypeChange('');
                setOpenDropdown(null);
                onClose();
              }}
              className={`w-full text-left py-2 px-1 text-base font-medium transition-colors ${
                !selectedCategory
                  ? 'text-orange-600 border-l-4 border-orange-500 pl-3'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              All Products
            </button>
          </div>

          {/* Categories */}
          <div className="py-1">
            {categories && categories.length > 0 ? categories.map((category) => {
              const isActive = selectedCategory === category.id;
              const categoryProductTypes = getFilteredProductTypes(category.id);
              const isDropdownOpen = openDropdown === category.id;
              const hasProductTypes = categoryProductTypes.length > 0;
              
              return (
                <div key={category.id}>
                  {/* Category Link */}
                  <div className="px-4 py-1">
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`w-full text-left py-2 px-1 text-base font-medium transition-colors flex items-center justify-between ${
                        isActive
                          ? 'text-orange-600 border-l-4 border-orange-500 pl-3'
                          : 'text-gray-700 hover:text-orange-600'
                      }`}
                    >
                      <span>{category.name}</span>
                      {hasProductTypes && (
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Product Types Dropdown */}
                  {isDropdownOpen && hasProductTypes && (
                    <div className="bg-gray-50 px-4 py-1">
                      <div className="flex space-x-3 max-h-64 min-h-[120px]">
                        {/* Product Types List - 50% Width */}
                        <div className="w-1/2 overflow-y-auto max-h-64 relative overscroll-contain">
                          {categoryProductTypes.map((type) => {
                            const isTypeActive = selectedProductType === type.id;
                            return (
                              <button
                                key={type.id}
                                onClick={() => handleProductTypeClick(type.id)}
                                className={`w-full text-left py-2 text-sm transition-colors relative ${
                                  isTypeActive
                                    ? 'text-orange-600 pl-8'
                                    : 'text-gray-600 hover:text-orange-600 pl-6'
                                }`}
                              >
                                {isTypeActive && (
                                  <div className="absolute left-6 top-0 bottom-0 w-1 bg-orange-500" aria-hidden="true"></div>
                                )}
                                {type.displayName}
                              </button>
                            );
                          })}
                          
                          {/* Scroll Indicator */}
                          {categoryProductTypes.length > 4 && (
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" aria-hidden="true"></div>
                          )}
                        </div>
                        
                        {/* Category Image - 50% Width */}
                        <div className="w-1/2 min-h-[120px] max-h-64 rounded-lg overflow-hidden flex-shrink-0">
                          {category.image ? (
                            <img 
                              src={category.image} 
                              alt={`${category.name} category`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[120px] bg-gray-200 flex items-center justify-center">
                              <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-12 px-6">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Available</h3>
                <p className="text-gray-500">Please check back later for new categories</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}