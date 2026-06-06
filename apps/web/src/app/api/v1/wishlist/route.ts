import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const response = await fetch(`${BACKEND_URL}/api/v1/wishlist`, {
    headers: { Authorization: authHeader },
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
