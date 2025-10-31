// Use relative URLs to go through Next.js API routes
const API_BASE = '/api/v1';

export interface ProductType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  categoryId: string;
  specifications?: {
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
      required: boolean;
      placeholder?: string;
      description?: string;
      options?: Array<{ label: string; value: string }>;
      min?: number;
      max?: number;
      step?: number;
      rows?: number;
      accept?: string;
      validation?: {
        pattern?: string;
        message?: string;
      };
      category?: string;
    }>;
  };
  pricing?: {
    primaryMethod: 'weight' | 'volume' | 'quantity' | 'size';
    hasWeight: boolean;
    hasVolume: boolean;
    hasQuantity: boolean;
    hasSize: boolean;
    units: string[];
  };
  requirements?: {
    needsImages: boolean;
    needsCertification: boolean;
    needsLocation: boolean;
    needsExpiryDate: boolean;
    minImages: number;
    maxImages: number;
  };
  allowedUserTypes?: string[];
  isActive: boolean;
  sortOrder: number;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductTypeDto {
  name: string;
  displayName: string;
  description?: string;
  categoryId: string;
  specifications?: {
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
      required: boolean;
      placeholder?: string;
      description?: string;
      options?: Array<{ label: string; value: string }>;
      min?: number;
      max?: number;
      step?: number;
      rows?: number;
      accept?: string;
      validation?: {
        pattern?: string;
        message?: string;
      };
      category?: string;
    }>;
  };
  pricing?: {
    primaryMethod: 'weight' | 'volume' | 'quantity' | 'size';
    hasWeight: boolean;
    hasVolume: boolean;
    hasQuantity: boolean;
    hasSize: boolean;
    units: string[];
  };
  requirements?: {
    needsImages: boolean;
    needsCertification: boolean;
    needsLocation: boolean;
    needsExpiryDate: boolean;
    minImages: number;
    maxImages: number;
  };
  allowedUserTypes?: string[];
  isActive?: boolean;
  sortOrder?: number;
  icon?: string;
  color?: string;
}

export const productTypesApi = {
  async getAll(): Promise<ProductType[]> {
    const response = await fetch(`${API_BASE}/product-types`, {
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('backend_token') : ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch product types');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async create(productType: CreateProductTypeDto): Promise<ProductType> {
    const response = await fetch(`${API_BASE}/product-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('backend_token') : ''}`,
      },
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('backend_token') : ''}`,
      },
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
    const response = await fetch(`${API_BASE}/product-types/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('backend_token') : ''}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product type');
    }
  },
};
