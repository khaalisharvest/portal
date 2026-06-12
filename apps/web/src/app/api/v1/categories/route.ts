import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/categories' });

// Protected: create category (super_admin, staff)
export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/categories', requireAuth: true, requireRole: ['super_admin', 'staff'] });
