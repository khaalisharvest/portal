import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: admin contact detail (super_admin)
export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/contacts/${params.id}`, requireAuth: true });

export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/contacts/${params.id}`, requireAuth: true });

export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/contacts/${params.id}`, requireAuth: true });
