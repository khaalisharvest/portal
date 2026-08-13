'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Category } from '@/services/categories';
import { ProductType } from '@/services/productTypes';
import Dropdown from '@/components/ui/Dropdown';
import { useSingleDropdown, dropdownUtils } from '@/hooks/useDropdown';
import CategoryTabs from '@/components/ui/CategoryTabs';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  adminId: string;
  inventoryType: 'marketplace' | 'warehouse';
  isAvailable: boolean;
  unit: string;
  featured: boolean;
  isOrganic: boolean;
  marketplaceInfo?: {
    supplierName?: string;
    supplierContact?: string;
  };
  specifications?: Record<string, any>;
  tags?: string[];
  status?: 'draft' | 'active' | 'archived';
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

const ALL_UNITS = ['kg', 'g', 'lb', 'liter', 'ml', 'piece', 'dozen', 'pack', 'bunch', 'box', 'bag', 'bottle', 'jar', 'plant', 'seedling'];

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  // Files selected but not yet uploaded — uploaded to Cloudinary only on Save
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview: string }>>([]);
  // Controlled URL paste input — clears when form resets
  const [urlInput, setUrlInput] = useState('');
  // Ref for cleaning up blob URLs on unmount
  const pendingFilesRef = useRef(pendingFiles);
  pendingFilesRef.current = pendingFiles;

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
    setFormData(prev => {
      const updated = {...prev, categoryId: value || ''};
      return updated;
    });
    // Clear product type when category changes
    productTypeDropdown.clear();
  });

  const productTypeDropdown = useSingleDropdown('', (value) => {
    const selected = productTypes.find(pt => pt.id === value);
    const nextUnit = selected?.units?.[0] || formData.unit;
    setFormData(prev => ({
      ...prev,
      productTypeId: value || '',
      unit: nextUnit,
    }));
  });

  const unitDropdown = useSingleDropdown('kg', (value) => {
    setFormData(prev => ({...prev, unit: value}));
  });

  const inventoryTypeDropdown = useSingleDropdown('warehouse', (value) => {
    setFormData(prev => ({ ...prev, inventoryType: value as 'marketplace' | 'warehouse' }));
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
    images: [] as string[],
    categoryId: '',
    productTypeId: '',
    inventoryType: 'warehouse' as 'warehouse' | 'marketplace',
    isAvailable: true,
    unit: 'kg',
    featured: false,
    isOrganic: false,
    tags: '',
    supplierName: '',
    supplierContact: '',
    hasVariants: false,
    variantName: '',
    variants: [] as Array<{name: string; price: number; originalPrice?: number; isAvailable?: boolean}>,
  });

  useEffect(() => {
    fetchProducts();
    fetchAllCategoriesAndTypes();
  }, []);

  // Revoke all blob URLs when component unmounts to prevent memory leaks
  useEffect(() => () => {
    pendingFilesRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview));
  }, []);

  const fetchAllCategoriesAndTypes = async () => {
    try {
      // Fetch all categories with their product types in a single API call
      const response = await fetch(`/api/v1/products/categories-with-types`, {
        headers: {
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
      // Error fetching categories
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

      const response = await fetch(`/api/v1/products/admin?${params}`, {
        headers: {
        },
      });

      const data = await response.json();
      setProducts(data.data?.products || data.products || []);
      setTotalPages(data.data?.totalPages || data.totalPages || 1);
      setTotalProducts(data.data?.total || data.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    setIsSaving(true);
    try {
      // Upload any locally-staged files to Cloudinary now (on Save, not on select)
      // Start from saved URLs, strip any nulls/empty that may exist from old data
      let allImages = formData.images.filter((u): u is string => typeof u === 'string' && u.length > 0);
      if (pendingFiles.length > 0) {
        const uploadedUrls: string[] = [];
        try {
          for (const { file } of pendingFiles) {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/v1/products/upload-image', {
              method: 'POST',
              body: fd,
            });
            if (!res.ok) throw new Error('Image upload failed');
            const data = await res.json();
            const imageUrl = data.data?.url || data.url;
            if (!imageUrl || typeof imageUrl !== 'string') throw new Error('Upload returned invalid URL');
            uploadedUrls.push(imageUrl);
          }
        } catch (err) {
          // Delete any images already uploaded in this batch before surfacing the error
          if (uploadedUrls.length) {
            void Promise.allSettled(
              uploadedUrls.map(url =>
                fetch(`/api/v1/products/upload-image?url=${encodeURIComponent(url)}`, {
                  method: 'DELETE',
                })
              )
            );
          }
          throw err;
        }
        allImages = [...allImages, ...uploadedUrls];
      }

      const productData: Record<string, any> = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        images: allImages,
        categoryId: formData.categoryId && formData.categoryId !== '' ? formData.categoryId : undefined,
        productTypeId: formData.productTypeId && formData.productTypeId !== '' ? formData.productTypeId : undefined,
        inventoryType: formData.inventoryType,
        isAvailable: formData.isAvailable,
        unit: formData.unit,
        featured: formData.featured,
        isOrganic: formData.isOrganic,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        specifications: undefined,
        marketplaceInfo: formData.inventoryType === 'marketplace' ? {
          supplierName: formData.supplierName,
          supplierContact: formData.supplierContact,
        } : undefined,
        // Variant data
        hasVariants: formData.hasVariants,
        variantName: formData.hasVariants ? formData.variantName : undefined,
        variants: formData.hasVariants ? formData.variants.filter(v => v.name && v.price > 0) : undefined,
      };

      const url = editingProduct
        ? `/api/v1/products/${editingProduct.id}`
        : `/api/v1/products`;
      const method = editingProduct ? 'PUT' : 'POST';


      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        fetchProducts();
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = Array.isArray(errorData.message) ? errorData.message[0] : (errorData.message || errorData.error || 'Failed to save product');
        toast.error(msg);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred while saving the product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    // Revoke stale blob previews from a previous create/edit session
    pendingFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
    setPendingFiles([]);
    setUrlInput('');

    setEditingProduct(product);

    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
      categoryId: product.categoryId,
      productTypeId: product.productTypeId || '',
      inventoryType: product.inventoryType || 'warehouse',
      isAvailable: product.isAvailable,
      unit: product.unit || 'kg',
      featured: product.featured || false,
      isOrganic: product.isOrganic || false,
      tags: product.tags?.join(', ') || '',
      supplierName: product.marketplaceInfo?.supplierName || '',
      supplierContact: product.marketplaceInfo?.supplierContact || '',
      // Variant fields
      hasVariants: product.hasVariants || false,
      variantName: product.variantName || '',
      variants: (product.variants as any) || [],
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

      const response = await fetch(`/api/v1/products/${pendingDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the product');
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
      images: [],
      categoryId: '',
      productTypeId: '',
      inventoryType: 'warehouse',
      isAvailable: true,
      unit: 'kg',
      featured: false,
      isOrganic: false,
      tags: '',
      supplierName: '',
      supplierContact: '',
      hasVariants: false,
      variantName: '',
      variants: [],
    });

    // Revoke any local blob previews to free memory
    pendingFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
    setPendingFiles([]);
    setUrlInput('');

    categoryDropdown.clear();
    productTypeDropdown.clear();
    unitDropdown.setValue('kg');
    inventoryTypeDropdown.setValue('warehouse');
    setEditingProduct(null);
    setShowForm(false);
  };

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
            onKeyDown={(e) => {
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
        productTypes={productTypes.map(pt => ({ ...pt, name: pt.displayName })) as any}
        selectedCategory={selectedCategory}
        selectedProductType={selectedProductTypeFilter}
        onCategoryChange={(value) => {
          const v = Array.isArray(value) ? value[0] || '' : value;
          setSelectedCategory(v);
          setSelectedProductTypeFilter('');
        }}
        onProductTypeChange={(value) => {
          const v = Array.isArray(value) ? value[0] || '' : value;
          setSelectedProductTypeFilter(v);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedCategory('');
          setSelectedProductTypeFilter('');
          setCurrentPage(1);
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                            disabled={togglingId === product.id}
                            onClick={async () => {
                              setTogglingId(product.id);
                              try {
                                const response = await fetch(`/api/v1/products/${product.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ isAvailable: !product.isAvailable }),
                                });

                                if (response.ok) {
                                  await fetchProducts();
                                } else {
                                  toast.error('Failed to update product availability. Please try again.');
                                  fetchProducts(currentPage, searchTerm, selectedCategory, selectedProductTypeFilter);
                                }
                              } catch (error) {
                                toast.error('Failed to update product availability. Please try again.');
                                // Refresh to show correct state
                                fetchProducts(currentPage, searchTerm, selectedCategory, selectedProductTypeFilter);
                              } finally {
                                setTogglingId(null);
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
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

                {/* Page Numbers — sliding window */}
                {(() => {
                  const delta = 2;
                  const start = Math.max(1, currentPage - delta);
                  const end = Math.min(totalPages, currentPage + delta);
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
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
                  ));
                })()}

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

      {/* Add/Edit Form Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-40" onClick={resetForm} />
          <div className="w-full max-w-2xl bg-white flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} id="product-form" className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
                        options={dropdownUtils.toOptions(productTypes.filter(pt => pt.categoryId === categoryDropdown.value).map(pt => ({ ...pt, name: pt.displayName })))}
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
                        options={
                          (() => {
                            const selectedPT = productTypes.find(pt => pt.id === productTypeDropdown.value);
                            return selectedPT?.units?.length
                              ? selectedPT.units.map((u: string) => ({ value: u, label: u }))
                              : ALL_UNITS.map(u => ({ value: u, label: u }));
                          })()
                        }
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Product Images</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {/* Saved / pasted URLs */}
                      {formData.images.map((url, idx) => (
                        <div key={`saved-${idx}`} className="relative w-20 h-20">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                          >×</button>
                        </div>
                      ))}
                      {/* Locally staged files — shown as preview, uploaded on Save */}
                      {pendingFiles.map(({ preview }, idx) => (
                        <div key={`pending-${idx}`} className="relative w-20 h-20">
                          <img src={preview} alt="" className="w-full h-full object-cover rounded-lg opacity-80" />
                          <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-orange-500 text-white rounded-b-lg py-0.5 leading-tight">
                            on save
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(preview);
                              setPendingFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                          >×</button>
                        </div>
                      ))}
                    </div>
                    {/* Choose file — stored locally, NO upload until Save */}
                    <label className="flex items-center gap-2 cursor-pointer bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-neutral-500">Choose images (JPG, PNG, WebP — max 5MB each)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
                          if (oversized.length) { toast.error(`${oversized.length} file(s) exceed 5MB and were skipped.`); }
                          const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
                          if (valid.length) setPendingFiles(prev => [...prev, ...valid.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Files upload when you click Save. Or paste an image URL below and press Enter.
                    </p>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste image URL and press Enter to add"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const url = urlInput.trim();
                            if (url) {
                              setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
                              setUrlInput('');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Variant Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
                              {/* Option Name */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={variant.name || ''}
                                  onChange={(e) => {
                                    const newVariants = [...formData.variants];
                                    newVariants[index] = { ...newVariants[index], name: e.target.value };
                                    setFormData(prev => ({...prev, variants: newVariants}));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Option name (e.g., Small, Large, Premium)"
                                  required
                                />
                              </div>

                              {/* Price */}
                              <div className="w-24">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.price || ''}
                                  onChange={(e) => {
                                    const newVariants = [...formData.variants];
                                    newVariants[index] = { ...newVariants[index], price: parseFloat(e.target.value) || 0 };
                                    setFormData(prev => ({...prev, variants: newVariants}));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Price"
                                  required
                                />
                              </div>

                              {/* Original Price */}
                              <div className="w-24">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.originalPrice || ''}
                                  onChange={(e) => {
                                    const newVariants = [...formData.variants];
                                    newVariants[index] = { ...newVariants[index], originalPrice: parseFloat(e.target.value) || 0 };
                                    setFormData(prev => ({...prev, variants: newVariants}));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="Original"
                                />
                              </div>

                              {/* Available Toggle */}
                              <div className="w-20 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariants = [...formData.variants];
                                    newVariants[index] = { ...newVariants[index], isAvailable: !newVariants[index].isAvailable };
                                    setFormData(prev => ({...prev, variants: newVariants}));
                                  }}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                                    variant.isAvailable !== false ? 'bg-green-600' : 'bg-gray-300'
                                  }`}
                                  title={variant.isAvailable !== false ? 'Available' : 'Unavailable'}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                                      variant.isAvailable !== false ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* Remove Button */}
                              <div className="w-10 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariants = formData.variants.filter((_, i) => i !== index);
                                    setFormData(prev => ({...prev, variants: newVariants}));
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
                              variants: [...prev.variants, { name: '', price: 0, originalPrice: 0, isAvailable: true }]
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

                {/* Inventory Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
                            Supplier Name
                          </label>
                          <input
                            type="text"
                            value={formData.supplierName}
                            onChange={e => setFormData(prev => ({...prev, supplierName: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter supplier name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Supplier Contact
                          </label>
                          <input
                            type="text"
                            value={formData.supplierContact}
                            onChange={e => setFormData(prev => ({...prev, supplierContact: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter supplier contact"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Product Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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

                  {/* Tags */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter tags, comma separated (e.g., organic, fresh, local)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                  </div>
                </div>

              </form>
            </div>
            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-green-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
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
