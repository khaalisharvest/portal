// Use relative URLs to go through Next.js API routes
const API_BASE = '/api/v1';

export interface Supplier {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  certifications?: string[];
  specializations?: string[];
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierDto {
  name: string;
  displayName: string;
  description?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  certifications?: string[];
  specializations?: string[];
  isActive?: boolean;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  metadata?: Record<string, any>;
}

export const suppliersApi = {
  async getAll(): Promise<Supplier[]> {
    const response = await fetch(`${API_BASE}/suppliers`, {
      headers: {
        ...(typeof window !== 'undefined' && localStorage.getItem('backend_token') && { 'Authorization': `Bearer ${localStorage.getItem('backend_token')}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch suppliers');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async create(supplier: CreateSupplierDto): Promise<Supplier> {
    const response = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && localStorage.getItem('backend_token') && { 'Authorization': `Bearer ${localStorage.getItem('backend_token')}` }),
      },
      body: JSON.stringify(supplier),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create supplier');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async update(id: string, supplier: Partial<CreateSupplierDto>): Promise<Supplier> {
    const response = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && localStorage.getItem('backend_token') && { 'Authorization': `Bearer ${localStorage.getItem('backend_token')}` }),
      },
      body: JSON.stringify(supplier),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update supplier');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'DELETE',
      headers: {
        ...(typeof window !== 'undefined' && localStorage.getItem('backend_token') && { 'Authorization': `Bearer ${localStorage.getItem('backend_token')}` }),
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete supplier');
    }
  },
};

