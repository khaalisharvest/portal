import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/wishlist/${params.id}`, requireAuth: true });

export const POST = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/wishlist/${params.id}`, requireAuth: true });
