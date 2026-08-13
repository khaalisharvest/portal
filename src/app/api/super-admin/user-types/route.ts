import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/super-admin/user-types', requireAuth: true });

export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/super-admin/user-types', requireAuth: true });
