import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  const r = await fetch(`${BACKEND_URL}/api/v1/admin/staff`, {
    headers: { ...(auth && { Authorization: auth }) },
  });
  if (!r.ok) return NextResponse.json({ error: 'Failed' }, { status: r.status });
  return NextResponse.json(await r.json());
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await fetch(`${BACKEND_URL}/api/v1/admin/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(await request.json()),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json({ error: e.message || 'Failed' }, { status: r.status });
  }
  return NextResponse.json(await r.json());
}
