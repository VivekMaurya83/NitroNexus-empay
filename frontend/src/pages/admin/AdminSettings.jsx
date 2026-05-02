import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES } from '../../context/AuthContext';
import { getEmployees } from '../../services/employeeService';

const ROLE_OPTIONS = [
  { value: ROLES.EMPLOYEE,  label: 'Employee' },
  { value: ROLES.HR,        label: 'HR Officer' },
  { value: ROLES.PAYROLL,   label: 'Payroll Officer' },
  { value: ROLES.ADMIN,     label: 'Admin' },
];

export default function AdminSettings() {
  const [editRoles, setEditRoles] = useState({});
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="page-title">Settings & Role Management</h1>
      <p className="page-subtitle">Manage user roles and system access permissions</p>

      {/* Role Legend */}
      <motion.div className="card card-sm" style={{ marginBottom: 'var(--space-4)' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Role Permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-3)' }}>
          {[
            { role: 'Admin', perms: ['All Modules', 'Full CRUD', 'Settings', 'Reports'], color: 'var(--primary-container)' },
            { role: 'HR Officer', perms: ['Employee Profiles', 'Attendance', 'Leave Allocation'], color: 'var(--info)' },
            { role: 'Payroll Officer', perms: ['Payroll', 'Salary Structure', 'Leave Approval', 'Reports'], color: 'var(--success)' },
            { role: 'Employee', perms: ['Own Attendance', 'Apply Leave', 'View Directory', 'Own Payslip'], color: 'var(--warning)' },
          ].map(r => (
            <div key={r.role} style={{ padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${r.color}` }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)', color: r.color }}>{r.role}</div>
              {r.perms.map(p => <div key={p} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', marginBottom: 2 }}>✓ {p}</div>)}
            </div>
          ))}
        </div>
      </motion.div>

      {/* User Role Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="card-header">
          <div className="card-title">User Role Management</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{employees.length} users</div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Employee</th><th>Email</th><th>Current Role</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {employees.map((emp, i) => {
                const roleVal = editRoles[emp.id] ?? emp.role;
                return (
                  <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{emp.name.split(' ').map(n=>n[0]).join('')}</div>
                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)' }}>{emp.email}</td>
                    <td>
                      <select
                        value={roleVal}
                        onChange={e => setEditRoles(r => ({ ...r, [emp.id]: e.target.value }))}
                        className="form-select"
                        style={{ width: 160, padding: '5px 10px', fontSize: 'var(--font-size-sm)' }}
                      >
                        {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td><span className="badge badge-draft">{emp.department}</span></td>
                    <td><StatusBadge status={emp.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {editRoles[emp.id] && editRoles[emp.id] !== emp.role && (
                          <motion.button className="btn btn-sm btn-success" whileHover={{ scale: 1.05 }} onClick={() => setEditRoles(r => { const n = {...r}; delete n[emp.id]; return n; })}>
                            <Save size={12} /> Save
                          </motion.button>
                        )}
                        <button className="btn btn-sm btn-danger btn-icon" title="Deactivate"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
