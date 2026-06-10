import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/admin/staff/${params.id}/activity`, passQuery: true, requireAuth: true });
