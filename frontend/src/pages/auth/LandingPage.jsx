import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
  Shield, Users, Calculator, User,
  DollarSign, Eye, EyeOff, Mail, Lock,
  ArrowRight, Building2, ChevronRight, Sparkles
} from 'lucide-react';
import './Auth.css';

function homeFor(role) {
  return {
    [ROLES.ADMIN]: '/dashboard',
    [ROLES.HR]: '/hr-directory',
    [ROLES.PAYROLL]: '/payroll',
    [ROLES.EMPLOYEE]: '/employee-portal',
  }[role] || '/dashboard';
}

const ROLES_CONFIG = [
  {
    key: ROLES.ADMIN,
    label: 'Administrator',
    icon: Shield,
    desc: 'Manage company setup, users, and payroll rules',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    glow: 'rgba(99,102,241,0.4)',
    badge: 'Full Access',
  },
  {
    key: ROLES.HR,
    label: 'HR Officer',
    icon: Users,
    desc: 'Manage employees, attendance, and leave requests',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16,185,129,0.4)',
    badge: 'HR Suite',
  },
  {
    key: ROLES.PAYROLL,
    label: 'Payroll Officer',
    icon: Calculator,
    desc: 'Run payroll, manage salary structures and payslips',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    glow: 'rgba(245,158,11,0.4)',
    badge: 'Finance',
  },
  {
    key: ROLES.EMPLOYEE,
    label: 'Employee',
    icon: User,
    desc: 'View payslips, apply for leave, track attendance',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    glow: 'rgba(236,72,153,0.4)',
    badge: 'Self-Service',
  },
];

// ── Role Login Modal ──────────────────────────────────────────────────────────
function LoginModal({ roleConfig, onClose }) {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const isEmployee = roleConfig.key === ROLES.EMPLOYEE;
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      if (user.role !== roleConfig.key) {
        setError(`This account is not a ${roleConfig.label}. Please use the correct portal.`);
        return;
      }
      onClose();
      navigate(homeFor(user.role));
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <motion.div
      className="landing-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="landing-modal"
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="modal-header" style={{ background: roleConfig.gradient }}>
          <div className="modal-header-icon">
            <roleConfig.icon size={28} />
          </div>
          <div>
            <div className="modal-role-label">{roleConfig.label} Login</div>
            <div className="modal-role-sub">EmPay HRMS</div>
          </div>
        </div>

        <div className="modal-body">
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">{isEmployee ? 'Email or Login ID' : 'Email Address'}</label>
              <div className="input-icon-wrap">
                <Mail size={15} className="input-icon" />
                <input
                  name="email"
                  type={isEmployee ? 'text' : 'email'}
                  value={form.email}
                  onChange={handle}
                  required
                  className="form-input with-icon"
                  placeholder={isEmployee ? 'email@co.com or OIJODO20220001' : 'you@company.com'}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <Lock size={15} className="input-icon" />
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handle}
                  required
                  className="form-input with-icon"
                  placeholder="••••••••"
                />
                <button type="button" className="input-suffix" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}
                >
                  <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 'var(--radius-md)' }}>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', background: roleConfig.gradient, border: 'none', marginTop: 4 }}
              whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${roleConfig.glow}` }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : <><ArrowRight size={16} /> Sign In</>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);

  const roleConfig = ROLES_CONFIG.find(r => r.key === activeRole);

  return (
    <div className="landing-page">
      {/* Animated background blobs */}
      <div className="landing-blob blob-purple" />
      <div className="landing-blob blob-green" />
      <div className="landing-blob blob-pink" />

      {/* Hero */}
      <motion.div
        className="landing-hero"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="landing-logo">
          <div className="landing-logo-icon"><DollarSign size={24} /></div>
          <span className="landing-logo-text">EmPay</span>
          <span className="landing-logo-badge"><Sparkles size={11} /> HRMS</span>
        </div>
        <h1 className="landing-title">
          Smart HR &amp; Payroll<br />
          <span className="landing-title-gradient">Management System</span>
        </h1>
        <p className="landing-subtitle">
          One platform. Every role. Seamless payroll, attendance, and HR — all in one place.
        </p>
      </motion.div>

      {/* Role cards */}
      <motion.div
        className="landing-cards"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        {ROLES_CONFIG.map((rc) => (
          <motion.div
            key={rc.key}
            className="landing-role-card"
            variants={{ hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -6, boxShadow: `0 20px 48px ${rc.glow}` }}
            onClick={() => setActiveRole(rc.key)}
          >
            <div className="role-card-glow" style={{ background: rc.gradient }} />
            <div className="role-card-icon" style={{ background: rc.gradient }}>
              <rc.icon size={26} color="#fff" />
            </div>
            <div className="role-card-badge">{rc.badge}</div>
            <h3 className="role-card-title">{rc.label}</h3>
            <p className="role-card-desc">{rc.desc}</p>
            <motion.div
              className="role-card-btn"
              style={{ background: rc.gradient }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign In <ChevronRight size={15} />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Register CTA */}
      <motion.div
        className="landing-register-cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Building2 size={18} />
        <span>New to EmPay?</span>
        <button className="landing-register-link" onClick={() => navigate('/register')}>
          Register your company <ArrowRight size={14} />
        </button>
      </motion.div>

      {/* Login Modal */}
      <AnimatePresence>
        {activeRole && roleConfig && (
          <LoginModal
            key={activeRole}
            roleConfig={roleConfig}
            onClose={() => setActiveRole(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .landing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 48px;
          padding: 48px 24px;
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }
        .landing-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.18;
          animation: blobFloat 8s ease-in-out infinite alternate;
        }
        .blob-purple { width: 500px; height: 500px; background: #6366f1; top: -120px; left: -120px; animation-delay: 0s; }
        .blob-green  { width: 400px; height: 400px; background: #10b981; bottom: -80px; right: -80px; animation-delay: 3s; }
        .blob-pink   { width: 300px; height: 300px; background: #ec4899; top: 40%; left: 50%; animation-delay: 6s; }
        @keyframes blobFloat { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,30px) scale(1.08); } }

        .landing-hero { text-align: center; position: relative; z-index: 1; }
        .landing-logo { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 24px; }
        .landing-logo-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; }
        .landing-logo-text { font-size: 28px; font-weight: 800; color: var(--on-surface); letter-spacing: -1px; }
        .landing-logo-badge { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; padding: 3px 10px; background: rgba(99,102,241,.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,.3); border-radius: 20px; }
        .landing-title { font-size: clamp(28px, 5vw, 48px); font-weight: 800; line-height: 1.15; color: var(--on-surface); margin: 0 0 16px; }
        .landing-title-gradient { background: linear-gradient(135deg,#6366f1,#ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .landing-subtitle { font-size: 16px; color: var(--on-surface-variant); max-width: 480px; margin: 0 auto; line-height: 1.6; }

        .landing-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1100px;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 900px) { .landing-cards { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .landing-cards { grid-template-columns: 1fr; } }

        .landing-role-card {
          background: var(--surface-container);
          border: 1px solid var(--outline-variant);
          border-radius: 20px;
          padding: 28px 22px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color .2s;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .landing-role-card:hover { border-color: rgba(255,255,255,.2); }
        .role-card-glow { position: absolute; top: -60px; right: -60px; width: 140px; height: 140px; border-radius: 50%; opacity: 0.15; pointer-events: none; }
        .role-card-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .role-card-badge { font-size: 11px; font-weight: 600; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 1px; }
        .role-card-title { font-size: 18px; font-weight: 700; color: var(--on-surface); margin: 0; }
        .role-card-desc { font-size: 13px; color: var(--on-surface-variant); line-height: 1.55; margin: 0; flex: 1; }
        .role-card-btn { display: flex; align-items: center; justify-content: center; gap: 6px; color: #fff; font-weight: 600; font-size: 14px; padding: 10px 16px; border-radius: 10px; margin-top: 4px; }

        .landing-register-cta { display: flex; align-items: center; gap: 10px; color: var(--on-surface-variant); font-size: 14px; position: relative; z-index: 1; }
        .landing-register-link { display: flex; align-items: center; gap: 4px; background: none; border: none; color: #a5b4fc; font-weight: 600; cursor: pointer; font-size: 14px; padding: 0; }
        .landing-register-link:hover { text-decoration: underline; }

        /* Modal */
        .landing-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
        .landing-modal { background: var(--surface-container); border: 1px solid var(--outline-variant); border-radius: 20px; width: 100%; max-width: 420px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,.5); }
        .modal-header { display: flex; align-items: center; gap: 16px; padding: 24px 28px; color: #fff; }
        .modal-header-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .modal-role-label { font-size: 20px; font-weight: 700; }
        .modal-role-sub { font-size: 13px; opacity: .75; }
        .modal-body { padding: 28px; }
      `}</style>
    </div>
  );
}
