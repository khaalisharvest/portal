import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, string>));
    const refreshToken =
      request.cookies.get('refresh_token')?.value || body.refreshToken;

    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Refresh failed' }, { status: 401 });
    }

    const data = await response.json();
    const newAccessToken = data.data?.accessToken || data.accessToken;
    const newRefreshToken = data.data?.refreshToken || data.refreshToken;

    const res = NextResponse.json({ backendToken: newAccessToken });

    if (newRefreshToken) {
      res.cookies.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return res;
  } catch {
    return NextResponse.json({ message: 'Refresh error' }, { status: 500 });
  }
}
