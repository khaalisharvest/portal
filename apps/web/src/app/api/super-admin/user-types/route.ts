import { NextRequest, NextResponse } from 'next/server';

// Mock data for user types
const mockUserTypes = [
  {
    id: '1',
    name: 'customer',
    displayName: 'Customer',
    description: 'Regular customers who buy organic products',
    permissions: {
      canBuyProducts: true,
      canAccessAdmin: false,
      canManageUsers: false,
      canManageCategories: false,
      canManageProducts: false,
      canViewAnalytics: false,
      canManageSettings: false,
    },
    features: {
      hasDashboard: true,
      hasProfile: true,
      hasProductCatalog: true,
      hasOrders: true,
      hasAnalytics: false,
      hasNotifications: true,
    },
    isActive: true,
    sortOrder: 1,
    icon: '🛒',
    color: '#3B82F6',
  },
  {
    id: '2',
    name: 'admin',
    displayName: 'Khaalis Harvest Admin',
    description: 'Administrators who manage the organic platform',
    permissions: {
      canBuyProducts: true,
      canAccessAdmin: true,
      canManageUsers: true,
      canManageCategories: true,
      canManageProducts: true,
      canViewAnalytics: true,
      canManageSettings: true,
    },
    features: {
      hasDashboard: true,
      hasProfile: true,
      hasProductCatalog: true,
      hasOrders: true,
      hasAnalytics: true,
      hasNotifications: true,
    },
    isActive: true,
    sortOrder: 2,
    icon: '🍎',
    color: '#F97316',
  },
];

export async function GET() {
  try {
    // TODO: Replace with actual backend API call
    return NextResponse.json(mockUserTypes);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userType = await request.json();
    
    // TODO: Replace with actual backend API call
    const newUserType = {
      id: Date.now().toString(),
      ...userType,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newUserType, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
