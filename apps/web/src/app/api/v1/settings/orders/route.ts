import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: super_admin-only
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/orders', requireAuth: true, requireRole: ['super_admin'] });

export const PATCH = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/orders', requireAuth: true, requireRole: ['super_admin'] });
