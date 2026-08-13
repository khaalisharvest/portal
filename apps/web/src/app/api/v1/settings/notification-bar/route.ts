import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/notification-bar' });

export const PATCH = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/notification-bar', requireAuth: true, requireRole: ['super_admin'] });
