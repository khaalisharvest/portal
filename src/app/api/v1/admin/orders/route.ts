import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: admin order list (super_admin, staff)
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/admin/orders', passQuery: true, requireAuth: true, requireRole: ['super_admin', 'staff'] });
