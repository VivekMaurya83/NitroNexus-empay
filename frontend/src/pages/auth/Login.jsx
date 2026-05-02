import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import './Auth.css';

function homeFor(role) {
  return { [ROLES.ADMIN]:'/dashboard', [ROLES.HR]:'/hr-directory', [ROLES.PAYROLL]:'/payroll', [ROLES.EMPLOYEE]:'/employee-portal' }[role] || '/dashboard';
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [showPass, setShowPass]   = useState(false);
  const [form, setForm]           = useState({ email: '', password: '' });
  const [error, setError]         = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(homeFor(user.role));
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="auth-page">
      {/* Animated blobs */}
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />
      <div className="auth-blob blob-3" />

      <motion.div className="auth-card" initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <div className="auth-logo">
          <div className="logo-icon"><DollarSign size={22} /></div>
          <span className="logo-text" style={{ fontSize: 'var(--font-size-2xl)' }}>EmPay</span>
        </div>
        <div className="auth-tagline">Smart HR Management System</div>

        {/* Form */}
        <form onSubmit={submit}>
          <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input name="email" type="email" value={form.email} onChange={handle} required className="form-input with-icon" placeholder="you@company.com" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle} required className="form-input with-icon" placeholder="••••••••" />
              <button type="button" className="input-suffix" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)' }}>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        <div className="auth-footer">
          New company? <a onClick={() => navigate('/register')} style={{ cursor: 'pointer', color: 'var(--primary-container)', fontWeight: 600 }}>Register here</a>
        </div>
      </motion.div>
    </div>
  );
}
