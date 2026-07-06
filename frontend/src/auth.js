import { api } from './api';

const TOKEN_KEY = 'vietride_access_token';
const REFRESH_KEY = 'vietride_refresh_token';
const USER_KEY = 'vietride_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function saveAuth(data) {
  localStorage.setItem(TOKEN_KEY, data.access_token || data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refresh_token || data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function register(data) {
  const res = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  saveAuth(res);
  return res;
}

export async function login(data) {
  const res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  saveAuth(res);
  return res;
}

export async function refreshToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error('No refresh token');
  const res = await api(`/auth/refresh?token=${encodeURIComponent(refresh)}`, { method: 'POST' });
  saveAuth(res);
  return res;
}
