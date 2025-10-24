'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Category } from '@/services/categories';
import { ProductType } from '@/services/productTypes';
import { useAuth } from '@/contexts/AuthContext';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import { useSingleDropdown, useMultiDropdown, dropdownUtils } from '@/hooks/useDropdown';
import FilterBar from '@/components/ui/FilterBar';
import CategoryTabs from '@/components/ui/CategoryTabs';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import DynamicFormSection from '@/components/ui/DynamicFormSection';
import { DynamicFieldConfig } from '@/components/ui/DynamicField';
import { API_URL } from '@/config/env';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  supplierId?: string;
  adminId: string;
  inventoryType: 'marketplace' | 'warehouse';
  isAvailable: boolean;
  unit: string;
  stockQuantity?: number;
  minStockLevel?: number;
  featured: boolean;
  isOrganic: boolean;
  isFresh: boolean;
  weight?: number;
  dimensions?: Record<string, any>;
  marketplaceSupplier?: string;
  marketplaceInfo?: {
    supplierName?: string;
    supplierContact?: string;
    estimatedDeliveryTime?: string;
    minimumOrderQuantity?: number;
    maximumOrderQuantity?: number;
    leadTime?: number;
  };
  specifications?: {
    quality?: string;
    variety?: string;
    season?: string;
    origin?: string;
    certification?: string[];
  };
  nutritionInfo?: {
    calories?: string;
    fiber?: string;
    sugar?: string;
    vitamins?: string[];
    minerals?: string[];
  };
  tags?: string[];
  // Variant fields
  hasVariants?: boolean;
  variantName?: string;
  variants?: Array<{
    name: string;
    price: number;
    originalPrice?: number;
    isAvailable?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Using imported types from services

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  // Dynamic form states
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldConfig[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductTypeFilter, setSelectedProductTypeFilter] = useState('');
  
  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Dropdown hooks for form
  const categoryDropdown = useSingleDropdown('', (value) => {
    console.log('🔄 Category dropdown changed to:', value);
    setFormData(prev => {
      const updated = {...prev, categoryId: value || ''};
      console.log('🔄 Updated form data categoryId:', updated.categoryId);
      return updated;
    });
    // Clear product type when category changes
    productTypeDropdown.clear();
  });
  
  const productTypeDropdown = useSingleDropdown('', (value) => {
    // When product type changes: update formData and reset unit to first allowed unit (if defined)
    const selected = productTypes.find(pt => pt.id === value);
    const nextUnit = selected?.pricing?.units?.[0] || formData.unit;
    setFormData(prev => ({
      ...prev,
      productTypeId: value || '',
      unit: nextUnit,
    }));
    
    // Load dynamic fields when product type changes
    if (value && selected) {
      setSelectedProductType(selected);
      setDynamicFields(selected.specifications?.fields || []);
    } else {
      setSelectedProductType(null);
      setDynamicFields([]);
    }
  });
  
  const unitDropdown = useSingleDropdown('kg', (value) => {
    setFormData(prev => ({...prev, unit: value}));
  });

  // Handle dynamic field changes
  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const inventoryTypeDropdown = useSingleDropdown('warehouse', (value) => {
    setFormData(prev => ({ ...prev, inventoryType: value as 'marketplace' | 'warehouse' }));
  });

  // Dropdown hooks for filters
  const categoryFilterDropdown = useSingleDropdown('', (value) => {
    setSelectedCategory(value);
    // Clear product type filter when category changes
    setSelectedProductTypeFilter('');
    productTypeFilterDropdown.clear();
  });
  
  const productTypeFilterDropdown = useSingleDropdown('', (value) => {
    setSelectedProductTypeFilter(value);
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(page, searchTerm, selectedCategory, selectedProductTypeFilter);
  };
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    images: '',
    categoryId: '',
    productTypeId: '',
    supplierId: '',
    adminId: '',
    inventoryType: 'warehouse',
    isAvailable: true,
    unit: 'kg',
    stockQuantity: '',
    minStockLevel: '',
    featured: false,
    isOrganic: false,
    isFresh: true,
    weight: '',
    dimensions: '',
    marketplaceSupplier: '',
    // Variant fields
    hasVariants: false,
    variantName: '',
    variants: [],
    // Specifications (flexible key-value pairs)
    quality: '',
    variety: '',
    season: '',
    origin: '',
    certification: '',
    // Nutrition Info (flexible key-value pairs)
    calories: '',
    fiber: '',
    sugar: '',
    vitamins: '',
    minerals: '',
    // Tags
    tags: '',
    // Marketplace Info
    estimatedDeliveryTime: '',
    minimumOrderQuantity: '',
    maximumOrderQuantity: '',
    leadTime: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchAllCategoriesAndTypes();
  }, []);

  const fetchAllCategoriesAndTypes = async () => {
    try {
      // Fetch all categories with their product types in a single API call
      // This provides complete data for admin forms and maintains relationships
      const response = await fetch(`${API_URL}/products/categories-with-types`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('backend_token') : ''}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const categoriesData = data.data || data;
        setCategories(categoriesData);
        
        // Extract all product types from categories for dropdown filtering
        const allProductTypes: ProductType[] = [];
        categoriesData?.forEach((category: any) => {
          if (category.productTypes && category.productTypes.length > 0) {
            allProductTypes.push(...category.productTypes);
          }
        });
        setProductTypes(allProductTypes);
      }
    } catch (error) {
      console.error('Error fetching categories with types:', error);
    }
  };

  // Immediate filter effect for dropdowns
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1, searchTerm, selectedCategory, selectedProductTypeFilter);
  }, [selectedCategory, selectedProductTypeFilter]);

  const fetchProducts = async (page: number = currentPage, search: string = searchTerm, category: string = selectedCategory, type: string = selectedProductTypeFilter) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (type) params.append('type', type);
      
      const response = await fetch(`${API_URL}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('backend_token') : ''}`,
        },
      });
      
      const data = await response.json();
      setProducts(data.data?.products || data.products || []);
      setTotalPages(data.data?.totalPages || data.totalPages || 1);
      setTotalProducts(data.data?.total || data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };


  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Compute images array from comma/newline separated input
      const imagesArray = formData.images
        ? formData.images
            .split(/\n|,/)
            .map(s => s.trim())
            .filter(Boolean)
        : [];

      // Build dynamic specifications object from product type fields
      const selectedType = productTypes.find(pt => pt.id === (formData.productTypeId || ''));
      const dynamicSpecs: Record<string, any> = {};
      if (selectedType?.specifications?.fields?.length) {
        selectedType.specifications.fields.forEach(field => {
          const key = field.name;
          const value = (formData as any)[key];
          if (value !== undefined && value !== '') {
            dynamicSpecs[key] = field.type === 'number' ? Number(value) : value;
          }
        });
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        images: imagesArray,
        categoryId: formData.categoryId && formData.categoryId !== '' ? formData.categoryId : undefined,
        productTypeId: formData.productTypeId && formData.productTypeId !== '' ? formData.productTypeId : undefined,
        supplierId: formData.supplierId || undefined,
        adminId: user?.id || 'admin-id',
        inventoryType: formData.inventoryType,
        isAvailable: formData.isAvailable,
        unit: formData.unit,
        stockQuantity: formData.inventoryType === 'marketplace' && formData.stockQuantity ? parseFloat(formData.stockQuantity) : undefined,
        minStockLevel: formData.inventoryType === 'marketplace' && formData.minStockLevel ? parseFloat(formData.minStockLevel) : undefined,
        featured: formData.featured,
        isOrganic: formData.isOrganic,
        isFresh: formData.isFresh,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: formData.dimensions ? JSON.parse(formData.dimensions) : undefined,
        marketplaceSupplier: formData.inventoryType === 'marketplace' ? formData.marketplaceSupplier : undefined,
        specifications: {
          quality: formData.quality,
          variety: formData.variety,
          season: formData.season,
          origin: formData.origin,
          certification: formData.certification ? formData.certification.split(',').map(c => c.trim()) : [],
          ...dynamicSpecs,
        },
        nutritionInfo: {
          calories: formData.calories,
          fiber: formData.fiber,
          sugar: formData.sugar,
          vitamins: formData.vitamins ? formData.vitamins.split(',').map(v => v.trim()) : [],
          minerals: formData.minerals ? formData.minerals.split(',').map(m => m.trim()) : [],
        },
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        marketplaceInfo: formData.inventoryType === 'marketplace' ? {
          supplierName: formData.marketplaceSupplier,
          estimatedDeliveryTime: formData.estimatedDeliveryTime,
          minimumOrderQuantity: formData.minimumOrderQuantity ? parseInt(formData.minimumOrderQuantity) : undefined,
          maximumOrderQuantity: formData.maximumOrderQuantity ? parseInt(formData.maximumOrderQuantity) : undefined,
          leadTime: formData.leadTime ? parseInt(formData.leadTime) : undefined,
        } : undefined,
        // Variant data
        hasVariants: formData.hasVariants,
        variantName: formData.hasVariants ? formData.variantName : undefined,
        variants: formData.hasVariants ? formData.variants.filter((v: any) => v.name && v.price > 0) : undefined,
      };

      // Debug final product data
      console.log('📤 Final Product Data - categoryId:', productData.categoryId);

      const url = editingProduct 
        ? `${API_URL}/products/${editingProduct.id}` 
        : `${API_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const backendToken = localStorage.getItem('backend_token');
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${backendToken}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        fetchProducts();
        resetForm();
      }
    } catch (error) {
      // Error saving product
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      images: (product.images || []).join(', '),
      categoryId: product.categoryId,
      productTypeId: product.productTypeId || '',
      supplierId: product.supplierId || '',
      adminId: product.adminId || '',
      inventoryType: product.inventoryType || 'warehouse',
      isAvailable: product.isAvailable,
      unit: product.unit || 'kg',
      stockQuantity: product.stockQuantity?.toString() || '',
      minStockLevel: product.minStockLevel?.toString() || '',
      featured: product.featured || false,
      isOrganic: product.isOrganic || false,
      isFresh: product.isFresh || true,
      weight: product.weight?.toString() || '',
      dimensions: product.dimensions ? JSON.stringify(product.dimensions) : '',
      marketplaceSupplier: product.marketplaceSupplier || '',
      // Variant fields
      hasVariants: product.hasVariants || false,
      variantName: product.variantName || '',
      variants: (product.variants as any) || [],
      quality: product.specifications?.quality || '',
      variety: product.specifications?.variety || '',
      season: product.specifications?.season || '',
      origin: product.specifications?.origin || '',
      certification: product.specifications?.certification?.join(', ') || '',
      calories: product.nutritionInfo?.calories || '',
      fiber: product.nutritionInfo?.fiber || '',
      sugar: product.nutritionInfo?.sugar || '',
      vitamins: product.nutritionInfo?.vitamins?.join(', ') || '',
      minerals: product.nutritionInfo?.minerals?.join(', ') || '',
      tags: product.tags?.join(', ') || '',
      estimatedDeliveryTime: product.marketplaceInfo?.estimatedDeliveryTime || '',
      minimumOrderQuantity: product.marketplaceInfo?.minimumOrderQuantity?.toString() || '',
      maximumOrderQuantity: product.marketplaceInfo?.maximumOrderQuantity?.toString() || '',
      leadTime: product.marketplaceInfo?.leadTime?.toString() || '',
    });
    
    // Update dropdown values
    categoryDropdown.setValue(product.categoryId);
    productTypeDropdown.setValue(product.productTypeId || '');
    unitDropdown.setValue(product.unit || 'kg');
    inventoryTypeDropdown.setValue(product.inventoryType || 'warehouse');
    
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setPendingDelete({ id, name });
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      const backendToken = localStorage.getItem('backend_token');
      
      const response = await fetch(`${API_URL}/products/${pendingDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${backendToken}`,
        },
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      // Error deleting product
    } finally {
      setShowConfirmDialog(false);
      setPendingDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setPendingDelete(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      images: '',
      categoryId: '',
      productTypeId: '',
      supplierId: '',
      adminId: '',
      inventoryType: 'warehouse',
      isAvailable: true,
      unit: 'kg',
      stockQuantity: '',
      minStockLevel: '',
      featured: false,
      isOrganic: false,
      isFresh: true,
      weight: '',
      dimensions: '',
      marketplaceSupplier: '',
      // Variant fields
      hasVariants: false,
      variantName: '',
      variants: [],
      quality: '',
      variety: '',
      season: '',
      origin: '',
      certification: '',
      calories: '',
      fiber: '',
      sugar: '',
      vitamins: '',
      minerals: '',
      tags: '',
      estimatedDeliveryTime: '',
      minimumOrderQuantity: '',
      maximumOrderQuantity: '',
      leadTime: '',
    });
    
    // Reset dropdown values
    categoryDropdown.clear();
    productTypeDropdown.clear();
    unitDropdown.setValue('kg');
    
    setEditingProduct(null);
    setShowForm(false);
  };

  // Convert data to dropdown options for form - show ALL categories/types
  const categoryOptions: DropdownOption[] = dropdownUtils.toOptions(categories);
  
  // Debug logging for category issue
  console.log('🔍 Category Dropdown Value:', categoryDropdown.value);
  console.log('🔍 Form Data CategoryId:', formData.categoryId);

  // Filter product types based on selected category
  const getFilteredProductTypes = () => {
    const selectedCategory = categoryDropdown.value;
    
    if (!selectedCategory) {
      // If no category selected, show all product types
      return productTypes;
    }
    
    // Find the selected category and return its product types
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    return selectedCategoryData?.productTypes || [];
  };

  const productTypeOptions: DropdownOption[] = dropdownUtils.toOptions(getFilteredProductTypes());

  // Convert data to dropdown options for filters - only show categories/types that have products
  const categoryFilterOptions: DropdownOption[] = dropdownUtils.toOptions(categories);
  
  // Filter product types for filter dropdown based on selected category
  const getFilteredProductTypesForFilter = () => {
    if (!selectedCategory) {
      // If no category selected, show all product types that have products
      return productTypes;
    }
    
    // Filter product types that belong to selected category
    return productTypes.filter(productType => 
      productType.categoryId === selectedCategory
    );
  };
  
  const productTypeFilterOptions: DropdownOption[] = dropdownUtils.toOptions(getFilteredProductTypesForFilter());

  const unitOptions: DropdownOption[] = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'lb', label: 'Pound (lb)' },
    { value: 'oz', label: 'Ounce (oz)' },
    { value: 'liter', label: 'Liter (L)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'gallon', label: 'Gallon' },
    { value: 'piece', label: 'Piece' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'pack', label: 'Pack' },
    { value: 'bunch', label: 'Bunch' },
    { value: 'box', label: 'Box' },
    { value: 'basket', label: 'Basket' },
    { value: 'bag', label: 'Bag' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'jar', label: 'Jar' },
    { value: 'plant', label: 'Plant' },
    { value: 'seedling', label: 'Seedling' },
    { value: 'cutting', label: 'Cutting' },
    { value: 'bulb', label: 'Bulb' },
  ];

  const inventoryTypeOptions: DropdownOption[] = [
    { value: 'warehouse', label: 'Khaalis Harvest Warehouse/Farm' },
    { value: 'marketplace', label: 'External Supplier' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">Organic Products Management</h2>
          <p className="text-gray-600 font-['Open_Sans']">Create, edit, and manage all types of organic products for Khaalis Harvest - from fresh produce to dairy, plants, and natural goods</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-green-600 transition-all duration-200 flex items-center space-x-2"
            title="Add new product"
          >
            <Icon name="plus" className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
                fetchProducts(1, searchTerm, selectedCategory, selectedProductTypeFilter);
              }
            }}
            className="w-full px-4 py-3 pl-10 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchProducts(1, searchTerm, selectedCategory, selectedProductTypeFilter);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="search" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Category and Product Type Navigation */}
      <CategoryTabs
        categories={categories}
        productTypes={productTypes}
        selectedCategory={selectedCategory}
        selectedProductType={selectedProductTypeFilter}
        onCategoryChange={(value) => {
          const categoryValue = Array.isArray(value) ? value[0] || '' : value;
          setSelectedCategory(categoryValue);
          categoryFilterDropdown.setValue(categoryValue);
        }}
        onProductTypeChange={(value) => {
          const typeValue = Array.isArray(value) ? value[0] || '' : value;
          setSelectedProductTypeFilter(typeValue);
          productTypeFilterDropdown.setValue(typeValue);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedCategory('');
          setSelectedProductTypeFilter('');
          setCurrentPage(1);
          categoryFilterDropdown.clear();
          productTypeFilterDropdown.clear();
          fetchProducts(1, '', '', '');
        }}
        className="mb-6"
      />

      {/* Products Display */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              All Products
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({totalProducts} total products)
              </span>
            </h3>
          </div>
        </div>
        
        {viewMode === 'list' ? (
          /* List View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-16 w-16 relative">
                          <Image
                            src="/images/logo.png"
                            alt="Khaalis Harvest Logo"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p>
                          {totalProducts === 0 
                            ? 'No products available. Add your first product!' 
                            : 'No products match your current filters. Try adjusting your search or filter criteria.'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={product.images?.[0] || '/images/placeholder.svg'}
                              alt={product.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">₨{product.price} per {product.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {categories.find(c => c.id === product.categoryId)?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {productTypes.find(p => p.id === product.productTypeId)?.displayName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.inventoryType === 'warehouse' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {product.inventoryType === 'warehouse' ? 'Khaalis Harvest' : 'External Supplier'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.inventoryType === 'warehouse' && product.stockQuantity !== undefined ? (
                          <div className="text-sm">
                            <div className={`font-medium ${
                              product.stockQuantity <= (product.minStockLevel || 0) 
                                ? 'text-red-600' 
                                : product.stockQuantity <= (product.minStockLevel || 0) * 2 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                            }`}>
                              {product.stockQuantity} {product.unit}
                            </div>
                            {product.stockQuantity <= (product.minStockLevel || 0) && (
                              <div className="text-xs text-red-500">Low Stock</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">N/A</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">
                          ₨{product.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center px-3 py-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-md transition-colors"
                          title="Edit product"
                        >
                          <Icon name="edit" className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete product"
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
        ) : (
          /* Card View */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const category = categories.find(c => c.id === product.categoryId);
                const productType = productTypes.find(p => p.id === product.productTypeId);
                
                return (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    {/* Image */}
                    <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-t-lg overflow-hidden">
                      <img
                        className="w-full h-48 object-cover"
                        src={product.images?.[0] || '/images/placeholder.svg'}
                        alt={product.name}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {product.isOrganic && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Organic
                            </span>
                          )}
                          {product.isFresh && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Fresh
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Category & Type */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {category?.name || 'N/A'}
                        </span>
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: productType?.color || '#6B7280' }}
                        >
                          {productType?.displayName || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-bold text-gray-900">₨{product.price}</div>
                        <div className="text-sm text-gray-600">per {product.unit}</div>
                      </div>
                      
                      {/* Stock Quantity (only for marketplace products) */}
                      {product.inventoryType === 'marketplace' && product.stockQuantity !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className={`text-sm font-medium ${
                              product.stockQuantity <= (product.minStockLevel || 0) 
                                ? 'text-red-600' 
                                : product.stockQuantity <= (product.minStockLevel || 0) * 2 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                            }`}>
                              {product.stockQuantity} {product.unit}
                              {product.stockQuantity <= (product.minStockLevel || 0) && ' (Low Stock)'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Status and Source */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.inventoryType === 'warehouse' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {product.inventoryType === 'warehouse' ? 'Khaalis Harvest' : 'External Supplier'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Quick Toggle:</span>
                          <button
                            onClick={async () => {
                              try {
                                const updatedProduct = { ...product, isAvailable: !product.isAvailable };
                                const response = await fetch(`${API_URL}/products/${product.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
                                  },
                                  body: JSON.stringify({
                                    ...updatedProduct,
                                    stockQuantity: updatedProduct.stockQuantity,
                                    minStockLevel: updatedProduct.minStockLevel,
                                    specifications: updatedProduct.specifications,
                                    nutritionInfo: updatedProduct.nutritionInfo,
                                    tags: updatedProduct.tags,
                                    marketplaceInfo: updatedProduct.marketplaceInfo,
                                  }),
                                });
                                
                                if (response.ok) {
                                  await fetchProducts();
                                }
                              } catch (error) {
                                console.error('Error updating product availability:', error);
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              product.isAvailable 
                                ? 'bg-gradient-to-r from-orange-500 to-green-500' 
                                : 'bg-gray-300'
                            }`}
                            title={`${product.isAvailable ? 'Make unavailable' : 'Make available'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              product.isAvailable ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className={`text-xs font-medium ${
                            product.isAvailable ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex-1 inline-flex items-center justify-center bg-orange-50 text-orange-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors"
                          title="Edit product"
                        >
                          <Icon name="edit" className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="flex-1 inline-flex items-center justify-center bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                          title="Delete product"
                        >
                          <Icon name="delete" className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        options={dropdownUtils.toOptions(categories)}
                        value={categoryDropdown.value}
                        onChange={categoryDropdown.handleChange}
                        placeholder="Select category"
                        searchable={false}
                        clearable={true}
                        variant="default"
                        size="md"
                        className="w-full"
                        showCheckmark={false}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Type <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        options={dropdownUtils.toOptions(productTypes.filter(pt => pt.categoryId === categoryDropdown.value))}
                        value={productTypeDropdown.value}
                        onChange={productTypeDropdown.handleChange}
                        placeholder="Select product type"
                        searchable={false}
                        clearable={true}
                        variant="default"
                        size="md"
                        className="w-full"
                        showCheckmark={false}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₨) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (₨)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({...prev, originalPrice: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <Dropdown
                        options={selectedProductType?.pricing?.units?.map(unit => ({ value: unit, label: unit })) || []}
                        value={unitDropdown.value}
                        onChange={unitDropdown.handleChange}
                        placeholder="Select unit"
                        searchable={false}
                        clearable={false}
                        variant="default"
                        size="md"
                        className="w-full"
                        showCheckmark={false}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      rows={3}
                      placeholder="Describe the product..."
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Images
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={formData.images}
                          onChange={(e) => setFormData(prev => ({...prev, images: e.target.value}))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, images: ''}))}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                          title="Clear images"
                        >
                          <Icon name="close" className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Image Previews */}
                      {formData.images && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Image Previews:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.images
                              .split(/\n|,/)
                              .map(s => s.trim())
                              .filter(Boolean)
                              .map((imageUrl, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={imageUrl}
                                    alt={`Preview ${index + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const imageUrls = formData.images
                                        .split(/\n|,/)
                                        .map(s => s.trim())
                                        .filter(Boolean);
                                      imageUrls.splice(index, 1);
                                      setFormData(prev => ({
                                        ...prev,
                                        images: imageUrls.join(', ')
                                      }));
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                    title="Remove this image"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Enter image URLs separated by commas or new lines
                      </p>
                    </div>
                  </div>
                </div>

                {/* Variant Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Variant Settings
                  </h4>
                  
                  {/* Has Variants Toggle */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-800">Has Variants</span>
                        <p className="text-xs text-gray-500">Enable different options for this product (e.g., Size, Quality, Leaf Size)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, hasVariants: !prev.hasVariants}))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          formData.hasVariants ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            formData.hasVariants ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Variant Configuration */}
                  {formData.hasVariants && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Variant Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.variantName}
                          onChange={(e) => setFormData(prev => ({...prev, variantName: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., Size, Quality, Leaf Size, Color"
                          required={formData.hasVariants}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be the label shown to customers (e.g., "Select Size", "Choose Quality")
                        </p>
                      </div>

                      {/* Variants List */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Variant Options <span className="text-red-500">*</span>
                        </label>
                        
                        {formData.variants.map((variant, index) => (
                          <div key={index} className="w-full mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 w-full">
                              {/* Option Name - Takes more width */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={(variant as any).name || ''}
                                  onChange={(e) => {
                                    const newVariants = [...(formData.variants as any)];
                                    newVariants[index] = { ...newVariants[index], name: e.target.value };
                                    setFormData(prev => ({...prev, variants: newVariants as any}));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Option name (e.g., Small, Large, Premium)"
                                  required
                                />
                              </div>
                              
                              {/* Price - Fixed width */}
                              <div className="w-24">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={(variant as any).price || ''}
                                  onChange={(e) => {
                                    const newVariants = [...(formData.variants as any)];
                                    newVariants[index] = { ...newVariants[index], price: parseFloat(e.target.value) || 0 };
                                    setFormData(prev => ({...prev, variants: newVariants as any}));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Price"
                                  required
                                />
                              </div>
                              
                              {/* Original Price - Fixed width */}
                              <div className="w-24">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={(variant as any).originalPrice || ''}
                                  onChange={(e) => {
                                    const newVariants = [...(formData.variants as any)];
                                    newVariants[index] = { ...newVariants[index], originalPrice: parseFloat(e.target.value) || 0 };
                                    setFormData(prev => ({...prev, variants: newVariants as any}));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Original"
                                />
                              </div>
                              
                              {/* Available Toggle - Fixed width */}
                              <div className="w-20 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariants = [...(formData.variants as any)];
                                    newVariants[index] = { ...newVariants[index], isAvailable: !(newVariants[index] as any).isAvailable };
                                    setFormData(prev => ({...prev, variants: newVariants as any}));
                                  }}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                                    (variant as any).isAvailable !== false ? 'bg-green-600' : 'bg-gray-300'
                                  }`}
                                  title={(variant as any).isAvailable !== false ? 'Available' : 'Unavailable'}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                                      (variant as any).isAvailable !== false ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              
                              {/* Remove Button - Fixed width */}
                              <div className="w-10 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariants = (formData.variants as any).filter((_: any, i: number) => i !== index);
                                    setFormData(prev => ({...prev, variants: newVariants as any}));
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Remove this variant"
                                >
                                  <Icon name="delete" className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              variants: [...(prev.variants as any), { name: '', price: 0, originalPrice: 0, isAvailable: true }] as any
                            }));
                          }}
                          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Icon name="plus" className="w-4 h-4" />
                          <span>Add Variant Option</span>
                        </button>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Add different options for this product. Each variant can have its own price, original price, and availability status.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Fields based on Product Type */}
                {selectedProductType && dynamicFields.length > 0 && (
                  <DynamicFormSection
                    title={`${selectedProductType.displayName} Specifications`}
                    fields={dynamicFields}
                    formData={formData}
                    onFieldChange={handleDynamicFieldChange}
                    errors={formErrors}
                  />
                )}

                {/* Inventory Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Inventory Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inventory Type
                      </label>
                      <Dropdown
                        options={[
                          { value: 'warehouse', label: 'Khaalis Harvest Warehouse/Farm' },
                          { value: 'marketplace', label: 'External Supplier' }
                        ]}
                        value={inventoryTypeDropdown.value}
                        onChange={inventoryTypeDropdown.handleChange}
                        placeholder="Select inventory type"
                        searchable={false}
                        clearable={false}
                        variant="default"
                        size="md"
                        className="w-full"
                        showCheckmark={false}
                      />
                    </div>
                    
                    {formData.inventoryType === 'marketplace' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Stock Quantity
                          </label>
                          <input
                            type="number"
                            value={formData.stockQuantity}
                            onChange={(e) => setFormData(prev => ({...prev, stockQuantity: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="0"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Stock Level
                          </label>
                          <input
                            type="number"
                            value={formData.minStockLevel}
                            onChange={(e) => setFormData(prev => ({...prev, minStockLevel: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="0"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Product Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Product Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-800">Available</span>
                        <p className="text-xs text-gray-500">Make this product available for purchase</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, isAvailable: !prev.isAvailable}))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          formData.isAvailable ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            formData.isAvailable ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-800">Featured</span>
                        <p className="text-xs text-gray-500">Show this product as featured</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, featured: !prev.featured}))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          formData.featured ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            formData.featured ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-800">Organic</span>
                        <p className="text-xs text-gray-500">Mark as organic product</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, isOrganic: !prev.isOrganic}))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          formData.isOrganic ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            formData.isOrganic ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
