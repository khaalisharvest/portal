'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { productTypesApi, ProductType, CreateProductTypeDto } from '@/services/productTypes';
import { categoriesApi, Category } from '@/services/categories';
import Dropdown from '@/components/ui/Dropdown';
import { dropdownUtils } from '@/hooks/useDropdown';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import FieldEditor from '@/components/ui/FieldEditor';
import { DynamicFieldConfig } from '@/components/ui/DynamicField';
import { NATURAL_PRODUCT_FIELD_TEMPLATES } from '@/components/ui/FieldTemplates';

export default function ProductTypesManagement() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  
  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Dynamic field management states
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldConfig[]>([]);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState<DynamicFieldConfig | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [formData, setFormData] = useState<CreateProductTypeDto>({
    name: '',
    displayName: '',
    description: '',
    categoryId: '',
    specifications: {
      fields: []
    },
    pricing: {
      primaryMethod: 'quantity',
      hasWeight: false,
      hasVolume: false,
      hasQuantity: true,
      hasSize: false,
      units: ['piece']
    },
    isActive: true,
    sortOrder: 0,
    color: '#10B981',
  });

  useEffect(() => {
    loadProductTypes();
    loadCategories();
  }, []);

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      const data = await productTypesApi.getAll();
      setProductTypes(data);
    } catch (error) {
      // Error loading product types
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      // Error loading categories
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        categoryId: categoryId || formData.categoryId,
        specifications: {
          ...formData.specifications,
          fields: dynamicFields // Use current dynamicFields instead of formData.specifications.fields
        }
      };
      if (editingType) {
        await productTypesApi.update(editingType.id, payload);
      } else {
        await productTypesApi.create(payload);
      }
      await loadProductTypes();
      resetForm();
    } catch (error) {
      // Error saving product type
    }
  };

  const handleEdit = (productType: ProductType) => {
    setEditingType(productType);
    const customFields = productType.specifications?.fields || [];
    setDynamicFields(customFields);
    
    setFormData({
      name: productType.name,
      displayName: productType.displayName,
      description: productType.description || '',
      categoryId: (productType as any).categoryId || '',
      specifications: productType.specifications || { fields: customFields },
      pricing: productType.pricing || {
        primaryMethod: 'quantity',
        hasWeight: false,
        hasVolume: false,
        hasQuantity: true,
        hasSize: false,
        units: ['piece']
      },
      isActive: productType.isActive,
      sortOrder: productType.sortOrder,
      color: productType.color || '#10B981',
    });
    setCategoryId((productType as any).categoryId || '');
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setPendingDelete({ id, name });
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await productTypesApi.delete(pendingDelete.id);
      await loadProductTypes();
    } catch (error) {
      // Error deleting product type
    } finally {
      setShowConfirmDialog(false);
      setPendingDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setPendingDelete(null);
  };

  // Dynamic field management functions
  // Essential fields that cannot be duplicated
  const ESSENTIAL_FIELD_NAMES = [
    'product_name', 'name', 'productName',
    'description', 'desc',
    'price', 'cost',
    'images', 'image', 'photos',
    'availability', 'available', 'in_stock',
    'unit', 'measurement_unit'
  ];

  // Check if a field name conflicts with essential fields
  const isDuplicateField = (fieldName: string, fieldLabel: string) => {
    const normalizedName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedLabel = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return ESSENTIAL_FIELD_NAMES.some(essential => 
      normalizedName.includes(essential) || 
      essential.includes(normalizedName) ||
      normalizedLabel.includes(essential) ||
      essential.includes(normalizedLabel)
    );
  };

  const handleAddField = () => {
    setEditingField(null);
    setShowFieldEditor(true);
  };

  const handleEditField = (fieldId: string) => {
    const field = dynamicFields.find(f => f.id === fieldId);
    if (field) {
      setEditingField(field);
      setShowFieldEditor(true);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    const updatedFields = dynamicFields.filter(f => f.id !== fieldId);
    setDynamicFields(updatedFields);
    
    // Update formData.specifications.fields to reflect the removal
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        fields: updatedFields
      }
    }));
  };

  const handleSaveField = (field: DynamicFieldConfig) => {
    // Check for duplicates with essential fields
    if (isDuplicateField(field.name, field.label)) {
      return;
    }

    // Check for duplicates with existing custom fields
    const existingField = dynamicFields.find(f => 
      f.id !== field.id && (
        f.name.toLowerCase() === field.name.toLowerCase() ||
        f.label.toLowerCase() === field.label.toLowerCase()
      )
    );

    if (existingField) {
      return;
    }

    let updatedFields;
    if (editingField) {
      // Update existing field
      updatedFields = dynamicFields.map(f => f.id === field.id ? field : f);
    } else {
      // Add new field
      updatedFields = [...dynamicFields, field];
    }
    
    setDynamicFields(updatedFields);
    
    // Update formData.specifications.fields to include the custom fields
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        fields: updatedFields
      }
    }));
    
    setShowFieldEditor(false);
    setEditingField(null);
  };

  const handleCancelFieldEdit = () => {
    setShowFieldEditor(false);
    setEditingField(null);
  };

  const handleApplyTemplate = (templateKey: string) => {
    const templateFields = NATURAL_PRODUCT_FIELD_TEMPLATES[templateKey] || [];
    
    // Filter out fields that conflict with essential fields
    const filteredFields = templateFields.filter(field => 
      !isDuplicateField(field.name, field.label)
    );
    
    setDynamicFields(prev => [...prev, ...filteredFields]);
    setShowTemplates(false);
  };

  const handleResetFields = () => {
    setDynamicFields([]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      categoryId: '',
      specifications: { fields: [] },
      pricing: {
        primaryMethod: 'quantity',
        hasWeight: false,
        hasVolume: false,
        hasQuantity: true,
        hasSize: false,
        units: ['piece']
      },
      isActive: true,
      sortOrder: 0,
      color: '#10B981',
    });
    setDynamicFields([]);
    setEditingType(null);
    setCategoryId('');
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading product types...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">Product Types Management</h2>
          <p className="text-gray-600 font-['Open_Sans']">Create and manage product types with custom fields and specifications for Khaalis Harvest</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-green-600 transition-all duration-200 flex items-center space-x-2"
          title="Add new product type"
        >
          <Icon name="plus" className="w-5 h-5" />
          <span>Add Product Type</span>
        </button>
      </div>

      {/* Product Types List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Product Types</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-16 w-16 relative">
                        <Image
                          src="/images/logo.png"
                          alt="Khaalis Harvest Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p>No product types available. Add your first product type!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                productTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: type.color }}
                          >
                            {type.displayName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{type.displayName}</div>
                          <div className="text-sm text-gray-500">{type.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          const category = categories.find(c => c.id === (type as any).categoryId);
                          return category ? category.name : 'Unknown Category';
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {type.pricing?.hasWeight && <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Weight</span>}
                        {type.pricing?.hasVolume && <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Volume</span>}
                        {type.pricing?.hasQuantity && <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Quantity</span>}
                        {type.pricing?.hasSize && <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Size</span>}
                        {!type.pricing?.hasWeight && !type.pricing?.hasVolume && !type.pricing?.hasQuantity && !type.pricing?.hasSize && (
                          <span className="text-xs text-gray-500">No pricing model</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {(type.specifications?.fields || []).length} fields
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        type.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="inline-flex items-center px-3 py-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-md transition-colors"
                        title="Edit product type"
                      >
                        <Icon name="edit" className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id, type.name)}
                        className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete product type"
                      >
                        <Icon name="delete" className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 h-full w-full z-50">
          <div className="relative bg-white w-full h-full rounded-none shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-green-500 px-8 py-6 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white font-['Poppins']">
                    {editingType ? 'Edit Product Type' : 'Add New Product Type'}
                  </h3>
                  <p className="text-orange-100 font-['Open_Sans'] mt-1">
                    {editingType ? 'Update product type configuration' : 'Create a new product type for Khaalis Harvest'}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-white hover:text-orange-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                  title="Close form"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Form Content */}
            <div className="overflow-y-auto h-[calc(100%-96px)]">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
                {/* Basic Information Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Basic Information
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Essential details for your product type</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                          options={dropdownUtils.toOptions(categories)}
                          value={categoryId}
                          onChange={(value) => setCategoryId(value as string)}
                          placeholder="Select category"
                          searchable={false}
                          clearable={true}
                          variant="default"
                          size="md"
                          className="w-full"
                          showCheckmark={false}
                        />
                        <p className="text-xs text-gray-500 mt-1">Choose the parent category</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Type Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                            setFormData({ ...formData, name: value });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., mango, orange, apple"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-converted to lowercase</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., Chaunsa Mango, Kinnow Orange"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">User-facing name</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-600 font-mono">{formData.color}</span>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Quick selection:</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
                                { name: 'Orange', value: '#F59E0B', bg: 'bg-orange-500' },
                                { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
                                { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
                                { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
                                { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' }
                              ].map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, color: color.value })}
                                  className={`w-6 h-6 rounded ${color.bg} hover:scale-110 transition-transform ${
                                    formData.color === color.value ? 'ring-2 ring-gray-400' : ''
                                  }`}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <div className="relative">
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          rows={3}
                          placeholder="Describe this product type..."
                          maxLength={500}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {(formData.description || '').length}/500
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">Optional description</p>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, description: 'Premium quality organic product with superior taste and nutritional value.' })}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Use template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Model Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Pricing Model
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Choose how products will be priced and sold</p>
                  </div>
                  
                  <div className="p-6">
                  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Weight-based Pricing */}
                      <label className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.pricing?.primaryMethod === 'weight' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="pricingMethod"
                          value="weight"
                          checked={formData.pricing?.primaryMethod === 'weight'}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { 
                              ...formData.pricing!, 
                              primaryMethod: e.target.value as 'weight' | 'volume' | 'quantity' | 'size',
                              hasWeight: true,
                              hasVolume: false,
                              hasQuantity: false,
                              hasSize: false,
                              units: ['kg', 'g', 'pound', 'ounce']
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex items-center">
                          <div>
                            <span className="text-sm font-semibold text-gray-800">Weight-based</span>
                            <p className="text-xs text-gray-500">Fruits, vegetables, grains, nuts</p>
                          </div>
                        </div>
                      </label>
                    
                      {/* Volume-based Pricing */}
                      <label className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.pricing?.primaryMethod === 'volume' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="pricingMethod"
                          value="volume"
                          checked={formData.pricing?.primaryMethod === 'volume'}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { 
                              ...formData.pricing!, 
                              primaryMethod: e.target.value as 'weight' | 'volume' | 'quantity' | 'size',
                              hasWeight: false,
                              hasVolume: true,
                              hasQuantity: false,
                              hasSize: false,
                              units: ['liter', 'ml', 'gallon', 'cup']
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex items-center">
                          <div>
                            <span className="text-sm font-semibold text-gray-800">Volume-based</span>
                            <p className="text-xs text-gray-500">Milk, juice, oil, beverages</p>
                          </div>
                        </div>
                      </label>
                      
                      {/* Quantity-based Pricing */}
                      <label className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.pricing?.primaryMethod === 'quantity' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="pricingMethod"
                          value="quantity"
                          checked={formData.pricing?.primaryMethod === 'quantity'}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { 
                              ...formData.pricing!, 
                              primaryMethod: e.target.value as 'weight' | 'volume' | 'quantity' | 'size',
                              hasWeight: false,
                              hasVolume: false,
                              hasQuantity: true,
                              hasSize: false,
                              units: ['piece', 'dozen', 'pack', 'bunch']
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex items-center">
                          <div>
                            <span className="text-sm font-semibold text-gray-800">Quantity-based</span>
                            <p className="text-xs text-gray-500">Eggs, fruits by piece, herbs</p>
                          </div>
                        </div>
                      </label>
                      
                      {/* Size-based Pricing */}
                      <label className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.pricing?.primaryMethod === 'size' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="pricingMethod"
                          value="size"
                          checked={formData.pricing?.primaryMethod === 'size'}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { 
                              ...formData.pricing!, 
                              primaryMethod: e.target.value as 'weight' | 'volume' | 'quantity' | 'size',
                              hasWeight: false,
                              hasVolume: false,
                              hasQuantity: false,
                              hasSize: true,
                              units: ['small', 'medium', 'large', 'extra-large']
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex items-center">
                          <div>
                            <span className="text-sm font-semibold text-gray-800">Size-based</span>
                            <p className="text-xs text-gray-500">Products with size variations</p>
                          </div>
                        </div>
                      </label>
                  </div>
                  
                    {/* Available Units Display */}
                    {formData.pricing?.primaryMethod && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-semibold text-gray-800 mb-3">
                          Available Units for {formData.pricing.primaryMethod.charAt(0).toUpperCase() + formData.pricing.primaryMethod.slice(1)}-based Pricing
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {(formData.pricing?.units || []).map((unit, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                              {unit}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          These units will be available when creating products of this type.
                        </p>
                      </div>
                    )}
                  </div>
                </div>


                {/* Essential Fields Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Essential Fields (Always Included)
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Core fields automatically included for all products</p>
                  </div>
                  
                  <div className="p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { name: 'Product Name', description: 'Basic product identification' },
                        { name: 'Description', description: 'Product details and information' },
                        { name: 'Price', description: 'Selling price per unit' },
                        { name: 'Images', description: 'Product photos and visuals' },
                        { name: 'Availability', description: 'Stock status and availability' },
                        { name: 'Unit', description: 'Measurement unit (kg, liter, piece, etc.)' }
                      ].map((field, idx) => (
                        <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-800">{field.name}</span>
                            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                          </div>
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <Icon name="check" className="w-3 h-3 text-green-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Fields Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Custom Fields (Optional)
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">Add specific fields for this product type</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowTemplates(true)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 hover:border-gray-400 transition-colors text-sm font-medium"
                        >
                          Templates
                        </button>
                        <button
                          type="button"
                          onClick={handleAddField}
                          className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-md hover:bg-blue-700 hover:border-blue-700 transition-colors text-sm font-medium"
                        >
                          Add Field
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-6">
                    <p className="text-sm text-gray-600 font-['Open_Sans'] mb-4">
                      Add specific fields for this product type. Use templates for common categories or create custom fields.
                    </p>
                  </div>

                  {dynamicFields.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            {dynamicFields.length} custom field{dynamicFields.length !== 1 ? 's' : ''} added
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Optional
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetFields}
                          className="text-gray-500 hover:text-red-600 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-md border border-transparent hover:border-red-200 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {dynamicFields.map((field, idx) => (
                          <div key={field.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                            <div className="flex items-center flex-1">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-gray-800">{field.label}</span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    {field.type}
                                  </span>
                                  {field.required && (
                                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                {field.description && (
                                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                type="button"
                                onClick={() => handleEditField(field.id)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-200"
                                title="Edit field"
                              >
                                <Icon name="edit" className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveField(field.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
                                title="Remove field"
                              >
                                <Icon name="delete" className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No custom fields added yet</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Add custom fields to capture specific information for this product type. 
                        Use templates for common categories or create your own fields.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          type="button"
                          onClick={() => setShowTemplates(true)}
                          className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 hover:border-gray-400 transition-colors text-sm font-medium"
                        >
                          Browse Templates
                        </button>
                        <button
                          type="button"
                          onClick={handleAddField}
                          className="px-6 py-3 bg-blue-600 text-white border border-blue-600 rounded-md hover:bg-blue-700 hover:border-blue-700 transition-colors text-sm font-medium"
                        >
                          Create Custom Field
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* Settings Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Settings
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Configure product type settings</p>
                  </div>
                  
                  <div className="p-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-800 font-['Poppins']">Active Status</div>
                          <p className="text-xs text-gray-500 font-['Open_Sans'] mt-1">Make this product type available for use</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            formData.isActive ? 'bg-gradient-to-r from-orange-500 to-green-500' : 'bg-gray-300'
                          }`}
                          aria-pressed={formData.isActive}
                          aria-label="Toggle product type active"
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            formData.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
                      <label className="block text-sm font-semibold text-gray-800 mb-2 font-['Poppins']">Display Order</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                          className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-['Open_Sans'] text-center"
                          min="0"
                          max="999"
                        />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-['Open_Sans']">
                            <strong>0</strong> = First, <strong>10</strong> = Last
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Product types are sorted by this number (ascending)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 mt-6">
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center px-8 py-3 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 font-['Poppins']"
                      title="Cancel and close form"
                    >
                      <Icon name="close" className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-8 py-3 border-2 border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-lg hover:shadow-xl transition-all duration-200 font-['Poppins']"
                      title={editingType ? 'Update product type details' : 'Add new product type'}
                    >
                      <Icon name={editingType ? 'edit' : 'plus'} className="w-5 h-5 mr-2" />
                      {editingType ? 'Update Product Type' : 'Add Product Type'}
                    </button>
                  </div>
                </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Choose a Template</h2>
                  <p className="text-sm text-gray-600 mt-1">Select a pre-configured field set for your product type</p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(NATURAL_PRODUCT_FIELD_TEMPLATES).map(([key, fields]) => (
                  <div
                    key={key}
                    className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => handleApplyTemplate(key)}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold mr-3 group-hover:scale-105 transition-transform">
                        {key.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">{key.replace('_', ' ')}</h3>
                        <p className="text-sm text-gray-500">{fields.length} custom fields</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pre-configured fields for {key.replace('_', ' ')} products
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {fields.slice(0, 4).map((field, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-medium"
                        >
                          {field.label}
                        </span>
                      ))}
                      {fields.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{fields.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Templates will add fields to your existing configuration
                </p>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Editor Modal */}
      <FieldEditor
        field={editingField || undefined}
        onSave={handleSaveField}
        onCancel={handleCancelFieldEdit}
        isOpen={showFieldEditor}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Product Type"
        message={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
