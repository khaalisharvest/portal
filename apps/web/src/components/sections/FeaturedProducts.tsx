'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProductCard from '@/components/ui/ProductCard';
import ProductLoader from '@/components/ui/ProductLoader';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import { useMultiDropdown, dropdownUtils } from '@/hooks/useDropdown';
import { API_URL } from '@/config/env';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  productTypeId: string;
  specifications: {
    quality: string;
    variety: string;
    season: string;
    origin: string;
  };
  nutritionInfo: {
    calories: string;
    fiber: string;
    sugar: string;
    minerals: string[];
  };
  isFresh: boolean;
  isOrganic: boolean;
  isAvailable: boolean;
  unit: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  
  // Use dropdown hooks
  const categoryDropdown = useMultiDropdown([], (selectedCategories) => {
    // Categories changed
  });
  
  const typeDropdown = useMultiDropdown([], (selectedTypes) => {
    // Types changed
  });

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
    fetchProductTypes();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [categoryDropdown.value, typeDropdown.value, allProducts]);


  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      
      if (data.success && data.data?.products) {
        // Get all available products
        let products = data.data.products.filter((product: Product) => product.isAvailable);
        
        // Process all products with default values
        const processedProducts = products.map((product: Product) => ({
          ...product,
          rating: 4.5, // Default rating for display
          reviewCount: Math.floor(Math.random() * 50) + 10, // Random review count
          unit: 'kg' // Default unit
        }));
        
        setAllProducts(processedProducts);
      }
    } catch (error) {
      // Error fetching featured products
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (data.success && data.data?.categories) {
        setCategories(data.data.categories);
      } else if (data.data && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      // Error fetching categories
    }
  };

  const fetchProductTypes = async () => {
    // Create product type filters based on product properties
    setProductTypes([
      { id: 'fresh', name: 'Fresh', icon: '🍎' },
      { id: 'organic', name: 'Organic', icon: 'logo' },
      { id: 'premium', name: 'Premium', icon: '⭐' }
    ]);
  };

  const filterProducts = () => {
    let filtered = [...allProducts];
    const selectedCategories = Array.isArray(categoryDropdown.value) ? categoryDropdown.value : [];
    const selectedTypes = Array.isArray(typeDropdown.value) ? typeDropdown.value : [];
    
    // Filter by categories (multi-select)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.categoryId));
    }
    
    // Filter by product types (multi-select)
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(product => {
        return selectedTypes.some(type => {
          if (type === 'fresh') return product.isFresh;
          if (type === 'organic') return product.isOrganic;
          if (type === 'premium') return product.specifications?.quality === 'Premium' || product.specifications?.quality === 'premium';
          return false;
        });
      });
    }
    
    // Sort: featured products first, then others
    const sortedProducts = filtered.sort((a: Product, b: Product) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
    
    // Show up to 8 products
    const displayProducts = sortedProducts.slice(0, 8);
    setFeaturedProducts(displayProducts);
  };

  // Convert data to dropdown options using utility
  const categoryOptions: DropdownOption[] = dropdownUtils.toOptions(categories, {
    description: (category) => category.description,
    icon: () => 'folder'
  });

  const typeOptions: DropdownOption[] = dropdownUtils.toOptions(productTypes, {
    icon: (type) => type.icon || 'tag'
  });

  const clearAllFilters = () => {
    categoryDropdown.clear();
    typeDropdown.clear();
  };
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fresh Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our selection of the freshest and highest quality 
            products from trusted local farms and suppliers.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Category Multi-Select Dropdown */}
              <div className="flex-1">
                <Dropdown
                  options={categoryOptions}
                  value={categoryDropdown.value}
                  onChange={categoryDropdown.handleChange}
                  placeholder="Select Categories"
                  label="Categories"
                  multiple={true}
                  clearable={true}
                  searchable={true}
                  variant="outline"
                  size="md"
                  className="w-full"
                />
              </div>

              {/* Product Type Multi-Select Dropdown */}
              <div className="flex-1">
                <Dropdown
                  options={typeOptions}
                  value={typeDropdown.value}
                  onChange={typeDropdown.handleChange}
                  placeholder="Select Types"
                  label="Types"
                  multiple={true}
                  clearable={true}
                  variant="outline"
                  size="md"
                  className="w-full"
                />
              </div>

              {/* Clear Filters Button */}
              <div className="lg:flex-shrink-0 flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{featuredProducts.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{allProducts.length}</span> products
                </p>
                {(Array.isArray(categoryDropdown.value) && categoryDropdown.value.length > 0) || 
                 (Array.isArray(typeDropdown.value) && typeDropdown.value.length > 0) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Active filters:</span>
                    {Array.isArray(categoryDropdown.value) && categoryDropdown.value.map(categoryId => (
                      <span key={categoryId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {categories.find(c => c.id === categoryId)?.name || 'Category'}
                      </span>
                    ))}
                    {Array.isArray(typeDropdown.value) && typeDropdown.value.map(typeId => (
                      <span key={typeId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {productTypes.find(t => t.id === typeId)?.name || 'Type'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <ProductLoader size="lg" />
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Image
                src="/images/logo.png"
                alt="Khaalis Harvest Logo"
                fill
                className="object-contain opacity-60"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products available yet</h3>
            <p className="text-gray-600 mb-4">Our admin team is adding fresh organic products to the platform.</p>
            <p className="text-sm text-gray-500">Check back soon for the best selection of organic products!</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
            <a
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              View All Products
            </a>
        </motion.div>
      </div>
    </section>
  );
}
