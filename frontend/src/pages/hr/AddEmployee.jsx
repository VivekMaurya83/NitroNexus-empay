import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ChevronLeft, Check, Mail, User, Building2, Calendar, Briefcase } from 'lucide-react';
import { getDepartments } from '../../services/employeeService';
import { inviteEmployee } from '../../services/adminService';

const EMPLOYMENT_TYPES = [
  { value: 'full_time',  label: 'Full Time' },
  { value: 'part_time',  label: 'Part Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'intern',     label: 'Intern' },
];

export default function AddEmployee() {
  const navigate = useNavigate();
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_of_joining: '',
    date_of_birth: '',
    department_id: '',
    employment_type: 'full_time',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { login_id, email }

  useEffect(() => {
    getDepartments().then(data => setDepts(data || [])).catch(() => {});
  }, []);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        department_id: form.department_id ? parseInt(form.department_id) : null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone || null,
      };
      const result = await inviteEmployee(payload);
      setSuccess({ login_id: result?.login_id || result?.data?.login_id, email: form.email });
    } catch (err) {
      setError(err.message || 'Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hr-directory')}>
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Add New Employee</h1>
        </div>
        <motion.div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 40, textAlign: 'center' }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={28} color="#10b981" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Employee Created!</h2>
          <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: 24 }}>
            A welcome email with login credentials has been sent to <strong>{success.email}</strong>.
          </p>
          {success.login_id && (
            <div style={{ background: 'var(--surface-container-high)', borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Employee Login ID</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#a5b4fc', letterSpacing: 2 }}>{success.login_id}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => { setSuccess(null); setForm({ first_name: '', last_name: '', email: '', date_of_joining: '', date_of_birth: '', department_id: '', employment_type: 'full_time', phone: '' }); }}>
              Add Another
            </button>
            <Link to="/hr-directory" className="btn btn-primary">
              View Directory
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hr-directory')}>
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Add New Employee</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            A Login ID will be auto-generated and credentials emailed to the employee
          </p>
        </div>
      </div>

      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

          {/* Personal Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><User size={15} style={{ display: 'inline', marginRight: 8 }} />Personal Information</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handle} className="form-input" placeholder="John" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handle} className="form-input" placeholder="Doe" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div className="input-icon-wrap">
                <Mail size={15} className="input-icon" />
                <input name="email" type="email" value={form.email} onChange={handle} className="form-input with-icon" placeholder="john.doe@company.com" required />
              </div>
              <div className="form-hint" style={{ marginTop: 4 }}>Login credentials will be sent to this email</div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handle} className="form-input" placeholder="+91 98765 43210" />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <div className="input-icon-wrap">
                <Calendar size={15} className="input-icon" />
                <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handle} className="form-input with-icon" />
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Briefcase size={15} style={{ display: 'inline', marginRight: 8 }} />Employment Details</div>
            </div>

            <div className="form-group">
              <label className="form-label">Date of Joining *</label>
              <div className="input-icon-wrap">
                <Calendar size={15} className="input-icon" />
                <input name="date_of_joining" type="date" value={form.date_of_joining} onChange={handle} className="form-input with-icon" required />
              </div>
              <div className="form-hint" style={{ marginTop: 4 }}>Used to generate Employee Login ID</div>
            </div>

            <div className="form-group">
              <label className="form-label">Type of Employee *</label>
              <select name="employment_type" value={form.employment_type} onChange={handle} className="form-select">
                {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400 }}>(optional)</span></label>
              <div className="input-icon-wrap">
                <Building2 size={15} className="input-icon" />
                <select name="department_id" value={form.department_id} onChange={handle} className="form-select with-icon" style={{ paddingLeft: 36 }}>
                  <option value="">No Department</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {/* Login ID preview */}
            {form.first_name && form.last_name && form.date_of_joining && (
              <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#a5b4fc', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Login ID Preview</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#a5b4fc', letterSpacing: 1 }}>
                  ??{form.first_name.substring(0, 2).toUpperCase()}{form.last_name.substring(0, 2).toUpperCase()}{form.date_of_joining.substring(0, 4)}????
                </div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                  Company code + Name initials + Year + Serial (auto-assigned)
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 12 }}>
              <div style={{ color: 'var(--error)', padding: '10px 14px', background: 'var(--error-container)', borderRadius: 8, fontSize: 'var(--font-size-sm)' }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/hr-directory')}>Cancel</button>
          <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            <UserPlus size={16} /> {loading ? 'Creating…' : 'Create Employee & Send Email'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
