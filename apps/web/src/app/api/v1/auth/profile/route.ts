import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const PATCH = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/auth/profile', requireAuth: true });
