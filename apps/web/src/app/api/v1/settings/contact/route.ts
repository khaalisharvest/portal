import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: admin-only
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/contact', requireAuth: true });

export const PATCH = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/contact', requireAuth: true, requireRole: ['super_admin'] });
