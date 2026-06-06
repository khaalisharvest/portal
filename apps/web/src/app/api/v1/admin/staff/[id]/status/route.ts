import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = request.headers.get('Authorization');
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await fetch(`${BACKEND_URL}/api/v1/admin/staff/${params.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(await request.json()),
  });
  if (!r.ok) return NextResponse.json({ error: 'Failed' }, { status: r.status });
  return NextResponse.json(await r.json());
}
