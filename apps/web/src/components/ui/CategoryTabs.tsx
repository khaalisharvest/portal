'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Icon from './Icon';

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
  displayName: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  category?: Category;
}

interface CategoryTabsProps {
  categories: Category[];
  productTypes: ProductType[];
  selectedCategory: string;
  selectedProductType: string;
  onCategoryChange: (value: string | string[]) => void;
  onProductTypeChange: (value: string | string[]) => void;
  onClearFilters: () => void;
  className?: string;
}

export default function CategoryTabs({
  categories,
  productTypes,
  selectedCategory,
  selectedProductType,
  onCategoryChange,
  onProductTypeChange,
  onClearFilters,
  className = ''
}: CategoryTabsProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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

  const handleCategoryClick = useCallback((categoryId: string) => {
    // Only make API calls if the category actually changed
    if (selectedCategory !== categoryId) {
      onCategoryChange(categoryId);
      // Clear product type filter when switching categories
      onProductTypeChange('');
    }
    
    // Toggle dropdown regardless of category change
    if (openDropdown === categoryId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(categoryId);
    }
  }, [selectedCategory, openDropdown, onCategoryChange, onProductTypeChange]);

  const handleProductTypeClick = useCallback((typeId: string) => {
    // Only make API call if the product type actually changed
    if (selectedProductType !== typeId) {
      onProductTypeChange(typeId);
    }
    setOpenDropdown(null);
  }, [selectedProductType, onProductTypeChange]);

  // Memoize filtered product types to avoid recalculating on every render
  const getFilteredProductTypes = useCallback((categoryId: string) => {
    return productTypes.filter(type => type.categoryId === categoryId);
  }, [productTypes]);

  return (
    <div className={`bg-white shadow-lg border-b border-neutral-200 relative hidden md:block ${className}`} ref={dropdownRef}>
      <div className="container-custom">
        <div className="flex flex-wrap items-center justify-start gap-2 py-4">
          {/* All Products Button */}
          <button
            onClick={() => {
              onCategoryChange('');
              onProductTypeChange('');
              setOpenDropdown(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              !selectedCategory
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            All Products
          </button>

          {/* Category Buttons */}
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            const categoryProductTypes = getFilteredProductTypes(category.id);
            const isOpen = openDropdown === category.id;
            const selectedType = categoryProductTypes.find(type => type.id === selectedProductType);
            
            return (
              <div key={category.id} className="relative">
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span>{category.name}</span>
                  {categoryProductTypes.length > 0 && (
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>


              </div>
            );
          })}
        </div>
      </div>
      
      {/* Full-width modal positioned relative to the entire category bar */}
      {openDropdown && categories.find(cat => cat.id === openDropdown) && (() => {
        const category = categories.find(cat => cat.id === openDropdown);
        const categoryProductTypes = getFilteredProductTypes(openDropdown);
        
        if (!category || categoryProductTypes.length === 0) return null;
        
        return (
          <div className="absolute top-full left-0 right-0 mt-2 w-full z-50 overflow-hidden border border-neutral-200 rounded-b-xl shadow-lg">
            <div className="flex flex-col md:flex-row h-80 md:h-96 max-h-[70vh]">
              {/* Left Half - Product Type Options */}
              <div className="w-full md:w-1/2 bg-white flex flex-col min-h-0">
                {/* Header */}
                <div className="px-4 py-3 text-xs font-semibold text-neutral-800 uppercase tracking-wider bg-neutral-50">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-neutral-900">{category.name}</span>
                        <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                          {categoryProductTypes.length} {categoryProductTypes.length === 1 ? 'type' : 'types'}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-xs text-neutral-700 font-normal normal-case mt-0.5">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Product Type Options */}
                <div className="flex-1 overflow-y-auto bg-white">
                  {categoryProductTypes.map((type, index) => {
                    const isTypeActive = selectedProductType === type.id;
                    return (
                      <div key={type.id} className="relative">
                        <button
                          onClick={() => handleProductTypeClick(type.id)}
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center space-x-3 group relative ${
                            isTypeActive
                              ? 'bg-primary-500 text-white shadow-sm'
                              : 'text-neutral-800 hover:text-neutral-900 hover:bg-neutral-50'
                          }`}
                        >
                          
                          {/* Type name with enhanced typography */}
                          <div className="flex-1 text-left">
                            <span className={`block font-medium transition-all duration-300 ${
                              isTypeActive
                                ? 'text-white font-semibold'
                                : 'text-neutral-800 group-hover:text-neutral-900 group-hover:font-semibold'
                            }`}>
                              {type.displayName}
                            </span>
                          </div>
                          
                          
                        </button>
                        
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Half - Category Image */}
              <div 
                className="w-full md:w-1/2 relative h-40 md:h-auto"
                style={{
                  backgroundImage: category.image ? `url(${category.image})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Optional overlay for better text contrast if needed */}
                <div className="absolute inset-0 bg-neutral-900/10"></div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}