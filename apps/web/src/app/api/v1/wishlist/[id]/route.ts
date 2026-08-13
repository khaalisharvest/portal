import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// GET → check if product is in the user's wishlist
export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/wishlist/${params.id}/check`, requireAuth: true });

// POST → toggle (add or remove)
export const POST = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/wishlist/${params.id}`, requireAuth: true });
