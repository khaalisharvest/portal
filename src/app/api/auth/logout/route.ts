import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  const clear = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
  res.cookies.set('auth_token', '', clear);
  res.cookies.set('backend_token', '', clear);
  res.cookies.set('refresh_token', '', clear);
  return res;
}
