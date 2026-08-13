import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

// Protected: cancel order
export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/orders/${params.id}/cancel`, requireAuth: true });
