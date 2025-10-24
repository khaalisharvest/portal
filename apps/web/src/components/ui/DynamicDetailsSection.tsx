'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DynamicFieldDisplay, { DynamicFieldDisplayConfig } from './DynamicFieldDisplay';

interface DynamicDetailsSectionProps {
  title: string;
  fields: DynamicFieldDisplayConfig[];
  productData: Record<string, any>;
  className?: string;
  animationDelay?: number;
}

export default function DynamicDetailsSection({ 
  title, 
  fields, 
  productData, 
  className = '',
  animationDelay = 0 
}: DynamicDetailsSectionProps) {
  // Filter out empty or null values
  const validFields = fields.filter(field => {
    const value = productData[field.name];
    return value !== null && value !== undefined && value !== '' && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  if (validFields.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: animationDelay }}
      className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}
    >
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        {title}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {validFields.map((field) => (
          <DynamicFieldDisplay
            key={field.name}
            field={{
              ...field,
              value: productData[field.name]
            }}
            className="p-4 bg-gray-50 rounded-lg"
          />
        ))}
      </div>
    </motion.div>
  );
}
