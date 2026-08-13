import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

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

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    const res = NextResponse.json({ message: 'Token refreshed' });

    // Re-mint auth_token to extend its lifetime alongside the backend token
    if (newAccessToken) {
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          // Decode the new access token to get user info, then re-mint auth_token
          const decoded = jwt.decode(newAccessToken) as any;
          if (decoded?.sub && decoded?.role) {
            const newAuthToken = jwt.sign(
              { userId: decoded.sub, role: decoded.role, type: 'access' },
              jwtSecret,
              { expiresIn: '7d' }
            );
            res.cookies.set('auth_token', newAuthToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
          }
        }
      } catch { /* if re-mint fails, existing auth_token remains */ }
      res.cookies.set('backend_token', newAccessToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
    }
    if (newRefreshToken) {
      res.cookies.set('refresh_token', newRefreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });
    }

    return res;
  } catch {
    return NextResponse.json({ message: 'Refresh error' }, { status: 500 });
  }
}
