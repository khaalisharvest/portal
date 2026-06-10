import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: admin user management
export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/users/${params.id}`, requireAuth: true });

export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/users/${params.id}`, requireAuth: true });
