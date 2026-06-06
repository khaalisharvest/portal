import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const formData = await request.formData();
  const response = await fetch(`${BACKEND_URL}/api/v1/upload/image`, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData as any,
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
