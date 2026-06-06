import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const response = await fetch(`${BACKEND_URL}/api/v1/settings/payment`, {
    headers: { 'Content-Type': 'application/json', ...(authHeader && { Authorization: authHeader }) },
  });
  if (!response.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status });
  return NextResponse.json(await response.json());
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const response = await fetch(`${BACKEND_URL}/api/v1/settings/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify(await request.json()),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return NextResponse.json({ error: err.message || 'Failed to update' }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}
