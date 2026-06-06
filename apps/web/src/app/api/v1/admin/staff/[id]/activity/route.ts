import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = request.headers.get('Authorization');
  const page = request.nextUrl.searchParams.get('page') || '1';
  const r = await fetch(`${BACKEND_URL}/api/v1/admin/staff/${params.id}/activity?page=${page}`, {
    headers: { ...(auth && { Authorization: auth }) },
  });
  if (!r.ok) return NextResponse.json({ error: 'Failed' }, { status: r.status });
  return NextResponse.json(await r.json());
}
