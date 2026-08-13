'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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

  // Prevent body scroll while sheet is open (avoids scrollbar layout shift)
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
    // Update product type if it changed
    if (selectedProductType !== typeId) {
      onProductTypeChange(typeId);
    }
    // Close the modal immediately so user can see the filtered products
    // Call onClose unconditionally to ensure modal closes on mobile
    onClose();
  }, [selectedProductType, onProductTypeChange, onClose]);

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

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="md:hidden fixed inset-0 z-50 bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-dropdown-title"
    >
      <motion.div
        ref={dropdownRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-neutral-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-3 border-b border-neutral-100 flex items-center justify-between">
          <h3 id="category-dropdown-title" className="text-base font-semibold text-neutral-900">
            Browse Categories
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[65vh] bg-white overscroll-contain">

          {/* All Products */}
          <div className="px-4 py-2 border-b border-neutral-100">
            <button
              onClick={() => {
                onCategoryChange('');
                onProductTypeChange('');
                setOpenDropdown(null);
                onClose();
              }}
              className={`w-full text-left py-2 px-1 text-base font-medium transition-colors ${
                !selectedCategory
                  ? 'text-primary-600 border-l-4 border-primary-500 pl-3'
                  : 'text-neutral-700 hover:text-primary-600'
              }`}
            >
              All Products
            </button>
          </div>

          {/* Categories */}
          <div className="py-1">
            {categories && categories.length > 0 ? categories.map((category) => {
              const isActive          = selectedCategory === category.id;
              const categoryProductTypes = getFilteredProductTypes(category.id);
              const isDropdownOpen    = openDropdown === category.id;
              const hasProductTypes   = categoryProductTypes.length > 0;

              return (
                <div key={category.id}>
                  {/* Category row */}
                  <div className="px-4 py-1">
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`w-full text-left py-2 px-1 text-base font-medium transition-colors flex items-center justify-between ${
                        isActive
                          ? 'text-primary-600 border-l-4 border-primary-500 pl-3'
                          : 'text-neutral-700 hover:text-primary-600'
                      }`}
                    >
                      <span>{category.name}</span>
                      {hasProductTypes && (
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
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

                  {/* Product types panel */}
                  {isDropdownOpen && hasProductTypes && (
                    <div className="bg-neutral-50 px-4 py-1">
                      <div className="flex space-x-3 max-h-64 min-h-[120px]">

                        {/* Types list */}
                        <div className="w-1/2 overflow-y-auto max-h-64 relative overscroll-contain">
                          {categoryProductTypes.map((type) => {
                            const isTypeActive = selectedProductType === type.id;
                            return (
                              <button
                                key={type.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleProductTypeClick(type.id);
                                }}
                                className={`w-full text-left py-2 text-sm font-medium transition-colors relative ${
                                  isTypeActive
                                    ? 'text-primary-600 pl-8'
                                    : 'text-neutral-600 hover:text-primary-600 pl-6'
                                }`}
                              >
                                {isTypeActive && (
                                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary-500" aria-hidden="true" />
                                )}
                                {type.displayName}
                              </button>
                            );
                          })}

                          {categoryProductTypes.length > 4 && (
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-neutral-50 to-transparent pointer-events-none" aria-hidden="true" />
                          )}
                        </div>

                        {/* Category image */}
                        <div className="w-1/2 min-h-[120px] max-h-64 rounded-xl overflow-hidden flex-shrink-0">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={`${category.name} category`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[120px] bg-neutral-100 flex items-center justify-center">
                              <svg className="h-8 w-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg className="h-7 w-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-1">No Categories Yet</h3>
                <p className="text-sm text-neutral-400">Check back soon for fresh categories</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}