'use client';

import { useState } from 'react';
import Icon from './Icon';

export interface FieldOption {
  label: string;
  value: string;
}

export interface DynamicFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
  required: boolean;
  placeholder?: string;
  description?: string;
  category?: string;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  accept?: string;
  validation?: {
    pattern?: string;
    message?: string;
  };
}

interface DynamicFieldProps {
  config: DynamicFieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export default function DynamicField({ config, value, onChange, error, disabled = false }: DynamicFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderField = () => {
    const baseClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

    switch (config.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={config.type}
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            required={config.required}
            disabled={disabled}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            placeholder={config.placeholder}
            required={config.required}
            disabled={disabled}
            min={config.min}
            max={config.max}
            step={config.step}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            required={config.required}
            disabled={disabled}
            rows={config.rows || 3}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );

      case 'select':
        return (
          <select
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            <option value="">Select {config.label}</option>
            {config.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {config.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange([...currentValues, option.value]);
                    } else {
                      handleChange(currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                  disabled={disabled}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={config.id}
              name={config.name}
              checked={!!value}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor={config.id} className="text-sm text-gray-700">
              {config.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {config.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={config.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={disabled}
                  className="border-gray-300 text-orange-600 focus:ring-orange-500"
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
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={config.required}
            disabled={disabled}
            className={baseClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        );

      case 'color':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="color"
              id={config.id}
              name={config.name}
              value={value || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="#000000"
              disabled={disabled}
              className={`flex-1 ${baseClasses}`}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              id={config.id}
              name={config.name}
              value={value || 0}
              onChange={(e) => handleChange(parseFloat(e.target.value))}
              min={config.min || 0}
              max={config.max || 100}
              step={config.step || 1}
              disabled={disabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{config.min || 0}</span>
              <span className="font-medium">{value || 0}</span>
              <span>{config.max || 100}</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              id={config.id}
              name={config.name}
              onChange={(e) => handleChange(e.target.files?.[0] || null)}
              accept={config.accept}
              disabled={disabled}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {value && (
              <div className="text-sm text-gray-600">
                Selected: {value.name}
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={config.id}
            name={config.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700">
        {config.label}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderField()}
      
      {config.description && (
        <p className="text-xs text-gray-500">{config.description}</p>
      )}
      
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <Icon name="exclamation-triangle" className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
