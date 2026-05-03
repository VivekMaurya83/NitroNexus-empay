import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
  Shield, Users, Calculator, User,
  DollarSign, Eye, EyeOff, Mail, Lock,
  ArrowRight, ChevronRight, Sparkles,
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
    desc: 'Complete oversight of organizational hierarchy, access control, and configurations.',
    color: '#4f46e5',
    bg: '#e0e7ff',
    features: ['Company Settings', 'Role Management', 'System Audits']
  },
  {
    key: ROLES.HR,
    label: 'Talent Management',
    icon: Users,
    desc: 'Streamlined employee lifecycle tracking and intelligent leave administration.',
    color: '#059669',
    bg: '#d1fae5',
    features: ['Employee Directory', 'Leave Approvals', 'Onboarding']
  },
  {
    key: ROLES.PAYROLL,
    label: 'Financial Operations',
    icon: Calculator,
    desc: 'Automated salary processing and detailed real-time financial reporting.',
    color: '#d97706',
    bg: '#fef3c7',
    features: ['Payrun Execution', 'Salary Structures', 'Tax Reports']
  },
  {
    key: ROLES.EMPLOYEE,
    label: 'Self-Service Hub',
    icon: User,
    desc: 'Intuitive portal for instant payslip access and effortless time-off requests.',
    color: '#db2777',
    bg: '#fce7f3',
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
      <header className="landing-nav">
        <div className="landing-logo">
          <img src="/logo.png" alt="Company Logo" style={{ height: '56px', width: 'auto' }} />
          <span className="logo-text" style={{ marginLeft: 12 }}>EmPay</span>
        </div>
        <button className="nav-register" onClick={() => navigate('/register')}>
          Register Company <ArrowRight size={16} />
        </button>
      </header>

      <main className="landing-content">
        <div className="hero-section">
          {/* Left: Text */}
          <motion.div 
            className="hero-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">
              Payroll & HR <br />
              <span className="text-highlight">Made Simple</span>
            </h1>
            <p className="hero-desc">
              Empower your organization with a clean, centralized platform for payroll, 
              employee management, and automated workflows.
            </p>
            
            <div className="hero-benefits">
              <div className="benefit-item">
                <CheckCircle2 size={20} className="text-primary" />
                <span>Automated Compliance</span>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={20} className="text-primary" />
                <span>One-Click Payroll</span>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={20} className="text-primary" />
                <span>Role-Based Security</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Login Card */}
          <motion.div 
            className="hero-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="login-card">
              <div className="login-header">
                <h3>Welcome Back</h3>
                <p>Sign in to your workspace</p>
              </div>
              
              <form onSubmit={submit} className="login-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrap">
                    <Mail size={18} className="input-icon" />
                    <input 
                      name="email"
                      type="email"
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
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      className="login-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="login-footer">
                <span>New to EmPay?</span>
                <button onClick={() => navigate('/register')}>Create an account</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">Designed for Everyone</h2>
            <p className="section-desc">Specialized views tailored for maximum productivity</p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div 
                key={f.key}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
              >
                <div className="feature-icon" style={{ backgroundColor: f.bg, color: f.color }}>
                  <f.icon size={28} />
                </div>
                <h3 className="feature-label">{f.label}</h3>
                <p className="feature-text">{f.desc}</p>
                <ul className="feature-list">
                  {f.features.map(item => (
                    <li key={item}><ChevronRight size={14} color={f.color} /> {item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} EmPay. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background-color: #ffffff;
          color: #111827;
          font-family: 'Inter', system-ui, sans-serif;
          overflow-x: hidden;
        }

        .landing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 60px;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (max-width: 768px) { .landing-nav { padding: 20px; } }

        .landing-logo { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
        }
        .logo-icon { 
          width: 44px; 
          height: 44px; 
          background: #4f46e5; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
        }
        .logo-text { 
          font-size: 26px; 
          font-weight: 800; 
          letter-spacing: -0.02em; 
          color: #111827;
        }

        .nav-register { 
          background: #f3f4f6; 
          border: none; 
          color: #374151; 
          padding: 12px 24px; 
          border-radius: 100px; 
          font-size: 14px; 
          font-weight: 600; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          transition: all 0.2s ease; 
        }
        .nav-register:hover { 
          background: #e5e7eb; 
          color: #111827; 
        }

        .landing-content { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 60px 24px; 
        }

        .hero-section { 
          display: grid; 
          grid-template-columns: 1fr 420px; 
          gap: 80px; 
          align-items: center; 
          margin-bottom: 100px; 
        }
        @media (max-width: 1024px) { 
          .hero-section { 
            grid-template-columns: 1fr; 
            text-align: center; 
            gap: 60px; 
          } 
          .hero-login { margin: 0 auto; width: 100%; max-width: 420px; } 
          .hero-benefits { justify-content: center; } 
        }

        .hero-title { 
          font-size: 64px; 
          font-weight: 800; 
          line-height: 1.1; 
          margin-bottom: 24px; 
          letter-spacing: -0.03em; 
          color: #111827;
        }
        .text-highlight { 
          color: #4f46e5; 
        }
        .hero-desc { 
          font-size: 18px; 
          color: #4b5563; 
          line-height: 1.6; 
          max-width: 540px; 
          margin-bottom: 40px; 
        }

        .hero-benefits { 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
        }
        .benefit-item { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          font-size: 16px; 
          color: #374151; 
          font-weight: 500;
        }
        .text-primary { color: #4f46e5; }

        .login-card { 
          background: #ffffff; 
          border: 1px solid #e5e7eb; 
          border-radius: 24px; 
          padding: 40px; 
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); 
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .login-header h3 { 
          font-size: 24px; 
          font-weight: 700; 
          color: #111827;
          margin-bottom: 8px; 
        }
        .login-header p { 
          font-size: 15px; 
          color: #6b7280; 
        }

        .login-form { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
        }
        .form-group label { 
          display: block; 
          font-size: 14px; 
          font-weight: 600; 
          color: #374151; 
          margin-bottom: 8px; 
        }
        .input-wrap { position: relative; }
        .input-icon { 
          position: absolute; 
          left: 16px; 
          top: 50%; 
          transform: translateY(-50%); 
          color: #9ca3af; 
        }
        .input-wrap input { 
          width: 100%; 
          background: #f9fafb; 
          border: 1px solid #d1d5db; 
          border-radius: 12px; 
          padding: 14px 16px 14px 48px; 
          color: #111827; 
          font-size: 15px; 
          transition: all 0.2s; 
        }
        .input-wrap input:focus { 
          background: #ffffff;
          border-color: #4f46e5; 
          outline: none; 
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); 
        }
        .pass-toggle { 
          position: absolute; 
          right: 16px; 
          top: 50%; 
          transform: translateY(-50%); 
          background: none; 
          border: none; 
          color: #9ca3af; 
          cursor: pointer; 
        }
        .pass-toggle:hover { color: #4b5563; }

        .login-error { 
          font-size: 14px; 
          color: #b91c1c; 
          background: #fef2f2; 
          padding: 12px 16px; 
          border-radius: 8px; 
          border: 1px solid #fecaca; 
          text-align: center;
        }

        .login-btn { 
          background: #111827; 
          color: #ffffff; 
          border: none; 
          border-radius: 12px; 
          padding: 16px; 
          font-size: 16px; 
          font-weight: 600; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px; 
          transition: all 0.2s; 
          margin-top: 8px;
        }
        .login-btn:hover { 
          background: #374151; 
        }
        .login-btn:disabled { 
          opacity: 0.7; 
          cursor: not-allowed; 
        }

        .login-footer { 
          margin-top: 32px; 
          text-align: center; 
          font-size: 14px; 
          color: #6b7280; 
        }
        .login-footer button { 
          background: none; 
          border: none; 
          color: #4f46e5; 
          font-weight: 600; 
          cursor: pointer; 
          margin-left: 6px; 
        }
        .login-footer button:hover { text-decoration: underline; }

        .features-section { padding-top: 60px; border-top: 1px solid #f3f4f6; }
        .section-header { text-align: center; margin-bottom: 60px; }
        .section-title { font-size: 36px; font-weight: 800; margin-bottom: 16px; color: #111827; letter-spacing: -0.02em; }
        .section-desc { font-size: 18px; color: #6b7280; }

        .features-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
          gap: 24px; 
        }
        .feature-card { 
          background: #ffffff; 
          border: 1px solid #e5e7eb; 
          border-radius: 24px; 
          padding: 36px 32px; 
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .feature-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.12);
          transform: translateY(-8px) scale(1.01);
        }
        .feature-icon { 
          width: 56px; 
          height: 56px; 
          border-radius: 16px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin-bottom: 24px; 
        }
        .feature-label { 
          font-size: 20px; 
          font-weight: 700; 
          margin-bottom: 12px; 
          color: #111827; 
        }
        .feature-text { 
          font-size: 15px; 
          color: #6b7280; 
          line-height: 1.6; 
          margin-bottom: 24px; 
          min-height: 72px; 
        }
        .feature-list { 
          list-style: none; 
          padding: 0; 
          margin: 0; 
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
        }
        .feature-list li { 
          font-size: 14px; 
          font-weight: 500; 
          color: #374151; 
          display: flex; 
          align-items: center; 
          gap: 10px; 
        }

        .landing-footer { 
          max-width: 1200px; 
          margin: 60px auto 0; 
          padding: 40px 24px; 
          border-top: 1px solid #f3f4f6; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          font-size: 14px; 
          color: #6b7280; 
        }
        .footer-links { display: flex; gap: 32px; }
        .footer-links a { color: #6b7280; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .footer-links a:hover { color: #111827; }
        
        @media (max-width: 640px) { 
          .landing-footer { 
            flex-direction: column; 
            gap: 24px; 
            text-align: center; 
          } 
        }
      `}</style>
    </div>
  );
}
