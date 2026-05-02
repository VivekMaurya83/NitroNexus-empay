import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { leaveAllocations, employees, leaveTypes } from '../../utils/mockData';
import PremiumHeader from '../../components/ui/PremiumHeader';

export default function LeaveAllocation() {
  const [allocations, setAllocations] = useState(leaveAllocations);
  const [form, setForm] = useState({ employeeId: '', leaveTypeId: '', year: '2026', allocatedDays: '' });
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === form.employeeId);
    const lt = leaveTypes.find(x => x.id === form.leaveTypeId);
    if (!emp || !lt) return;
    setAllocations(a => [...a, {
      id: `la_${Date.now()}`, employee: emp.name, leaveType: lt.name,
      year: +form.year, allocated: +form.allocatedDays, used: 0
    }]);
    setForm({ employeeId: '', leaveTypeId: '', year: '2026', allocatedDays: '' });
  };

  return (
    <div>
      <PremiumHeader title="Leave Allocation" subtitle="Allocate annual leave balances to employees" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
        {/* Form */}
        <motion.div className="card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Allocate Leave</div>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select name="employeeId" value={form.employeeId} onChange={handle} className="form-select" required>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              <select name="leaveTypeId" value={form.leaveTypeId} onChange={handle} className="form-select" required>
                <option value="">Select leave type</option>
                {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year *</label>
                <select name="year" value={form.year} onChange={handle} className="form-select">
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Allocated Days *</label>
                <input name="allocatedDays" type="number" min={1} max={365} value={form.allocatedDays} onChange={handle} className="form-input" placeholder="15" required />
              </div>
            </div>
            <motion.button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Plus size={16} /> Allocate Leave
            </motion.button>
          </form>
        </motion.div>

        {/* Allocation Table */}
        <motion.div className="card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card-header">
            <div className="card-title">Current Allocations</div>
            <span className="badge badge-draft">{allocations.length} records</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Year</th>
                  <th>Allocated</th>
                  <th>Used</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a, i) => {
                  const rem = a.allocated - a.used;
                  return (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <td style={{ fontWeight: 600 }}>{a.employee}</td>
                      <td style={{ color: 'var(--on-surface-variant)' }}>{a.leaveType}</td>
                      <td>{a.year}</td>
                      <td><span className="badge badge-draft">{a.allocated}d</span></td>
                      <td style={{ color: 'var(--warning)', fontWeight: 500 }}>{a.used}d</td>
                      <td>
                        <span className={`badge ${rem <= 2 ? 'badge-rejected' : rem <= 5 ? 'badge-warning' : 'badge-approved'}`}>{rem}d</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
