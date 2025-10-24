'use client';

import React from 'react';

export interface DynamicFieldDisplayConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
  value: any;
  options?: Array<{ label: string; value: string }>;
  unit?: string;
  category?: string;
}

interface DynamicFieldDisplayProps {
  field: DynamicFieldDisplayConfig;
  className?: string;
}

export default function DynamicFieldDisplay({ field, className = '' }: DynamicFieldDisplayProps) {
  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }

    switch (type) {
      case 'checkbox':
        return value ? 'Yes' : 'No';
      case 'multiselect':
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : 'None selected';
        }
        return value;
      case 'select':
      case 'radio':
        if (field.options) {
          const option = field.options.find(opt => opt.value === value);
          return option ? option.label : value;
        }
        return value;
      case 'number':
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numValue)) return 'Not specified';
        return field.unit ? `${numValue} ${field.unit}` : numValue.toString();
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'time':
        return new Date(`2000-01-01T${value}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded border border-gray-300" 
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-sm">{value}</span>
          </div>
        );
      case 'range':
        return `${value}${field.unit ? ` ${field.unit}` : ''}`;
      case 'file':
        if (typeof value === 'string') {
          return (
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View File
            </a>
          );
        }
        return value;
      default:
        return Array.isArray(value) ? value.join(', ') : String(value);
    }
  };

  const displayValue = formatValue(field.value, field.type);

  return (
    <div className={`space-y-1 ${className}`}>
      <span className="text-sm font-medium text-gray-700 block">
        {field.label}
      </span>
      <div className="text-gray-900">
        {typeof displayValue === 'string' ? (
          <span className="text-sm">{displayValue}</span>
        ) : (
          displayValue
        )}
      </div>
    </div>
  );
}
