/**
 * Shared proxy helper for all Next.js API route handlers.
 *
 * Usage:
 *   export const GET  = (req) => proxy(req, { path: '/api/v1/products', passQuery: true });
 *   export const POST = (req) => proxy(req, { path: '/api/v1/products', requireAuth: true });
 *
 * Rules:
 *  - requireAuth: true  → returns 401 immediately if Authorization header is missing
 *  - requireAuth: false → passes the header if present, skips it if absent (public/optional-auth routes)
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
  /** Require Authorization header. Returns 401 immediately if absent. */
  requireAuth?: boolean;
}

export async function proxy(
  request: NextRequest,
  options: ProxyOptions,
  routeParams?: Record<string, string>,
): Promise<NextResponse> {
  const { path, method = request.method.toUpperCase(), passQuery = false, requireAuth = false } = options;

  // --- Auth ---
  const authHeader = request.headers.get('Authorization');
  if (requireAuth && !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- URL ---
  let url = `${BACKEND_URL}${path}`;
  if (passQuery) {
    const qs = new URL(request.url).searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // --- Headers ---
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;

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
        body = JSON.stringify(await request.json());
      } catch {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Backend unreachable' },
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
    return NextResponse.json({ error: msg }, { status: response.status });
  }

  // --- Empty success (204 or no body) ---
  if (!text) return new NextResponse(null, { status: response.status });

  return NextResponse.json(data, { status: response.status });
}
