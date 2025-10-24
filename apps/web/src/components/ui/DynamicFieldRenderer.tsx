'use client';

import React from 'react';
import Dropdown from './Dropdown';
import { dropdownUtils } from '@/hooks/useDropdown';

export interface DynamicFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  accept?: string;
  validation?: {
    pattern?: string;
    message?: string;
  };
  category?: string;
}

interface DynamicFieldRendererProps {
  field: DynamicFieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export default function DynamicFieldRenderer({ field, value, onChange, error }: DynamicFieldRendererProps) {
  const baseInputClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
  const errorClasses = error ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300";

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
            placeholder={field.placeholder}
            required={field.required}
            pattern={field.validation?.pattern}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses} resize-none`}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 3}
          />
        );

      case 'select':
        return (
          <Dropdown
            options={field.options || []}
            value={value || ''}
            onChange={(val) => onChange(val)}
            placeholder={field.placeholder || 'Select an option'}
            searchable={false}
            clearable={!field.required}
            variant="default"
            size="md"
            className="w-full"
            showCheckmark={false}
          />
        );

      case 'multiselect':
        return (
          <Dropdown
            options={field.options || []}
            value={Array.isArray(value) ? value : []}
            onChange={(val) => onChange(val)}
            placeholder={field.placeholder || 'Select options'}
            searchable={false}
            clearable={true}
            variant="default"
            size="md"
            className="w-full"
            showCheckmark={false}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
            required={field.required}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
            required={field.required}
          />
        );

      case 'color':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-600 font-mono">{value || '#000000'}</span>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value || field.min || 0}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="w-full"
              min={field.min}
              max={field.max}
              step={field.step}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{field.min || 0}</span>
              <span className="font-medium">{value || field.min || 0}</span>
              <span>{field.max || 100}</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0])}
            className={`${baseInputClasses} ${errorClasses}`}
            accept={field.accept}
            required={field.required}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
