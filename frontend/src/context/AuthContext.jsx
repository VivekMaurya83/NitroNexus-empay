import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS, setCurrentUser } from '../utils/mockData';
import { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('empay_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('empay_user', JSON.stringify(user));
      setCurrentUser(user);        // keep mockData in sync
    } else {
      localStorage.removeItem('empay_user');
    }
  }, [user]);

  // Mock login: matches DEMO_USERS by email, then sets role
  const login = async (email, password, selectedRole) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate network
    const demoUser = DEMO_USERS.find(u => u.role === selectedRole) || DEMO_USERS[0];
    const authedUser = { ...demoUser, email: email || demoUser.email };
    // When backend is ready: replace with real JWT login
    // const { token, user } = await apiPost('/auth/login', { email, password });
    // setAuthToken(token);
    setUser(authedUser);
    setLoading(false);
    return authedUser;
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('empay_user');
  };

  const can = (permission) => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(permission) || perms.includes('*');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Fine-grained permission strings
export const ROLE_PERMISSIONS = {
  admin: ['*'],
  hr_officer: [
    'view:directory', 'add:employee', 'edit:employee',
    'view:attendance:all', 'view:leave:all', 'approve:leave',
    'view:leave-allocation', 'manage:leave-allocation',
    'view:analytics', 'view:status-board', 'view:profile:own',
  ],
  payroll_officer: [
    'view:payroll', 'run:payroll', 'view:salary-structure', 'edit:salary-structure',
    'approve:leave', 'view:leave:all',
    'view:attendance:all', 'view:analytics',
    'view:payslip:all', 'view:status-board', 'view:profile:own',
  ],
  employee: [
    'view:portal', 'clock:attendance', 'view:attendance:own',
    'apply:leave', 'view:leave:own',
    'view:payslip:own', 'view:salary:own',
    'view:status-board', 'view:profile:own',
  ],
};
