import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const frontendToken = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(frontendToken, JWT_SECRET) as any;
      
      // Get the backend access token from the request headers
      const backendToken = request.headers.get('x-backend-token');
      if (!backendToken) {
        return NextResponse.json(
          { message: 'Backend token not provided' },
          { status: 401 }
        );
      }
      
      const backendUrl = BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/v1/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${backendToken}`,
        },
      });

      if (response.ok) {
        const backendResponse = await response.json();
        // Backend wraps response in { success: true, data: userData }
        const userData = backendResponse.data || backendResponse;
        return NextResponse.json(userData);
      } else {
        return NextResponse.json(
          { message: 'Failed to fetch user data' },
          { status: response.status }
        );
      }
    } catch (jwtError) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
