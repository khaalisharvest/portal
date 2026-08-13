import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/super-admin/user-types/${params.id}`, requireAuth: true, requireRole: ['super_admin'] });

export const PUT = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/super-admin/user-types/${params.id}`, requireAuth: true, requireRole: ['super_admin'] });

export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/super-admin/user-types/${params.id}`, requireAuth: true, requireRole: ['super_admin'] });
