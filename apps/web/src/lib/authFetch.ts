let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise(resolve => {
      refreshQueue.push(() => resolve(true));
    });
  }

  isRefreshing = true;
  try {
    const storedRefreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('refresh_token')
      : null;

    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }
      refreshQueue.forEach(cb => cb());
      refreshQueue = [];
      return true;
    }

    // Refresh failed — clear session
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;

  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      // Retry with new token
      const newToken = typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;
      const retryHeaders = new Headers(init?.headers);
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return fetch(input, { ...init, headers: retryHeaders });
    }
    // Could not refresh — return the original 401 response
  }

  return response;
}
