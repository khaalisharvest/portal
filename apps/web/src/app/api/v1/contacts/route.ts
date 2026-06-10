import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Public: submit contact form
export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/contacts' });

// Protected: admin list (super_admin)
export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/contacts', passQuery: true, requireAuth: true });
