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

export async function GET(request: NextRequest) {
  try {
    const frontendToken = request.cookies.get('auth_token')?.value;
    if (!frontendToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    try {
      jwt.verify(frontendToken, getJwtSecret());
    } catch {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const backendToken = request.cookies.get('backend_token')?.value;
    if (!backendToken) {
      return NextResponse.json({ message: 'Backend token not provided' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/profile`, {
      headers: { 'Authorization': `Bearer ${backendToken}` },
    });

    if (response.ok) {
      const backendResponse = await response.json();
      const userData = backendResponse.data || backendResponse;
      return NextResponse.json(userData);
    }
    return NextResponse.json({ message: 'Failed to fetch user data' }, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
