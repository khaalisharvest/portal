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
        const userData = await response.json();
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: userData.id, 
            role: userData.role,
            phone: userData.phone 
          },
          getJwtSecret(),
          { expiresIn: '7d' }
        );

        return NextResponse.json({
          user: userData,
          token,
          message: 'Account created successfully'
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { message: errorData.message || 'Registration failed' },
          { status: 400 }
        );
      }
    } catch (backendError) {
      console.error('Backend registration error:', backendError);
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
