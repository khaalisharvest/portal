// API service for fetching dynamic data
// Use relative URLs to go through Next.js API routes
const API_BASE = '/api/v1';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  seller: {
    id: string;
    businessName: string;
  };
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  featured: boolean;
  unit: string;
  tags?: string[];
  createdAt: string;
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

  // Featured products
  async getFeaturedProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/products/featured`);
    if (!response.ok) {
      throw new Error('Failed to fetch featured products');
    }
    return response.json();
  },
};
