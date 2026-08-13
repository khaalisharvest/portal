import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/product-types', passQuery: true });

// Protected: create product type (super_admin, staff)
export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/product-types', requireAuth: true, requireRole: ['super_admin', 'staff'] });
