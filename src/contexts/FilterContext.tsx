'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  selectedCategory: string;
  selectedProductType: string;
  setSelectedCategory: (category: string) => void;
  setSelectedProductType: (type: string) => void;
  clearFilters: () => void;
  isCategoryDropdownOpen: boolean;
  setIsCategoryDropdownOpen: (isOpen: boolean) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedProductType('');
  };

  return (
    <FilterContext.Provider value={{
      selectedCategory,
      selectedProductType,
      setSelectedCategory,
      setSelectedProductType,
      clearFilters,
      isCategoryDropdownOpen,
      setIsCategoryDropdownOpen
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
