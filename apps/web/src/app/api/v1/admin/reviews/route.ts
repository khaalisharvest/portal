import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/admin/reviews', passQuery: true, requireAuth: true, requireRole: ['super_admin', 'staff'] });
