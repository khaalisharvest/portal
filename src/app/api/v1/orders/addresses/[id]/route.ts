import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: update / delete user address
export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/orders/addresses/${params.id}`, requireAuth: true });

export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/orders/addresses/${params.id}`, requireAuth: true });
