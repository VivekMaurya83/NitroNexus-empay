import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
  Shield, Users, Calculator, User,
  DollarSign, Eye, EyeOff, Mail, Lock,
  ArrowRight, Building2, ChevronRight, Sparkles,
  CheckCircle2
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

const FEATURES = [
  {
    key: ROLES.ADMIN,
    label: 'Command Center',
    icon: Shield,
    desc: 'Complete oversight of organizational hierarchy, advanced role-based access control, and master payroll configurations.',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    glow: 'rgba(99,102,241,0.2)',
    features: ['Company Settings', 'Role Management', 'System Audits']
  },
  {
    key: ROLES.HR,
    label: 'Talent Management',
    icon: Users,
    desc: 'Streamlined employee lifecycle tracking, seamless AI-powered bulk onboarding, and intelligent leave administration.',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16,185,129,0.2)',
    features: ['Employee Directory', 'Leave Approvals', 'AI Onboarding']
  },
  {
    key: ROLES.PAYROLL,
    label: 'Financial Operations',
    icon: Calculator,
    desc: 'Automated salary processing, robust statutory compliance engines, and detailed real-time financial reporting.',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    glow: 'rgba(245,158,11,0.2)',
    features: ['Payrun Execution', 'Salary Structures', 'Tax Reports']
  },
  {
    key: ROLES.EMPLOYEE,
    label: 'Self-Service Hub',
    icon: User,
    desc: 'Intuitive self-service portal for instant payslip access, dynamic profile management, and effortless time-off requests.',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    glow: 'rgba(236,72,153,0.2)',
    features: ['Payslip Access', 'Leave Application', 'Profile Management']
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(homeFor(user.role));
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="landing-page">
      {/* Background elements */}
      <div className="landing-blob blob-1" />
      <div className="landing-blob blob-2" />
      
      <header className="landing-nav">
        <div className="landing-logo">
          <div className="logo-icon"><DollarSign size={22} /></div>
          <span className="logo-text">EmPay</span>
          <div className="logo-badge">PRO</div>
        </div>
        <button className="nav-register" onClick={() => navigate('/register')}>
          Register Company <ArrowRight size={14} />
        </button>
      </header>

      <main className="landing-content">
        <div className="hero-section">
          {/* Left: Text */}
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-tag">
              <Sparkles size={14} /> <span>Next Generation HRMS</span>
            </div>
            <h1 className="hero-title">
              Payroll & HR <br />
              <span className="text-gradient">Redefined for Scale</span>
            </h1>
            <p className="hero-desc">
              Empower your organization with a centralized platform for payroll, 
              employee management, and automated workflows. Modern, secure, and built for speed.
            </p>
            
            <div className="hero-benefits">
              <div className="benefit-item">
                <CheckCircle2 size={18} className="text-primary" />
                <span>Automated Statutory Compliance</span>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={18} className="text-primary" />
                <span>One-Click Payroll Processing</span>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={18} className="text-primary" />
                <span>Advanced Role-Based Security</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Login Card */}
          <motion.div 
            className="hero-login"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="login-card">
              <div className="login-header">
                <h3>Welcome Back</h3>
                <p>Sign in to access your portal</p>
              </div>
              
              <form onSubmit={submit} className="login-form">
                <div className="form-group">
                  <label>Email or Login ID</label>
                  <div className="input-wrap">
                    <Mail size={18} className="input-icon" />
                    <input 
                      name="email"
                      type="text"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={handle}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrap">
                    <Lock size={18} className="input-icon" />
                    <input 
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handle}
                      required
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      className="login-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ChevronRight size={18} />
                </button>
              </form>

              <div className="login-footer">
                <p>New to EmPay?</p>
                <button onClick={() => navigate('/register')}>Register your company</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">Designed for Every User</h2>
            <p className="section-desc">Four specialized views tailored for maximum productivity</p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div 
                key={f.key}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                whileHover={{ y: -5 }}
              >
                <div className="feature-icon" style={{ background: f.gradient }}>
                  <f.icon size={24} color="#fff" />
                </div>
                <h3 className="feature-label">{f.label}</h3>
                <p className="feature-text">{f.desc}</p>
                <ul className="feature-list">
                  {f.features.map(item => (
                    <li key={item}><ChevronRight size={12} /> {item}</li>
                  ))}
                </ul>
                <div className="feature-glow" style={{ background: f.glow }} />
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2026 EmPay HRMS. All rights reserved.</p>
        <div className="footer-links">
          <span>Security</span>
          <span>Terms</span>
          <span>Privacy</span>
        </div>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--surface);
          color: var(--on-surface);
          font-family: var(--font-family);
          position: relative;
          overflow-x: hidden;
        }

        .landing-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          z-index: 0;
          pointer-events: none;
        }
        .blob-1 { width: 600px; height: 600px; background: var(--primary); top: -200px; right: -100px; }
        .blob-2 { width: 500px; height: 500px; background: #ec4899; bottom: -100px; left: -100px; }

        .landing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 80px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) { .landing-nav { padding: 24px 20px; } }

        .landing-logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { width: 40px; height: 40px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--on-primary); }
        .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-badge { font-size: 10px; font-weight: 700; background: var(--primary-container); border: 1px solid var(--primary); padding: 2px 8px; border-radius: 20px; color: var(--on-primary-container); }

        .nav-register { background: none; border: 1px solid var(--outline-variant); color: var(--on-surface); padding: 10px 20px; border-radius: 10px; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .nav-register:hover { background: var(--surface-container); border-color: var(--outline); }

        .landing-content { max-width: 1200px; margin: 0 auto; padding: 60px 20px; position: relative; z-index: 10; }

        .hero-section { display: grid; grid-template-columns: 1fr 450px; gap: 80px; align-items: center; margin-bottom: 120px; }
        @media (max-width: 1024px) { .hero-section { grid-template-columns: 1fr; text-align: center; gap: 60px; } .hero-login { margin: 0 auto; } .hero-benefits { justify-content: center; } }

        .hero-tag { display: inline-flex; align-items: center; gap: 8px; background: var(--primary-container); border: 1px solid var(--primary); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; color: var(--on-primary-container); margin-bottom: 24px; }
        .hero-title { font-size: 64px; font-weight: 800; line-height: 1.1; margin-bottom: 24px; letter-spacing: -2px; }
        .text-gradient { background: linear-gradient(135deg, var(--primary-light), #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-desc { font-size: var(--font-size-lg); color: var(--on-surface-variant); line-height: 1.6; max-width: 540px; margin-bottom: 40px; }

        .hero-benefits { display: flex; flex-direction: column; gap: 16px; margin-top: 40px; }
        .benefit-item { display: flex; align-items: center; gap: 12px; font-size: var(--font-size-md); color: var(--on-surface); }
        .text-primary { color: var(--primary); }

        .login-card { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 450px; box-shadow: var(--shadow-xl); }
        .login-header h3 { font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 8px; }
        .login-header p { font-size: var(--font-size-sm); color: var(--on-surface-variant); margin-bottom: 32px; }

        .login-form { display: flex; flex-direction: column; gap: 24px; }
        .form-group label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--on-surface-variant); margin-bottom: 8px; }
        .input-wrap { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--on-surface-variant); }
        .input-wrap input { width: 100%; background: var(--surface-container); border: 1px solid var(--outline-variant); border-radius: var(--radius-md); padding: 14px 14px 14px 44px; color: var(--on-surface); font-size: var(--font-size-md); transition: all 0.2s; }
        .input-wrap input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px var(--primary-container); }
        .pass-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--on-surface-variant); cursor: pointer; display: flex; }

        .login-error { font-size: var(--font-size-sm); color: var(--error); background: var(--error-container); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(239, 68, 68, 0.2); }

        .login-btn { background: var(--primary); color: var(--on-primary); border: none; border-radius: var(--radius-md); padding: 16px; font-size: var(--font-size-md); font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .login-btn:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .login-btn:active { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .login-footer { margin-top: 32px; text-align: center; font-size: var(--font-size-sm); color: var(--on-surface-variant); }
        .login-footer button { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; margin-left: 6px; }
        .login-footer button:hover { text-decoration: underline; }

        .features-section { padding-top: 40px; }
        .section-header { text-align: center; margin-bottom: 60px; }
        .section-title { font-size: var(--font-size-3xl); font-weight: 800; margin-bottom: 16px; }
        .section-desc { font-size: var(--font-size-lg); color: var(--on-surface-variant); }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
        .feature-card { background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: var(--radius-lg); padding: 32px; position: relative; overflow: hidden; }
        .feature-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
        .feature-label { font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 12px; color: var(--on-surface); }
        .feature-text { font-size: var(--font-size-sm); color: var(--on-surface-variant); line-height: 1.6; margin-bottom: 24px; min-height: 60px; }
        .feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .feature-list li { font-size: var(--font-size-sm); font-weight: 600; color: var(--on-surface); display: flex; align-items: center; gap: 8px; }
        .feature-glow { position: absolute; top: -50px; right: -50px; width: 120px; height: 120px; border-radius: 50%; filter: blur(40px); opacity: 0.5; z-index: 0; }

        .landing-footer { max-width: 1200px; margin: 120px auto 0; padding: 40px 20px; border-top: 1px solid var(--outline-variant); display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-sm); color: var(--on-surface-variant); }
        .footer-links { display: flex; gap: 24px; }
        @media (max-width: 640px) { .landing-footer { flex-direction: column; gap: 20px; text-align: center; } }
      `}</style>
    </div>
  );
}
