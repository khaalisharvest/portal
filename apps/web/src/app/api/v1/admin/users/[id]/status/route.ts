import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/admin/users/${params.id}/status`, requireAuth: true });
