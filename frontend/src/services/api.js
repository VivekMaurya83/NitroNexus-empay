/**
 * Central HTTP client for EmPay HRMS
 * - Automatically injects Bearer token from localStorage
 * - On 401: tries one silent refresh, then logs out
 * - All responses follow the backend ResponseModel shape: { data, message, status_code }
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem('empay_access_token');
export const getRefreshToken = () => localStorage.getItem('empay_refresh_token');
export const setTokens = (access, refresh) => {
  localStorage.setItem('empay_access_token',  access);
  localStorage.setItem('empay_refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('empay_access_token');
  localStorage.removeItem('empay_refresh_token');
  localStorage.removeItem('empay_user');
};

// ── Low-level fetch wrapper ─────────────────────────────────────────────────
let _refreshing = null; // deduplicate concurrent refresh attempts

async function silentRefresh() {
  const rt = getRefreshToken();
  if (!rt) throw new Error('No refresh token');
  const res = await fetch(`${BASE}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refresh_token: rt }),
  });
  if (!res.ok) { clearTokens(); throw new Error('Refresh failed'); }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

/**
 * Core fetch — injects auth header, auto-refreshes on 401
 * @param {string} path   — relative path, e.g. '/employees/'
 * @param {object} opts   — standard fetch options
 * @param {boolean} retry — internal flag to prevent infinite loop
 */
export async function apiFetch(path, opts = {}, retry = true) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    if (!_refreshing) _refreshing = silentRefresh().finally(() => { _refreshing = null; });
    try {
      const newToken = await _refreshing;
      return apiFetch(path, opts, false); // retry once with new token
    } catch {
      clearTokens();
      window.location.href = '/login';
      return;
    }
  }

  // Parse JSON — backend always returns JSON (except PDF download)
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/pdf')) return res; // caller handles blob

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.detail || json?.message || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  // Unwrap ResponseModel: return json.data if present, else full json
  return json.data !== undefined ? json.data : json;
}

// ── Convenience methods ──────────────────────────────────────────────────────
export const api = {
  get:    (path, opts)        => apiFetch(path, { method: 'GET',    ...opts }),
  post:   (path, body, opts)  => apiFetch(path, { method: 'POST',   body: JSON.stringify(body), ...opts }),
  patch:  (path, body, opts)  => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body), ...opts }),
  put:    (path, body, opts)  => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body), ...opts }),
  delete: (path, opts)        => apiFetch(path, { method: 'DELETE', ...opts }),

  // Blob download (PDF payslip)
  blob: async (path) => {
    const res = await apiFetch(path, { method: 'GET' });
    if (res instanceof Response) return res.blob();
    return null;
  },
};

export default api;
