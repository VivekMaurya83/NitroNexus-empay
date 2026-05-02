// src/services/api.js
// Base HTTP client — swap VITE_API_URL in .env when backend is ready

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function setAuthToken(token) {
  if (token) localStorage.setItem('empay_token', token);
  else localStorage.removeItem('empay_token');
}

function authHeaders() {
  const token = localStorage.getItem('empay_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

export const apiGet = (path) =>
  fetch(`${BASE_URL}${path}`, { headers: authHeaders() }).then(handleResponse);

export const apiPost = (path, body) =>
  fetch(`${BASE_URL}${path}`, { method:'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const apiPut = (path, body) =>
  fetch(`${BASE_URL}${path}`, { method:'PUT',  headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const apiPatch = (path, body) =>
  fetch(`${BASE_URL}${path}`, { method:'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const apiDelete = (path) =>
  fetch(`${BASE_URL}${path}`, { method:'DELETE', headers: authHeaders() }).then(handleResponse);
