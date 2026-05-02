import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Mail, Lock, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      // 1. Register Admin (company auto-created by backend)
      await register({
        email: form.email,
        password: form.password,
        role: ROLES.ADMIN
      });

      // 2. Auto login
      await login(form.email, form.password);
      
      // 3. Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob blob-1" /><div className="auth-blob blob-2" /><div className="auth-blob blob-3" />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon"><DollarSign size={28} /></div>
          <div>
            <h1 className="auth-brand">EmPay</h1>
            <p className="auth-tagline">Create Admin Account</p>
          </div>
        </div>

        <form onSubmit={submit} className="auth-form" style={{ marginTop: 'var(--space-6)' }}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input name="email" type="email" value={form.email} onChange={handle} className="form-input with-icon" placeholder="admin@company.com" required />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input name="password" type="password" value={form.password} onChange={handle} className="form-input with-icon" placeholder="Min 8 characters" required />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handle} className="form-input with-icon" placeholder="Re-enter password" required />
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
            {loading ? 'Creating Account…' : 'Register'}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: 'var(--primary-container)', fontWeight: 600 }}>Sign in</a></p>
        </div>
      </motion.div>
    </div>
  );
}
