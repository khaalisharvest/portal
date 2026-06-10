import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: staff management (super_admin)
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/admin/staff', requireAuth: true });

export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/admin/staff', requireAuth: true });
