import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: only admins should read payment credentials
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/payment', requireAuth: true });

export const PATCH = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/payment', requireAuth: true });
