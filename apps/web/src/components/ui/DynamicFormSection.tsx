'use client';

import React from 'react';
import DynamicFieldRenderer, { DynamicFieldConfig } from './DynamicFieldRenderer';

interface DynamicFormSectionProps {
  title: string;
  fields: DynamicFieldConfig[];
  formData: Record<string, any>;
  onFieldChange: (fieldName: string, value: any) => void;
  errors?: Record<string, string>;
  className?: string;
}

export default function DynamicFormSection({ 
  title, 
  fields, 
  formData, 
  onFieldChange, 
  errors = {},
  className = ""
}: DynamicFormSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-lg font-semibold text-gray-900">
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <DynamicFieldRenderer
            key={field.id}
            field={field}
            value={formData[field.name]}
            onChange={(value) => onFieldChange(field.name, value)}
            error={errors[field.name]}
          />
        ))}
      </div>
    </div>
  );
}
