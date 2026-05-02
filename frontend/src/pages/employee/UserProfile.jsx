import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Save } from 'lucide-react';
import { currentUser } from '../../utils/mockData';

export default function UserProfile() {
  const [form, setForm] = useState({
    firstName: 'Arjun', lastName: 'Sharma', email: currentUser.email,
    phone: '+91 98765 43210', designation: 'Software Engineer',
    employeeCode: 'EMP001', department: 'Engineering', dateOfJoining: '2023-03-15',
  });
  const [saved, setSaved] = useState(false);
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = (e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 3000); };

  return (
    <div>
      <h1 className="page-title">Profile Settings</h1>
      <p className="page-subtitle">Manage your personal information and account details</p>

      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-4)', alignItems: 'start' }}>
          {/* Avatar Card */}
          <motion.div className="card" style={{ textAlign: 'center' }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--space-4)' }}>
              <div className="avatar avatar-xl" style={{ margin: '0 auto', fontSize: 36 }}>{currentUser.avatar}</div>
              <button type="button" style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-container)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Camera size={14} />
              </button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', marginBottom: 4 }}>{form.firstName} {form.lastName}</div>
            <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>{form.designation}</div>
            <div className="divider" />
            <div style={{ textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
              {[
                { label: 'Employee Code', value: form.employeeCode },
                { label: 'Department', value: form.department },
                { label: 'Joined', value: form.dateOfJoining },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--outline-variant)' }}>
                  <span style={{ color: 'var(--on-surface-variant)' }}>{r.label}</span>
                  <span style={{ fontWeight: 500 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <div>
            {/* Personal Info */}
            <motion.div className="card" style={{ marginBottom: 'var(--space-4)' }} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              <div className="form-section-title">Personal Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input name="firstName" value={form.firstName} onChange={handle} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input name="lastName" value={form.lastName} onChange={handle} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handle} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input name="phone" value={form.phone} onChange={handle} className="form-input" />
              </div>
            </motion.div>

            {/* Work Info (read-only) */}
            <motion.div className="card" style={{ marginBottom: 'var(--space-4)' }} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="form-section-title">Work Information (Read Only)</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input value={form.designation} className="form-input" readOnly style={{ background: 'var(--surface-container)', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input value={form.department} className="form-input" readOnly style={{ background: 'var(--surface-container)', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Employee Code</label>
                  <input value={form.employeeCode} className="form-input" readOnly style={{ background: 'var(--surface-container)', cursor: 'not-allowed', fontFamily: 'monospace' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Joining</label>
                  <input value={form.dateOfJoining} type="date" className="form-input" readOnly style={{ background: 'var(--surface-container)', cursor: 'not-allowed' }} />
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="button" className="btn btn-secondary">Cancel</button>
              <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ background: saved ? 'var(--success)' : undefined }}>
                <Save size={16} /> {saved ? 'Saved!' : 'Save Changes'}
              </motion.button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
