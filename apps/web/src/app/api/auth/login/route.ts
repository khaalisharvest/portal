import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env';
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
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { message: 'Phone and password are required' },
        { status: 400 }
      );
    }

    const backendUrl = BACKEND_URL;
    
    const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, password }),
    });

    if (response.ok) {
      const backendData = await response.json();
      
      // Backend returns { success: true, data: { user, accessToken, refreshToken } }
      const user = backendData.data?.user;
      const accessToken = backendData.data?.accessToken;
      
      
      // Check if user exists in response
      if (!user) {
        return NextResponse.json(
          { message: 'Invalid response from backend' },
          { status: 500 }
        );
      }
      
      // Generate our own JWT token for frontend use
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          phone: user.phone 
        },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        user,
        token,
        backendToken: accessToken, // Store backend token for profile requests
      });
    } else {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || 'Invalid credentials' },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
