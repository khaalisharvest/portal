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

// Fallback data for when API is not available
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Fresh Goat Meat',
    description: 'Premium quality goat meat, halal certified',
    price: 1200,
    images: ['/images/placeholder.svg'],
    category: { id: '1', name: 'Meat' },
    seller: { id: '1', businessName: 'Fresh Farm Butchery' },
    rating: 4.8,
    reviewCount: 124,
    isAvailable: true,
    featured: true,
    unit: 'kg',
    tags: ['halal', 'fresh', 'premium'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Buffalo Milk',
    description: 'Fresh buffalo milk, delivered daily',
    price: 180,
    images: ['/images/placeholder.svg'],
    category: { id: '2', name: 'Dairy' },
    seller: { id: '2', businessName: 'Milk & More' },
    rating: 4.6,
    reviewCount: 89,
    isAvailable: true,
    featured: true,
    unit: 'liter',
    tags: ['fresh', 'daily', 'buffalo'],
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'Meat', description: 'Fresh meat products', active: true, sortOrder: 1, createdAt: new Date().toISOString() },
  { id: '2', name: 'Dairy', description: 'Milk and dairy products', active: true, sortOrder: 2, createdAt: new Date().toISOString() },
  { id: '3', name: 'Poultry', description: 'Chicken and eggs', active: true, sortOrder: 3, createdAt: new Date().toISOString() },
];

// API functions
export const api = {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.products || data;
    } catch (error) {
      return FALLBACK_PRODUCTS;
    }
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    } catch (error) {
      return FALLBACK_PRODUCTS.find(p => p.id === id) || null;
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE}/products/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    } catch (error) {
      return FALLBACK_CATEGORIES;
    }
  },

  // Featured products
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE}/products/featured`);
      if (!response.ok) throw new Error('Failed to fetch featured products');
      return response.json();
    } catch (error) {
      return FALLBACK_PRODUCTS.filter(p => p.featured);
    }
  },

  // Admin operations
  async post(url: string, data: any) {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create ${url}`);
    return response.json();
  },

  async delete(url: string) {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete ${url}`);
    return response.json();
  },

  async put(url: string, data: any) {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update ${url}`);
    return response.json();
  },
};
