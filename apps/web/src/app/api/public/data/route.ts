import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from '@/config/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const type = searchParams.get('type');

    // Build query string
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (featured) queryParams.append('featured', featured);
    if (search) queryParams.append('search', search);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (type) queryParams.append('type', type);

    const queryString = queryParams.toString();
    const url = `${BACKEND_URL}/api/v1/products/public${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch public data' },
      { status: 500 }
    );
  }
}
