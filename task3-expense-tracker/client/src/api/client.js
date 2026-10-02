const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export const query = (params = {}) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();

export const apiUrl = (path) => `${BASE}/api${path}`;

export async function api(path, { method = 'GET', body, signal, skipAuthRedirect } = {}) {
  let res;
  try {
    res = await fetch(apiUrl(path), {
      method,
      signal,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Make sure the API is running.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !skipAuthRedirect) onUnauthorized();
  if (!res.ok) {
    const msg = res.status >= 500 && !data.message ? 'Server error — is the database connected?' : data.message;
    throw new ApiError(msg || `Request failed (${res.status})`, res.status, data.errors);
  }
  return data;
}

export const authApi = {
  session: (signal) => api('/auth/session', { signal, skipAuthRedirect: true }),
  login: (body) => api('/auth/login', { method: 'POST', body, skipAuthRedirect: true }),
  register: (body) => api('/auth/register', { method: 'POST', body, skipAuthRedirect: true }),
  logout: () => api('/auth/logout', { method: 'POST', skipAuthRedirect: true }),
  updateProfile: (body) => api('/auth/me', { method: 'PATCH', body }),
  changePassword: (body) => api('/auth/change-password', { method: 'POST', body }),
  deleteAccount: () => api('/auth/me', { method: 'DELETE' }),
};

export const txApi = {
  list: (params, signal) => api(`/transactions?${query(params)}`, { signal }),
  summary: (params, signal) => api(`/transactions/summary?${query(params)}`, { signal }),
  create: (body) => api('/transactions', { method: 'POST', body }),
  update: (id, body) => api(`/transactions/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/transactions/${id}`, { method: 'DELETE' }),
  exportUrl: (params) => apiUrl(`/transactions/export?${query(params)}`),
};

export const metaApi = {
  get: (signal) => api('/meta', { signal }),
};
