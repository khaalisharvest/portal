// API service for fetching dynamic data
// Use relative URLs to go through Next.js API routes
const API_BASE = '/api/v1';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  category?: { id: string; name: string };
  productType?: { id: string; displayName: string; color?: string };
  isOrganic: boolean;
  isAvailable: boolean;
  featured: boolean;
  unit: string;
  tags?: string[];
  hasVariants?: boolean;
  variantName?: string;
  variants?: Array<{ name: string; price: number; originalPrice?: number; isAvailable?: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

// API functions
export const api = {
  // Products
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    return data.products || data;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/products/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

};
