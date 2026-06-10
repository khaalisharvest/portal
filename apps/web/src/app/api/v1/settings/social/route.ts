import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/social' });

export const PATCH = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/settings/social', requireAuth: true });
