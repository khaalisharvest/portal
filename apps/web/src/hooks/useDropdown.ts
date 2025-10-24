import { useState, useCallback } from 'react';
import { DropdownOption } from '@/components/ui/Dropdown';

export interface UseDropdownOptions {
  initialValue?: string | string[];
  multiple?: boolean;
  onSelectionChange?: (value: string | string[]) => void;
}

export function useDropdown({
  initialValue = '',
  multiple = false,
  onSelectionChange,
}: UseDropdownOptions = {}) {
  const [value, setValue] = useState<string | string[]>(
    multiple ? (Array.isArray(initialValue) ? initialValue : []) : initialValue
  );

  const handleChange = useCallback((newValue: string | string[]) => {
    setValue(newValue);
    onSelectionChange?.(newValue);
  }, [onSelectionChange]);

  const clear = useCallback(() => {
    const clearedValue = multiple ? [] : '';
    setValue(clearedValue);
    onSelectionChange?.(clearedValue);
  }, [multiple, onSelectionChange]);

  const isSelected = useCallback((optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  }, [value, multiple]);

  const getSelectedOptions = useCallback((options: DropdownOption[]) => {
    if (multiple) {
      return options.filter(option => 
        Array.isArray(value) && value.includes(option.value)
      );
    }
    return options.filter(option => option.value === value);
  }, [value, multiple]);

  return {
    value,
    setValue,
    handleChange,
    clear,
    isSelected,
    getSelectedOptions,
  };
}

// Preset hooks for common use cases
export function useSingleDropdown(initialValue = '', onSelectionChange?: (value: string) => void) {
  return useDropdown({
    initialValue,
    multiple: false,
    onSelectionChange: onSelectionChange as (value: string | string[]) => void,
  });
}

export function useMultiDropdown(initialValue: string[] = [], onSelectionChange?: (value: string[]) => void) {
  return useDropdown({
    initialValue,
    multiple: true,
    onSelectionChange: onSelectionChange as (value: string | string[]) => void,
  });
}

// Utility functions for common dropdown operations
export const dropdownUtils = {
  // Convert array of objects to dropdown options
  toOptions: <T extends { id: string; name: string }>(
    items: T[],
    options: {
      icon?: (item: T) => string;
      description?: (item: T) => string;
      badge?: (item: T) => string;
      color?: (item: T) => string;
    } = {}
  ): DropdownOption[] => {
    return items.map(item => ({
      value: item.id,
      label: item.name,
      icon: options.icon?.(item),
      description: options.description?.(item),
      badge: options.badge?.(item),
      color: options.color?.(item),
    }));
  },

  // Filter options based on search term
  filterOptions: (options: DropdownOption[], searchTerm: string): DropdownOption[] => {
    if (!searchTerm) return options;
    
    const term = searchTerm.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(term) ||
      option.description?.toLowerCase().includes(term)
    );
  },

  // Group options by category
  groupOptions: (options: DropdownOption[], groupBy: (option: DropdownOption) => string) => {
    const groups: Record<string, DropdownOption[]> = {};
    
    options.forEach(option => {
      const group = groupBy(option);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(option);
    });
    
    return groups;
  },
};
