import { NextRequest, NextResponse } from 'next/server';

// Mock data for fruit types
const mockProductTypes = [
  {
    id: '1',
    name: 'fresh_fruits',
    displayName: 'Fresh Fruits',
    description: 'Fresh fruit products including mangoes, oranges, apples',
    specifications: {
      fields: [
        {
          name: 'weight',
          type: 'number',
          required: true,
          unit: 'kg',
        },
        {
          name: 'quality_grade',
          type: 'select',
          required: true,
          options: ['Grade A', 'Grade B', 'Grade C'],
        },
        {
          name: 'harvest_date',
          type: 'date',
          required: true,
        },
      ],
    },
    pricing: {
      hasWeight: true,
      hasVolume: false,
      hasQuantity: true,
      hasSize: false,
      units: ['kg', 'g', 'lb'],
    },
    requirements: {
      needsImages: true,
      needsCertification: true,
      needsLocation: true,
      needsExpiryDate: true,
      needsBatchNumber: false,
      minImages: 1,
      maxImages: 5,
    },
    allowedUserTypes: ['admin'],
    isActive: true,
    sortOrder: 1,
    icon: '🍎',
    color: '#F97316',
  },
  {
    id: '2',
    name: 'citrus_fruits',
    displayName: 'Citrus Fruits',
    description: 'Fresh citrus fruits including oranges, lemons, grapefruits',
    specifications: {
      fields: [
        {
          name: 'weight',
          type: 'number',
          required: true,
          unit: 'kg',
        },
        {
          name: 'variety',
          type: 'select',
          required: true,
          options: ['Kinnow', 'Mousambi', 'Grapefruit', 'Lemon'],
        },
        {
          name: 'size',
          type: 'select',
          required: true,
          options: ['Small', 'Medium', 'Large', 'Extra Large'],
        },
      ],
    },
    pricing: {
      hasWeight: true,
      hasVolume: false,
      hasQuantity: true,
      hasSize: true,
      units: ['kg', 'g', 'lb', 'dozen'],
    },
    requirements: {
      needsImages: true,
      needsCertification: true,
      needsLocation: true,
      needsExpiryDate: true,
      needsBatchNumber: true,
      minImages: 1,
      maxImages: 3,
    },
    allowedUserTypes: ['admin'],
    isActive: true,
    sortOrder: 2,
    icon: '🍊',
    color: '#F97316',
  },
  {
    id: '3',
    name: 'tropical_fruits',
    displayName: 'Tropical Fruits',
    description: 'Fresh tropical fruits including mangoes, bananas, pineapples',
    specifications: {
      fields: [
        {
          name: 'ripeness',
          type: 'select',
          required: true,
          options: ['Unripe', 'Semi-ripe', 'Ripe', 'Overripe'],
        },
        {
          name: 'variety',
          type: 'text',
          required: true,
        },
        {
          name: 'origin',
          type: 'text',
          required: true,
        },
        {
          name: 'season',
          type: 'select',
          required: true,
          options: ['Summer', 'Winter', 'Spring', 'Fall'],
        },
      ],
    },
    pricing: {
      hasWeight: true,
      hasVolume: false,
      hasQuantity: true,
      hasSize: true,
      units: ['kg', 'g', 'lb', 'dozen'],
    },
    requirements: {
      needsImages: true,
      needsCertification: true,
      needsLocation: true,
      needsExpiryDate: true,
      needsBatchNumber: false,
      minImages: 2,
      maxImages: 5,
    },
    allowedUserTypes: ['admin'],
    isActive: true,
    sortOrder: 3,
    icon: '🥭',
    color: '#10B981',
  },
];

export async function GET() {
  try {
    // TODO: Replace with actual backend API call
    return NextResponse.json(mockProductTypes);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const productType = await request.json();
    
    // TODO: Replace with actual backend API call
    const newProductType = {
      id: Date.now().toString(),
      ...productType,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newProductType, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
