import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: only super_admin should read/write payment credentials
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/payment', requireAuth: true, requireRole: ['super_admin'] });

export const PATCH = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/payment', requireAuth: true, requireRole: ['super_admin'] });
