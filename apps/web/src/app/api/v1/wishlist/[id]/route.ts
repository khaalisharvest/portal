import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/lib/proxy';

export const POST = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/wishlist/${params.id}`, requireAuth: true });

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ added: false });
  return proxy(request, { path: `/api/v1/wishlist/${params.id}/check` });
}
