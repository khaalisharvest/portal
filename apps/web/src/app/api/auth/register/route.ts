import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';
import jwt from 'jsonwebtoken';

// Get JWT_SECRET from environment - validated at runtime
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, password, role } = await request.json();

    if (!name || !phone || !password || !role) {
      return NextResponse.json(
        { message: 'Name, phone, password, and role are required' },
        { status: 400 }
      );
    }

    // Only allow customer registration - other roles are admin-managed
    if (role !== 'customer') {
      return NextResponse.json(
        { message: 'Only customers can register. Other roles are managed by admin.' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual backend API call
    const backendUrl = BACKEND_URL;
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, email, password, role }),
      });

      if (response.ok) {
        const backendResponse = await response.json();
        // Backend returns { success, data: { user, accessToken, refreshToken } } via ResponseInterceptor
        const { user: registeredUser, accessToken, refreshToken } = backendResponse.data || backendResponse;

        // Generate a frontend session token
        const token = jwt.sign(
          {
            userId: registeredUser.id,
            role: registeredUser.role,
            phone: registeredUser.phone,
          },
          getJwtSecret(),
          { expiresIn: '7d' }
        );

        const res = NextResponse.json({
          user: registeredUser,
          token,
          message: 'Account created successfully',
        });
        const cookieOpts = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };
        res.cookies.set('auth_token', token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
        if (accessToken) {
          res.cookies.set('backend_token', accessToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
        }
        if (refreshToken) {
          res.cookies.set('refresh_token', refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });
        }
        return res;
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { message: errorData.message || 'Registration failed' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { message: 'Registration service is currently unavailable. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
