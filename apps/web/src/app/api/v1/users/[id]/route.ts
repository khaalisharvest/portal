import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const response = await fetch(`${BACKEND_URL}/api/v1/users/${params.id}`, {
    headers: { Authorization: authHeader },
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const response = await fetch(`${BACKEND_URL}/api/v1/users/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
