import { getToken } from './auth';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API error' }));
    throw new Error(error.message || 'API error');
  }
  return response.json();
}

export async function authApi(path, options = {}) {
  const token = getToken();
  return api(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
