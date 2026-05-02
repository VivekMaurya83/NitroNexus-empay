import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calculator, DollarSign, Check, ChevronRight,
  Mail, User, Shield, Percent, IndianRupee, ArrowRight
} from 'lucide-react';
import { inviteHR, invitePayroll, savePayrollConfig } from '../../services/adminService';

const WIZARD_STEPS = [
  { id: 'hr',      label: 'Invite HR Officer',      icon: Users,      color: '#10b981' },
  { id: 'payroll', label: 'Invite Payroll Officer',  icon: Calculator, color: '#f59e0b' },
  { id: 'rules',   label: 'Set Default Payroll Rules', icon: DollarSign, color: '#6366f1' },
];

// ── Step 1: Invite HR ─────────────────────────────────────────────────────────
function InviteHRStep({ onDone }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invites, setInvites] = useState([]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const invite = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await inviteHR(form);
      setInvites(prev => [...prev, form.email]);
      setForm({ name: '', email: '' });
    } catch (err) {
      setError(err.message || 'Failed to invite HR. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
        Invite at least one <strong>HR Officer</strong>. They will receive an email with a temporary password
        to log in and manage employees, leave, and attendance.
      </p>

      {invites.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {invites.map(em => (
            <div key={em} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(16,185,129,.1)', borderRadius: 8, marginBottom: 6 }}>
              <Check size={14} color="#10b981" />
              <span style={{ fontSize: 'var(--font-size-sm)', color: '#10b981' }}>Invited: {em}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={invite}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <div className="input-icon-wrap">
              <User size={15} className="input-icon" />
              <input name="name" value={form.name} onChange={handle} className="form-input with-icon" placeholder="Riya Sharma" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <div className="input-icon-wrap">
              <Mail size={15} className="input-icon" />
              <input name="email" type="email" value={form.email} onChange={handle} className="form-input with-icon" placeholder="hr@company.com" required />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 8 }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <motion.button type="submit" className="btn btn-secondary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            {loading ? 'Inviting…' : '+ Send Invite'}
          </motion.button>
          {invites.length > 0 && (
            <motion.button type="button" className="btn btn-primary" onClick={onDone} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Continue <ChevronRight size={15} />
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Step 2: Invite Payroll ────────────────────────────────────────────────────
function InvitePayrollStep({ onDone }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const invite = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await invitePayroll(form);
      setDone(true);
      setInvitedEmail(form.email);
    } catch (err) {
      setError(err.message || 'Failed to invite Payroll Officer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
        Invite your <strong>Payroll Officer</strong>. There can only be <strong>one</strong> payroll officer
        per company. They will receive a temporary password by email.
      </p>

      {done ? (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(245,158,11,.1)', borderRadius: 8 }}>
            <Check size={16} color="#f59e0b" />
            <span style={{ color: '#f59e0b', fontWeight: 500 }}>Payroll Officer invited: {invitedEmail}</span>
          </div>
          <motion.button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onDone} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Continue <ChevronRight size={15} />
          </motion.button>
        </div>
      ) : (
        <form onSubmit={invite}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div className="input-icon-wrap">
                <User size={15} className="input-icon" />
                <input name="name" value={form.name} onChange={handle} className="form-input with-icon" placeholder="Amit Joshi" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className="input-icon-wrap">
                <Mail size={15} className="input-icon" />
                <input name="email" type="email" value={form.email} onChange={handle} className="form-input with-icon" placeholder="payroll@company.com" required />
              </div>
            </div>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 8 }}>{error}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button type="submit" className="btn btn-primary" style={{ marginTop: 4 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            {loading ? 'Inviting…' : 'Send Invite'}
          </motion.button>
        </form>
      )}
    </div>
  );
}

// ── Step 3: Default Payroll Rules ─────────────────────────────────────────────
function PayrollRulesStep({ onDone }) {
  const [form, setForm] = useState({
    pf_rate: 0.12,
    pf_ceiling: 15000,
    hra_percent: 0.40,
    conveyance_fixed: 1600,
    medical_fixed: 1250,
    professional_tax: 200,
    tds_rate: 0.0,
    overtime_rate_multiplier: 1.5,
    working_days_per_month: 26,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const handleInt = (e) => setForm(f => ({ ...f, [e.target.name]: parseInt(e.target.value) || 0 }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await savePayrollConfig(form);
      onDone();
    } catch (err) {
      setError(err.message || 'Failed to save payroll rules.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, isInt, hint, suffix }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-icon-wrap">
        <IndianRupee size={14} className="input-icon" />
        <input
          name={name}
          type="number"
          step={isInt ? 1 : 0.01}
          value={form[name]}
          onChange={isInt ? handleInt : handle}
          className="form-input with-icon"
        />
        {suffix && <span className="input-suffix" style={{ pointerEvents: 'none', color: 'var(--on-surface-variant)', paddingRight: 10 }}>{suffix}</span>}
      </div>
      {hint && <div className="form-hint" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );

  return (
    <div>
      <p style={{ color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
        Set the <strong>default payroll rules</strong> for your company. These can be edited later from
        Admin → Payroll Rules.
      </p>

      <form onSubmit={save}>
        <div className="form-row">
          <Field label="PF Rate" name="pf_rate" hint="e.g. 0.12 = 12%" suffix="%" />
          <Field label="PF Ceiling (₹)" name="pf_ceiling" hint="Max basic for PF calc" isInt />
        </div>
        <div className="form-row">
          <Field label="HRA %" name="hra_percent" hint="e.g. 0.40 = 40% of basic" suffix="%" />
          <Field label="Conveyance (₹/mo)" name="conveyance_fixed" isInt />
        </div>
        <div className="form-row">
          <Field label="Medical (₹/mo)" name="medical_fixed" isInt />
          <Field label="Professional Tax (₹/mo)" name="professional_tax" isInt />
        </div>
        <div className="form-row">
          <Field label="TDS Rate" name="tds_rate" hint="e.g. 0.10 = 10%" suffix="%" />
          <Field label="Working Days/Month" name="working_days_per_month" isInt />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 8 }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
          {loading ? 'Saving…' : <><Check size={16} /> Save & Go to Dashboard</>}
        </motion.button>
      </form>
    </div>
  );
}

// ── Main AdminSetup Wizard ────────────────────────────────────────────────────
export default function AdminSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const StepIcon = WIZARD_STEPS[currentStep].icon;
  const stepColor = WIZARD_STEPS[currentStep].color;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* blobs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#6366f1', filter: 'blur(100px)', opacity: 0.08, top: -100, left: -100 }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#10b981', filter: 'blur(80px)', opacity: 0.08, bottom: -50, right: -50 }} />

      <motion.div
        style={{ width: '100%', maxWidth: 640, background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 24, overflow: 'hidden', position: 'relative' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '28px 32px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>First-Time Setup</div>
              <div style={{ fontSize: 13, opacity: .75 }}>Complete these steps to activate your account</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 8 }}>
            {WIZARD_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: i < currentStep ? '#fff' : i === currentStep ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6366f1', flexShrink: 0 }}>
                      {i < currentStep ? <Check size={12} /> : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: i === currentStep ? 600 : 400, opacity: i <= currentStep ? 1 : 0.6 }}>{s.label}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: i <= currentStep ? '#fff' : 'rgba(255,255,255,.25)', transition: 'background .4s' }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Step body */}
        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stepColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StepIcon size={20} color={stepColor} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--on-surface)' }}>{WIZARD_STEPS[currentStep].label}</div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Step {currentStep + 1} of {WIZARD_STEPS.length}</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {currentStep === 0 && <InviteHRStep onDone={next} />}
              {currentStep === 1 && <InvitePayrollStep onDone={next} />}
              {currentStep === 2 && <PayrollRulesStep onDone={next} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
