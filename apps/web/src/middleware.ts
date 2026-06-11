import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_ROLES = ['super_admin', 'staff'];
const SUPER_ADMIN_ONLY_PATHS = ['/admin/staff', '/admin/settings', '/admin/customers'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string | undefined;

    if (!role || !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/orders', request.url));
    }

    // Super-admin-only paths: staff, settings, customers
    const isSuperAdminOnly = SUPER_ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p));
    if (isSuperAdminOnly && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return res;
  }
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
