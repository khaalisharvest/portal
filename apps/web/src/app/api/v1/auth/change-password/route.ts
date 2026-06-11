import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/auth/change-password', requireAuth: true });
