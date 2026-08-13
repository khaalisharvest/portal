import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: list user's orders
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/orders', passQuery: true, requireAuth: true });

// Public/guest: create order (backend accepts both guest and authenticated)
export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/orders' });
