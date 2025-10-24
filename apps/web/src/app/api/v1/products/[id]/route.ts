import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from '@/config/env';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/products/${params.id}`, {
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
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Get the backend token from headers
    const backendToken = request.headers.get('X-Backend-Token');
    
    const response = await fetch(`${BACKEND_URL}/api/v1/products/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(backendToken && { 'Authorization': `Bearer ${backendToken}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend responded with status: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the backend token from headers
    const backendToken = request.headers.get('X-Backend-Token');
    
    const response = await fetch(`${BACKEND_URL}/api/v1/products/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(backendToken && { 'Authorization': `Bearer ${backendToken}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend responded with status: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
