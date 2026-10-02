const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors = {}, problems = []) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.problems = problems;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export const query = (params = {}) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== false)).toString();

export async function api(path, { method = 'GET', body, signal, skipAuthRedirect } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
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
    throw new ApiError(msg || `Request failed (${res.status})`, res.status, data.errors, data.problems);
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
};

export const productApi = {
  list: (params, signal) => api(`/products?${query(params)}`, { signal }),
  get: (idOrSlug, signal) => api(`/products/${encodeURIComponent(idOrSlug)}`, { signal }),
  create: (body) => api('/products', { method: 'POST', body }),
  update: (id, body) => api(`/products/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/products/${id}`, { method: 'DELETE' }),
};

export const cartApi = {
  get: (signal) => api('/cart', { signal }),
  add: (productId, qty) => api('/cart/items', { method: 'POST', body: { productId, qty } }),
  setQty: (productId, qty) => api(`/cart/items/${productId}`, { method: 'PUT', body: { qty } }),
  remove: (productId) => api(`/cart/items/${productId}`, { method: 'DELETE' }),
  clear: () => api('/cart', { method: 'DELETE' }),
  merge: (items) => api('/cart/merge', { method: 'POST', body: { items } }),
};

export const orderApi = {
  checkout: (body) => api('/orders', { method: 'POST', body }),
  mine: (params, signal) => api(`/orders?${query(params)}`, { signal }),
  get: (id, signal) => api(`/orders/${id}`, { signal }),
  cancel: (id) => api(`/orders/${id}/cancel`, { method: 'POST' }),
};

export const adminApi = {
  stats: (signal) => api('/admin/stats', { signal }),
  orders: (params, signal) => api(`/admin/orders?${query(params)}`, { signal }),
  setStatus: (id, status) => api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const metaApi = { get: (signal) => api('/meta', { signal }) };
