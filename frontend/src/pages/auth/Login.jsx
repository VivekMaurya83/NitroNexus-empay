import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/mockData';
import './Auth.css';

const ROLE_TABS = [
  { role: ROLES.ADMIN,   label: 'Admin',          color: '#6366f1', desc: 'Full access & configurations' },
  { role: ROLES.HR,      label: 'HR Officer',     color: '#10b981', desc: 'People & attendance management' },
  { role: ROLES.PAYROLL, label: 'Payroll Officer', color: '#f59e0b', desc: 'Salary & payroll operations' },
  { role: ROLES.EMPLOYEE,label: 'Employee',        color: '#ec4899', desc: 'Personal HR self-service' },
];

function homeFor(role) {
  return { [ROLES.ADMIN]:'/dashboard', [ROLES.HR]:'/hr-directory', [ROLES.PAYROLL]:'/payroll', [ROLES.EMPLOYEE]:'/employee-portal' }[role] || '/dashboard';
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [showPass, setShowPass]   = useState(false);
  const [selectedRole, setRole]   = useState(ROLES.ADMIN);
  const [form, setForm]           = useState({ email: '', password: '' });
  const [error, setError]         = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password, selectedRole);
      navigate(homeFor(user.role));
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const activeTab = ROLE_TABS.find(t => t.role === selectedRole);

  return (
    <div className="auth-page">
      {/* Animated blobs */}
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />
      <div className="auth-blob blob-3" />

      <motion.div className="auth-card" initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon"><DollarSign size={22} /></div>
          <span className="logo-text" style={{ fontSize: 'var(--font-size-2xl)' }}>EmPay</span>
        </div>
        <div className="auth-tagline">Smart HR Management System</div>

        {/* Demo Role Switcher */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={12} /> Demo — Select Role
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {ROLE_TABS.map(tab => (
              <motion.button
                key={tab.role}
                type="button"
                onClick={() => setRole(tab.role)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                  border: selectedRole === tab.role ? `2px solid ${tab.color}` : '2px solid var(--outline-variant)',
                  background: selectedRole === tab.role ? `${tab.color}15` : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: selectedRole === tab.role ? tab.color : 'var(--on-surface)' }}>{tab.label}</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>{tab.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          <AnimatePresence mode="wait">
            <motion.div key={selectedRole} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: `${activeTab.color}10`, border: `1px solid ${activeTab.color}30`, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>
                Signing in as <strong style={{ color: activeTab.color }}>{activeTab.label}</strong> — {activeTab.desc}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input name="email" type="email" value={form.email} onChange={handle} className="form-input with-icon" placeholder="you@company.com" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle} className="form-input with-icon" placeholder="••••••••" />
              <button type="button" className="input-suffix" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>{error}</div>}

          <motion.button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: activeTab.color, borderColor: activeTab.color }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            {loading ? 'Signing in…' : `Sign in as ${activeTab.label}`}
          </motion.button>
        </form>

        <div className="auth-footer">
          New company? <a onClick={() => navigate('/register')} style={{ cursor: 'pointer', color: 'var(--primary-container)', fontWeight: 600 }}>Register here</a>
        </div>
      </motion.div>
    </div>
  );
}
