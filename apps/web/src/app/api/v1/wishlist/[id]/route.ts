import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const response = await fetch(`${BACKEND_URL}/api/v1/wishlist/${params.id}`, {
    method: 'POST',
    headers: { Authorization: authHeader },
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ added: false });
  const response = await fetch(`${BACKEND_URL}/api/v1/wishlist/${params.id}/check`, {
    headers: { Authorization: authHeader },
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
