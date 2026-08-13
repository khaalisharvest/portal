import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Public: lists available products
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/products', passQuery: true });

// Protected: create product (super_admin, staff)
export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/products', requireAuth: true });
