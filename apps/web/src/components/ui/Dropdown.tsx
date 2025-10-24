'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Icon from './Icon';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode | string;
  disabled?: boolean;
  description?: string;
  badge?: string;
  color?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  className?: string;
  maxHeight?: string;
  showCheckmark?: boolean;
  align?: 'left' | 'right';
}

export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  size = 'md',
  variant = 'default',
  className,
  maxHeight = '200px',
  showCheckmark = true,
  align = 'left',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Get selected options
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  // Filter options based on search
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (multiple) {
      return selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`;
    }
    return selectedOptions[0]?.label || placeholder;
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-4 py-3',
  };

  const variantClasses = {
    default: 'bg-white border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500',
    outline: 'bg-white/20 backdrop-blur-sm border-2 border-white/30 focus:border-white/50 focus:ring-2 focus:ring-white/50 text-neutral-800',
    filled: 'bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500',
  };

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full flex items-center justify-between rounded-lg transition-all duration-200',
          sizeClasses[size],
          variantClasses[variant],
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'hover:border-orange-400 cursor-pointer',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Selected option icons */}
          {selectedOptions.length > 0 && (
            <div className="flex items-center space-x-1">
              {selectedOptions.slice(0, multiple ? 2 : 1).map((option, index) => (
                <div key={option.value} className="flex items-center space-x-1">
                  {option.icon && (
                    <span className="text-gray-500">
                      {typeof option.icon === 'string' ? (
                        <Icon name={option.icon} />
                      ) : (
                        option.icon
                      )}
                    </span>
                  )}
                  {multiple && selectedOptions.length > 2 && index === 1 && (
                    <span className="text-gray-500">+{selectedOptions.length - 1}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <span className={clsx(
            'truncate',
            selectedOptions.length === 0 ? 'text-neutral-500' : 'text-neutral-800'
          )}>
            {getDisplayText()}
          </span>
        </div>

        <div className="flex items-center space-x-2 ml-2">
          {/* Clear button */}
          {clearable && selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Chevron */}
          <ChevronDownIcon
            className={clsx(
              'w-5 h-5 text-neutral-500 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={clsx(
            'absolute z-[99999] w-full mt-1 bg-white border border-gray-200 border-b-2 border-b-gray-300 rounded-lg shadow-xl',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          style={{ maxHeight, zIndex: 99999 }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-gray-200">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          )}

          {/* Options List */}
          <div className="py-1 max-h-60 overflow-auto bg-white relative" style={{ zIndex: 99999 }}>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const isDisabled = option.disabled;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !isDisabled && handleOptionClick(option.value)}
                    disabled={isDisabled}
                    className={clsx(
                      'w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-150 relative bg-white',
                      isSelected
                        ? 'bg-orange-50 text-orange-900'
                        : 'text-gray-900 hover:bg-gray-50',
                      isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                    )}
                    style={{ zIndex: 99999 }}
                  >
                    {/* Option Icon */}
                    {option.icon && (
                      <span className="text-gray-500 flex-shrink-0">
                        {typeof option.icon === 'string' ? (
                          <Icon name={option.icon} />
                        ) : (
                          option.icon
                        )}
                      </span>
                    )}

                    {/* Option Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {option.label}
                        </span>
                        {option.badge && (
                          <span className={clsx(
                            'ml-2 px-2 py-1 text-xs font-medium rounded-full',
                            option.color
                              ? `bg-${option.color}-100 text-${option.color}-800`
                              : 'bg-gray-100 text-gray-800'
                          )}>
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {option.description}
                        </p>
                      )}
                    </div>

                    {/* Checkmark */}
                    {isSelected && showCheckmark && (
                      <CheckIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Preset variants for common use cases
export const DropdownVariants = {
  // Form dropdown
  form: {
    size: 'md' as const,
    variant: 'default' as const,
    showCheckmark: true,
  },
  
  // Filter dropdown
  filter: {
    size: 'sm' as const,
    variant: 'outline' as const,
    showCheckmark: false,
    clearable: true,
  },
  
  // Action dropdown
  action: {
    size: 'sm' as const,
    variant: 'filled' as const,
    showCheckmark: false,
  },
  
  // Multi-select dropdown
  multiSelect: {
    size: 'md' as const,
    variant: 'default' as const,
    multiple: true,
    showCheckmark: true,
    clearable: true,
  },
} as const;
