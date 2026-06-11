let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise(resolve => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (res.ok) {
      refreshQueue.forEach(cb => cb(true));
      refreshQueue = [];
      return true;
    }

    refreshQueue.forEach(cb => cb(false));
    refreshQueue = [];
    return false;
  } catch {
    refreshQueue.forEach(cb => cb(false));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, { ...init, credentials: 'include' });

  if (response.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return fetch(input, { ...init, credentials: 'include' });
    }
  }

  return response;
}
