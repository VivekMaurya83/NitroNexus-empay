import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Mail, Lock, Building2, Check, ChevronRight, Users } from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import './Auth.css';

const STEPS = [
  { label: 'Company Info', icon: Building2 },
  { label: 'Admin Credentials', icon: Lock },
];

export default function Register() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    strength: '1-10',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    setError('');
    if (!form.companyName.trim()) { setError('Company name is required'); return; }
    setStep(1);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError("Passwords don't match"); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        role: ROLES.ADMIN,
        company_name: form.companyName.trim(),
        strength: form.strength,
      });
      await login(form.email, form.password);
      navigate('/admin/setup');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />
      <div className="auth-blob blob-3" />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: 440 }}
      >
        {/* Logo */}
        <div className="auth-logo">
          <img src="/logo.png" alt="Company Logo" style={{ height: '56px', width: 'auto' }} />
          <span className="logo-text" style={{ fontSize: 'var(--font-size-2xl)', marginLeft: 0 }}>EmPay</span>
        </div>
        <div className="auth-tagline">Register Your Company</div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, margin: '20px 0', justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i <= step ? 'var(--primary-container)' : 'var(--surface-container-high)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: i <= step ? '#fff' : 'var(--on-surface-variant)',
                transition: 'all .3s',
              }}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: i === step ? 'var(--on-surface)' : 'var(--on-surface-variant)', fontWeight: i === step ? 600 : 400 }}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} style={{ color: 'var(--on-surface-variant)' }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.form key="step0" onSubmit={nextStep}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <div className="form-group">
                <label className="form-label">Company / Organisation Name *</label>
                <div className="input-icon-wrap">
                  <Building2 size={16} className="input-icon" />
                  <input
                    name="companyName" value={form.companyName} onChange={handle}
                    className="form-input with-icon" placeholder="e.g. Odoo India" required autoFocus
                  />
                </div>
                <div className="form-hint" style={{ marginTop: 6 }}>
                  This name will be used to generate employee Login IDs (e.g. <strong>OI</strong>JODO20220001)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Strength of the Organisation *</label>
                <div className="input-icon-wrap">
                  <Users size={16} className="input-icon" />
                  <select name="strength" value={form.strength} onChange={handle} className="form-select with-icon" required>
                    <option value="1-10">1 - 10 Employees</option>
                    <option value="11-50">11 - 50 Employees</option>
                    <option value="51-200">51 - 200 Employees</option>
                    <option value="201-500">201 - 500 Employees</option>
                    <option value="500+">500+ Employees</option>
                  </select>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)' }}>{error}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Continue <ChevronRight size={16} />
              </motion.button>
            </motion.form>
          )}

          {step === 1 && (
            <motion.form key="step1" onSubmit={submit}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>
                <Building2 size={13} style={{ display: 'inline', marginRight: 6 }} />
                <strong style={{ color: 'var(--on-surface)' }}>{form.companyName}</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Email *</label>
                <div className="input-icon-wrap">
                  <Mail size={16} className="input-icon" />
                  <input name="email" type="email" value={form.email} onChange={handle} className="form-input with-icon" placeholder="admin@company.com" required autoFocus />
                </div>
                <div className="form-hint" style={{ marginTop: 6 }}>This email + password will be your Admin login credentials</div>
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input name="password" type="password" value={form.password} onChange={handle} className="form-input with-icon" placeholder="Min 8 characters" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handle} className="form-input with-icon" placeholder="Re-enter password" required />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)' }}>{error}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(0)} style={{ flex: '0 0 auto' }}>Back</button>
                <motion.button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
                  {loading ? 'Creating…' : 'Create Admin Account'}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          Already have an account?{' '}
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer', color: 'var(--primary-container)', fontWeight: 600 }}>
            Sign in
          </a>
        </div>
      </motion.div>
    </div>
  );
}
