import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  const productId = new URL(request.url).searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  return proxy(request, { path: `/api/v1/products/${productId}/reviews` });
}

export async function POST(request: NextRequest) {
  const productId = new URL(request.url).searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  return proxy(request, { path: `/api/v1/products/${productId}/reviews`, requireAuth: true });
}
