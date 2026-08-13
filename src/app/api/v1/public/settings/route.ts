import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/public/settings' });

export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/public/settings/delivery/calculate' });
