'use client';

import { useState, useEffect } from 'react';
import Dropdown, { DropdownOption } from './Dropdown';
import Icon from './Icon';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch?: () => void;
  categoryOptions: DropdownOption[];
  selectedCategory: string;
  onCategoryChange: (value: string | string[]) => void;
  productTypeOptions: DropdownOption[];
  selectedProductType: string;
  onProductTypeChange: (value: string | string[]) => void;
  onClearFilters: () => void;
  className?: string;
  showClearFilters?: boolean;
  searchPlaceholder?: string;
  fullWidth?: boolean;
  hasSearched?: boolean;
}

export default function FilterBar({
  searchTerm,
  onSearchChange,
  onSearch,
  onClearSearch,
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  productTypeOptions,
  selectedProductType,
  onProductTypeChange,
  onClearFilters,
  className = '',
  showClearFilters = true,
  searchPlaceholder = 'Search for organic products...',
  fullWidth = false,
  hasSearched = false
}: FilterBarProps) {
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  useEffect(() => {
    setHasActiveFilters(!!(searchTerm || selectedCategory || selectedProductType));
  }, [searchTerm, selectedCategory, selectedProductType]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl relative z-50 ${className}`}>
      <div className={fullWidth ? "w-full" : "container-custom"}>
        <div className="flex flex-col gap-4 py-6 relative z-50">
          {/* Search Bar - Full Width */}
          <div className="w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" className="h-5 w-5 text-neutral-700" />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pl-10 pr-12 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-neutral-900 placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 transition-all duration-200"
              />
              {hasSearched && searchTerm && onClearSearch ? (
                <button
                  onClick={onClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-700 hover:text-red-500 transition-colors"
                  title="Clear search"
                >
                  <Icon name="close" className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={onSearch}
                  disabled={!searchTerm.trim()}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={searchTerm.trim() ? "Search" : "Enter search term"}
                >
                  <Icon name="search" className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 relative z-50">
            {/* Category Filter */}
            <div className="w-full relative z-50">
              <Dropdown
                options={categoryOptions}
                value={selectedCategory}
                onChange={onCategoryChange}
                placeholder="All Categories"
                clearable={true}
                searchable={false}
                variant="outline"
                size="md"
                className="w-full"
              />
            </div>

            {/* Product Type Filter */}
            <div className="w-full relative z-50">
              <Dropdown
                options={productTypeOptions}
                value={selectedProductType}
                onChange={onProductTypeChange}
                placeholder="All Types"
                clearable={true}
                searchable={false}
                variant="outline"
                size="md"
                className="w-full"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {showClearFilters && hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={onClearFilters}
                className="inline-flex items-center px-4 py-2 text-sm text-gray-800 hover:text-gray-900 font-medium hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm bg-white/20"
              >
                <Icon name="close" className="w-4 h-4 mr-1" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
