const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Make sure the API is running.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = res.status >= 500 && !data.message ? 'Server error — is the database connected?' : data.message;
    throw new ApiError(msg || `Request failed (${res.status})`, res.status, data.errors);
  }
  return data;
}

export const studentsApi = {
  list: (params = {}, signal) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    return request(`/students?${qs}`, { signal });
  },
  stats: (signal) => request('/students/stats', { signal }),
  meta: (signal) => request('/students/meta', { signal }),
  get: (id, signal) => request(`/students/${id}`, { signal }),
  create: (data) => request('/students', { method: 'POST', body: data }),
  update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/students/${id}`, { method: 'DELETE' }),
};
