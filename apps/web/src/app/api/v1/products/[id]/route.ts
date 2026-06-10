import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Public: product detail
export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/products/${params.id}` });

// Protected: update product (super_admin, staff)
export const PUT = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/products/${params.id}`, requireAuth: true });

export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/products/${params.id}`, requireAuth: true });

// Protected: delete product (super_admin, staff)
export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/products/${params.id}`, requireAuth: true });
