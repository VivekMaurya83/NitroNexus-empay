import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens, getAccessToken } from '../services/api';

// ── Role constants (match backend UserRole enum exactly) ─────────────────────
export const ROLES = {
  ADMIN:   'admin',
  HR:      'hr_officer',
  PAYROLL: 'payroll_officer',
  EMPLOYEE:'employee',
};

// ── Permission matrix ────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]:   ['*'],
  [ROLES.HR]:      [
    'view:employees', 'create:employees', 'edit:employees',
    'view:attendance', 'edit:attendance',
    'view:leave', 'approve:leave',
    'view:analytics',
    'view:profile',
  ],
  [ROLES.PAYROLL]: [
    'view:payroll', 'run:payroll', 'view:payslip',
    'view:salary', 'edit:salary',
    'view:attendance',
    'view:leave', 'approve:leave',
    'view:analytics',
    'view:profile',
  ],
  [ROLES.EMPLOYEE]: [
    'view:own-attendance', 'checkin:attendance',
    'view:own-leave', 'apply:leave',
    'view:own-payslip',
    'view:own-salary',
    'view:profile', 'edit:profile',
  ],
};

const AuthContext = createContext(null);

// ── Util: map backend TokenResponse → frontend user object ───────────────────
function buildUserFromToken(tokenResp, meData) {
  return {
    id:          tokenResp.user_id,
    employeeId:  tokenResp.employee_id,
    companyId:   tokenResp.company_id,
    role:        tokenResp.role,
    email:       meData?.email || '',
    name:        meData?.name  || meData?.email?.split('@')[0] || 'User',
    company:     meData?.company_name || 'Your Company',
    // UI display helpers
    avatar:      (meData?.name || meData?.email || 'U')[0].toUpperCase(),
    photoColor:  roleColor(tokenResp.role),
    designation: roleLabel(tokenResp.role),
    department:  meData?.department || '',
  };
}

function roleColor(role) {
  return { admin:'#6366f1', hr_officer:'#10b981', payroll_officer:'#f59e0b', employee:'#ec4899' }[role] || '#6366f1';
}
function roleLabel(role) {
  return { admin:'Administrator', hr_officer:'HR Officer', payroll_officer:'Payroll Officer', employee:'Employee' }[role] || role;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true until rehydration complete

  // Rehydrate user from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem('empay_user');
    if (stored && getAccessToken()) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Silently verify token is still valid
        api.get('/auth/me').then(me => {
          if (me) {
            const updated = { ...parsed, email: me.email, companyId: me.company_id, employeeId: me.employee_id };
            setUser(updated);
            localStorage.setItem('empay_user', JSON.stringify(updated));
          }
        }).catch(() => {
          // Token expired and refresh failed — will be handled by api.js
        });
      } catch { /* corrupted storage */ }
    }
    setLoading(false);
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const tokenResp = await api.post('/auth/login', { email, password });
      setTokens(tokenResp.access_token, tokenResp.refresh_token);

      // Fetch full user profile
      const me = await api.get('/auth/me');
      // Fetch company name
      let companyName = 'Your Company';
      try {
        const co = await api.get('/companies/me');
        companyName = co?.name || companyName;
      } catch { /* non-critical */ }

      const userObj = buildUserFromToken(tokenResp, { ...me, company_name: companyName });
      setUser(userObj);
      localStorage.setItem('empay_user', JSON.stringify(userObj));
      return userObj;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (data) => {
    // data: { email, password, role, company_id? }
    return api.post('/auth/register', data);
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  // ── permission check ───────────────────────────────────────────────────────
  const can = useCallback((permission) => {
    if (!user?.role) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes('*') || perms.includes(permission);
  }, [user?.role]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, can, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
