import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: upload image to Cloudinary (super_admin, staff)
export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/upload/image', requireAuth: true });

// Protected: delete image from Cloudinary by URL (?url=...)
export const DELETE = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/upload/image', requireAuth: true, passQuery: true, requireRole: ['super_admin', 'staff'] });
