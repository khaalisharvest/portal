// All requests go through Next.js BFF routes — auth handled via HttpOnly cookie
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
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.data || data;
  },

  async create(category: CreateCategoryDto): Promise<Category> {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to delete category');
    }
  },
};
