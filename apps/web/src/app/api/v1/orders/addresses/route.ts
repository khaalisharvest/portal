import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: user addresses
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/orders/addresses', requireAuth: true });

export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/orders/addresses', requireAuth: true });
