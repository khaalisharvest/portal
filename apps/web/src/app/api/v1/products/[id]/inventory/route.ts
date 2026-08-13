import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/products/${params.id}/inventory`, requireAuth: true, requireRole: ['super_admin', 'staff'] });

// Protected: update inventory (super_admin, staff)
export const POST = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/products/${params.id}/inventory`, requireAuth: true, requireRole: ['super_admin', 'staff'] });
