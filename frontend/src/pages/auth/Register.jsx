import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Building2, Mail, Lock, Phone, MapPin, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import './Auth.css';

const STEPS = ['Company Info', 'Admin Account', 'Review'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', adminEmail: '', password: '', confirmPassword: '' });
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (step < 2) { setStep(s => s + 1); return; }
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
      </div>

      <motion.div
        className="auth-card auth-card-wide"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon"><DollarSign size={28} /></div>
          <div>
            <h1 className="auth-brand">EmPay</h1>
            <p className="auth-tagline">Company Registration</p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="auth-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`auth-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-circle">{i < step ? <Check size={14} /> : i + 1}</div>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="auth-form">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <div className="auth-input-wrap">
                  <Building2 size={16} className="auth-input-icon" />
                  <input name="name" value={form.name} onChange={handle} className="form-input auth-input" placeholder="Acme Corp Pvt. Ltd." required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Company Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input name="email" type="email" value={form.email} onChange={handle} className="form-input auth-input" placeholder="contact@company.com" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="auth-input-wrap">
                  <Phone size={16} className="auth-input-icon" />
                  <input name="phone" value={form.phone} onChange={handle} className="form-input auth-input" placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Company Address</label>
                <div className="auth-input-wrap">
                  <MapPin size={16} className="auth-input-icon" />
                  <input name="address" value={form.address} onChange={handle} className="form-input auth-input" placeholder="123 Main St, Bengaluru" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="form-group">
                <label className="form-label">Admin Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input name="adminEmail" type="email" value={form.adminEmail} onChange={handle} className="form-input auth-input" placeholder="admin@company.com" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input name="password" type="password" value={form.password} onChange={handle} className="form-input auth-input" placeholder="Min 8 characters" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handle} className="form-input auth-input" placeholder="Re-enter password" required />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="auth-review">
              <div className="review-item"><span>Company</span><strong>{form.name || '—'}</strong></div>
              <div className="review-item"><span>Email</span><strong>{form.email || '—'}</strong></div>
              <div className="review-item"><span>Phone</span><strong>{form.phone || '—'}</strong></div>
              <div className="review-item"><span>Address</span><strong>{form.address || '—'}</strong></div>
              <div className="review-item"><span>Admin Email</span><strong>{form.adminEmail || '—'}</strong></div>
            </motion.div>
          )}

          <div className="auth-step-btns">
            {step > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <motion.button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {step === 2 ? 'Create Account' : <>Next <ChevronRight size={16} /></>}
            </motion.button>
          </div>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a></p>
        </div>
      </motion.div>
    </div>
  );
}
