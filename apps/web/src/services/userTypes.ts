import { API_BASE_URL } from '@/config/env';

export interface UserType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions?: {
    canSellProducts: boolean;
    canBuyProducts: boolean;
    canManageOrders: boolean;
    canAccessAdmin: boolean;
    canManageUsers: boolean;
    canManageCategories: boolean;
    canManageProducts: boolean;
    canViewAnalytics: boolean;
    canManageSettings: boolean;
  };
  features?: {
    hasDashboard: boolean;
    hasProfile: boolean;
    hasInventory: boolean;
    hasOrders: boolean;
    hasAnalytics: boolean;
    hasNotifications: boolean;
  };
  onboardingSteps?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  isActive: boolean;
  sortOrder: number;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserTypeDto {
  name: string;
  displayName: string;
  description?: string;
  permissions?: {
    canSellProducts: boolean;
    canBuyProducts: boolean;
    canManageOrders: boolean;
    canAccessAdmin: boolean;
    canManageUsers: boolean;
    canManageCategories: boolean;
    canManageProducts: boolean;
    canViewAnalytics: boolean;
    canManageSettings: boolean;
  };
  features?: {
    hasDashboard: boolean;
    hasProfile: boolean;
    hasInventory: boolean;
    hasOrders: boolean;
    hasAnalytics: boolean;
    hasNotifications: boolean;
  };
  onboardingSteps?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  isActive?: boolean;
  sortOrder?: number;
  icon?: string;
  color?: string;
}

export const userTypesApi = {
  async getAll(): Promise<UserType[]> {
    const response = await fetch(`${API_BASE_URL}/super-admin/user-types`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user types');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async create(userType: CreateUserTypeDto): Promise<UserType> {
    const response = await fetch(`${API_BASE_URL}/super-admin/user-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
      },
      body: JSON.stringify(userType),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user type');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async update(id: string, userType: Partial<CreateUserTypeDto>): Promise<UserType> {
    const response = await fetch(`${API_BASE_URL}/super-admin/user-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
      },
      body: JSON.stringify(userType),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user type');
    }
    
    const data = await response.json();
    return data.data || data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/super-admin/user-types/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user type');
    }
  },
};
