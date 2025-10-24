'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import DynamicField, { DynamicFieldConfig, FieldOption } from './DynamicField';
import Dropdown from './Dropdown';
import { dropdownUtils } from '@/hooks/useDropdown';

interface FieldEditorProps {
  field?: DynamicFieldConfig;
  onSave: (field: DynamicFieldConfig) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'email', label: 'Email Input' },
  { value: 'url', label: 'URL Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Select Dropdown' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'date', label: 'Date Picker' },
  { value: 'time', label: 'Time Picker' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'color', label: 'Color Picker' },
  { value: 'range', label: 'Range Slider' },
  { value: 'file', label: 'File Upload' }
];

const CATEGORIES = [
  { value: 'Basic Information', label: 'Basic Information' },
  { value: 'Physical Properties', label: 'Physical Properties' },
  { value: 'Nutritional Information', label: 'Nutritional Information' },
  { value: 'Quality & Certification', label: 'Quality & Certification' },
  { value: 'Storage & Handling', label: 'Storage & Handling' },
  { value: 'Pricing & Units', label: 'Pricing & Units' },
  { value: 'Other', label: 'Other' }
];

export default function FieldEditor({ field, onSave, onCancel, isOpen }: FieldEditorProps) {
  const [formData, setFormData] = useState<DynamicFieldConfig>({
    id: '',
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    description: '',
    options: [],
    min: undefined,
    max: undefined,
    step: undefined,
    rows: 3,
    accept: '',
    validation: {
      pattern: '',
      message: ''
    }
  });

  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (field) {
      setFormData(field);
    } else {
      setFormData({
        id: '',
        name: '',
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        description: '',
        options: [],
        min: undefined,
        max: undefined,
        step: undefined,
        rows: 3,
        accept: '',
        validation: {
          pattern: '',
          message: ''
        }
      });
    }
  }, [field]);

  const handleSave = () => {
    if (!formData.id || !formData.name || !formData.label) {
      alert('Please fill in required fields');
      return;
    }

    onSave(formData);
  };

  const addOption = () => {
    if (newOption.trim()) {
      const option: FieldOption = {
        label: newOption.trim(),
        value: newOption.trim().toLowerCase().replace(/\s+/g, '_')
      };
      setFormData({
        ...formData,
        options: [...(formData.options || []), option]
      });
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const updateOption = (index: number, field: 'label' | 'value', value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {field ? 'Edit Field' : 'Add New Field'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field ID *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g., product_weight"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Product Weight"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Weight (kg)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Type
                </label>
                <Dropdown
                  options={FIELD_TYPES}
                  value={formData.type}
                  onChange={(value) => setFormData({ ...formData, type: value as any })}
                  placeholder="Select field type"
                  searchable={false}
                  clearable={false}
                  variant="default"
                  size="md"
                  className="w-full"
                  showCheckmark={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Dropdown
                  options={CATEGORIES}
                  value={formData.category || 'Other'}
                  onChange={(value) => setFormData({ ...formData, category: value as string })}
                  placeholder="Select category"
                  searchable={false}
                  clearable={false}
                  variant="default"
                  size="md"
                  className="w-full"
                  showCheckmark={false}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Required field</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder Text
              </label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Enter placeholder text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter field description..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Options for select, multiselect, radio */}
            {['select', 'multiselect', 'radio'].includes(formData.type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {formData.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => updateOption(index, 'label', e.target.value)}
                        placeholder="Option label"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={option.value}
                        onChange={(e) => updateOption(index, 'value', e.target.value)}
                        placeholder="Option value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add new option"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    />
                    <button
                      onClick={addOption}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                    >
                      <Icon name="plus" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Number-specific fields */}
            {formData.type === 'number' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Value
                  </label>
                  <input
                    type="number"
                    value={formData.min || ''}
                    onChange={(e) => setFormData({ ...formData, min: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Value
                  </label>
                  <input
                    type="number"
                    value={formData.max || ''}
                    onChange={(e) => setFormData({ ...formData, max: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step
                  </label>
                  <input
                    type="number"
                    value={formData.step || ''}
                    onChange={(e) => setFormData({ ...formData, step: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Textarea-specific fields */}
            {formData.type === 'textarea' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rows
                </label>
                <input
                  type="number"
                  value={formData.rows || 3}
                  onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            )}

            {/* File-specific fields */}
            {formData.type === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accept File Types
                </label>
                <input
                  type="text"
                  value={formData.accept || ''}
                  onChange={(e) => setFormData({ ...formData, accept: e.target.value })}
                  placeholder="e.g., image/*,.pdf,.doc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              {field ? 'Update Field' : 'Add Field'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
