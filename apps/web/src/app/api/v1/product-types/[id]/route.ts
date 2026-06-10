import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/product-types/${params.id}` });

// Protected: update / delete product type (super_admin)
export const PUT = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/product-types/${params.id}`, requireAuth: true });

export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/product-types/${params.id}`, requireAuth: true });
