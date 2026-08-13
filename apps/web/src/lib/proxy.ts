/**
 * Shared proxy helper for all Next.js API route handlers.
 *
 * Usage:
 *   export const GET  = (req) => proxy(req, { path: '/api/v1/products', passQuery: true });
 *   export const POST = (req) => proxy(req, { path: '/api/v1/products', requireAuth: true });
 *
 * Rules:
 *  - requireAuth: true  → returns 401 if neither Authorization header nor backend_token cookie present
 *  - requireAuth: false → passes token if present (header or cookie), skips if absent
 *  - Auth priority: Authorization header > backend_token HttpOnly cookie
 *  - All backend errors propagate their real HTTP status code (no silent 500 wrapping)
 *  - Empty bodies (204 or 200/201 with no content) are handled gracefully
 *  - Multipart file uploads are forwarded as-is (FormData, no Content-Type override)
 *  - Backend connectivity failures return 503
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export interface ProxyOptions {
  /** Backend path starting with /api/v1/... */
  path: string;
  /** HTTP method — defaults to the incoming request's method */
  method?: string;
  /** Forward the incoming request's query string to the backend */
  passQuery?: boolean;
  /** Require auth token. Returns 401 if neither header nor cookie present. */
  requireAuth?: boolean;
  /** Restrict to specific roles. Reads the auth_token cookie and returns 403 if role not included. */
  requireRole?: string[];
}

export async function proxy(
  request: NextRequest,
  options: ProxyOptions,
  routeParams?: Record<string, string>,
): Promise<NextResponse> {
  const { path, method = request.method.toUpperCase(), passQuery = false, requireAuth = false } = options;

  // --- Auth: header takes priority, cookie is secure fallback ---
  const authHeader = request.headers.get('Authorization');
  const cookieToken = request.cookies.get('backend_token')?.value;
  const resolvedAuth = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null);

  if (requireAuth && !resolvedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Role check: verify role from auth_token cookie ---
  if (options.requireRole) {
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      const { jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(authToken, secret);
      const role = payload.role as string;
      if (!options.requireRole.includes(role)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    // requireRole implies requireAuth — ensure we have a backend token too
    if (!resolvedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // --- URL ---
  let url = `${BACKEND_URL}${path}`;
  if (passQuery) {
    const qs = new URL(request.url).searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // --- Headers ---
  const headers: Record<string, string> = {};
  if (resolvedAuth) headers['Authorization'] = resolvedAuth;

  // --- Body ---
  let body: BodyInit | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const ct = request.headers.get('Content-Type') || '';
    if (ct.includes('multipart/form-data')) {
      body = (await request.formData()) as unknown as FormData;
      // Do NOT set Content-Type — fetch sets it with the correct boundary
    } else {
      headers['Content-Type'] = 'application/json';
      try {
        const text = await request.text();
        // Empty body is valid for toggle-style POSTs — forward as empty object
        body = text.trim() ? text : '{}';
      } catch {
        body = '{}';
      }
    }
  } else {
    headers['Content-Type'] = 'application/json';
  }

  // --- Fetch ---
  let response: Response;
  try {
    response = await fetch(url, { method, headers, body });
  } catch (err) {
    console.error('[proxy] backend connectivity error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 },
    );
  }

  // --- Parse body safely ---
  const text = await response.text().catch(() => '');
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  // --- Error responses: propagate real status + message ---
  if (!response.ok) {
    const d = data as Record<string, unknown> | null;
    const msg =
      (Array.isArray(d?.message) ? d.message[0] : d?.message) ||
      d?.error ||
      `Request failed (${response.status})`;
    return NextResponse.json({ error: msg, message: msg }, { status: response.status });
  }

  // --- Empty success (204 or no body) ---
  if (!text) return new NextResponse(null, { status: response.status });

  return NextResponse.json(data, { status: response.status });
}
