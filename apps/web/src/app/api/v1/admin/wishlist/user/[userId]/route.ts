import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest, { params }: { params: { userId: string } }) =>
  proxy(req, { path: `/api/v1/wishlist/admin/user/${params.userId}`, requireAuth: true, requireRole: ['super_admin', 'staff'] });
