// All requests go through Next.js BFF routes — auth handled via HttpOnly cookie
const API_BASE = '/api/v1';

export interface ProductType {
  id: string;
  displayName: string;
  description?: string;
  categoryId: string;
  color?: string;
  units?: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductTypeDto {
  displayName: string;
  categoryId: string;
  description?: string;
  color?: string;
  units?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export const productTypesApi = {
  async getAll(): Promise<ProductType[]> {
    const response = await fetch(`${API_BASE}/product-types`);
    if (!response.ok) throw new Error('Failed to fetch product types');
    const data = await response.json();
    return data.data || data;
  },

  async create(productType: CreateProductTypeDto): Promise<ProductType> {
    const response = await fetch(`${API_BASE}/product-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productType),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product type');
    }
    const data = await response.json();
    return data.data || data;
  },

  async update(id: string, productType: Partial<CreateProductTypeDto>): Promise<ProductType> {
    const response = await fetch(`${API_BASE}/product-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productType),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product type');
    }
    const data = await response.json();
    return data.data || data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/product-types/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to delete product type');
    }
  },
};
