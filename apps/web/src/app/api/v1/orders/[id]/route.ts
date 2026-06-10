import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: get order by ID
export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/orders/${params.id}`, requireAuth: true });

// Protected: update order
export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/orders/${params.id}`, requireAuth: true });
