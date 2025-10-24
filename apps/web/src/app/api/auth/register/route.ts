import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

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
          JWT_SECRET,
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
      // Fallback to mock registration if backend is not available
      
      // Simulate successful registration
      const newUser = {
        id: Date.now().toString(),
        name,
        phone,
        email: email || null,
        role,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          role: newUser.role,
          phone: newUser.phone 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        user: newUser,
        token,
        message: 'Account created successfully'
      });
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
