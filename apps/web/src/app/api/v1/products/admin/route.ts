import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: admin product list — includes unavailable/draft products
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/products/admin', passQuery: true, requireAuth: true, requireRole: ['super_admin', 'staff'] });
