// Use relative URLs to go through Next.js API routes
const API_BASE = '/api/v1';

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  productTypes?: any[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
  active?: boolean;
  sortOrder?: number;
}

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : '';
    
    const response = await fetch(`${API_BASE}/categories`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async create(category: CreateCategoryDto): Promise<Category> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : '';
    
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(category),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create category');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async update(id: string, category: Partial<CreateCategoryDto>): Promise<Category> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : '';
    
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(category),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update category');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async delete(id: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : '';
    
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }
  },
};
