import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ChevronLeft } from 'lucide-react';
import { departments } from '../../utils/mockData';

export default function AddEmployee() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'employee',
    departmentId: '', designation: '', employeeCode: '', dateOfJoining: '', phone: ''
  });
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = (e) => { e.preventDefault(); navigate('/hr-directory'); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hr-directory')}><ChevronLeft size={16} /> Back</button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Add New Employee</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Create a new employee account and profile</p>
        </div>
      </div>

      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {/* User Account */}
          <div className="card">
            <div className="card-header"><div className="card-title">User Account</div></div>
            <div className="form-section-title">Authentication Details</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input name="firstName" value={form.firstName} onChange={handle} className="form-input" placeholder="Priya" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={handle} className="form-input" placeholder="Mehta" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handle} className="form-input" placeholder="priya@company.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input name="password" type="password" value={form.password} onChange={handle} className="form-input" placeholder="Min 8 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select name="role" value={form.role} onChange={handle} className="form-select">
                <option value="employee">Employee</option>
                <option value="hr_officer">HR Officer</option>
                <option value="payroll_officer">Payroll Officer</option>
                <option value="admin">Admin</option>
              </select>
              <div className="form-hint">Determines what the user can access in the system.</div>
            </div>
          </div>

          {/* Employee Profile */}
          <div className="card">
            <div className="card-header"><div className="card-title">Employee Profile</div></div>
            <div className="form-section-title">HR Information</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee Code *</label>
                <input name="employeeCode" value={form.employeeCode} onChange={handle} className="form-input" placeholder="EMP009" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input name="phone" value={form.phone} onChange={handle} className="form-input" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input name="designation" value={form.designation} onChange={handle} className="form-input" placeholder="Software Engineer" required />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select name="departmentId" value={form.departmentId} onChange={handle} className="form-select" required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Joining *</label>
              <input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handle} className="form-input" required />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/hr-directory')}>Cancel</button>
          <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <UserPlus size={16} /> Create Employee
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
