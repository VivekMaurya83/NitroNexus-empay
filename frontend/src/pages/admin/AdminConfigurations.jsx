import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, X } from 'lucide-react';
import { departments, leaveTypes as initialLeaveTypes } from '../../utils/mockData';

export default function AdminConfigurations() {
  const [activeTab, setActiveTab] = useState('departments');
  const [depts, setDepts] = useState(departments);
  const [leaveTypesState, setLeaveTypesState] = useState(initialLeaveTypes);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [ltForm, setLtForm] = useState({ name: '', isPaid: true, maxDaysPerYear: 10 });

  const addDept = (e) => {
    e.preventDefault();
    setDepts(d => [...d, { id: `dep_${Date.now()}`, ...deptForm, count: 0 }]);
    setDeptForm({ name: '', description: '' });
  };

  const addLt = (e) => {
    e.preventDefault();
    setLeaveTypesState(l => [...l, { id: `lt_${Date.now()}`, ...ltForm }]);
    setLtForm({ name: '', isPaid: true, maxDaysPerYear: 10 });
  };

  return (
    <div>
      <h1 className="page-title">Configurations</h1>
      <p className="page-subtitle">Manage departments, leave types and system settings</p>

      <div className="tabs">
        {[['departments', 'Departments'], ['leaveTypes', 'Leave Types']].map(([key, label]) => (
          <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'departments' && (
          <motion.div key="deps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
              {/* Add Form */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Department</div>
                <form onSubmit={addDept}>
                  <div className="form-group">
                    <label className="form-label">Department Name *</label>
                    <input value={deptForm.name} onChange={e => setDeptForm(f => ({...f, name: e.target.value}))} className="form-input" placeholder="e.g. Marketing" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({...f, description: e.target.value}))} className="form-textarea" placeholder="Brief description..." rows={3} />
                  </div>
                  <motion.button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} whileHover={{ scale: 1.02 }}>
                    <Plus size={16} /> Add Department
                  </motion.button>
                </form>
              </div>

              {/* List */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>{depts.length} Departments</div>
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Description</th><th>Employees</th><th></th></tr></thead>
                    <tbody>
                      {depts.map((d, i) => (
                        <motion.tr key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <td style={{ fontWeight: 600 }}>{d.name}</td>
                          <td style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)' }}>{d.description}</td>
                          <td><span className="badge badge-draft">{d.count}</span></td>
                          <td><button className="btn btn-icon btn-ghost" style={{ color: 'var(--error)' }} onClick={() => setDepts(dep => dep.filter(x => x.id !== d.id))}><Trash2 size={14} /></button></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'leaveTypes' && (
          <motion.div key="lts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
              {/* Add Form */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Leave Type</div>
                <form onSubmit={addLt}>
                  <div className="form-group">
                    <label className="form-label">Leave Type Name *</label>
                    <input value={ltForm.name} onChange={e => setLtForm(f => ({...f, name: e.target.value}))} className="form-input" placeholder="e.g. Sick Leave" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Days Per Year *</label>
                    <input type="number" value={ltForm.maxDaysPerYear} onChange={e => setLtForm(f => ({...f, maxDaysPerYear: +e.target.value}))} className="form-input" min={1} max={365} />
                  </div>
                  <div className="form-group">
                    <div className="toggle-wrapper">
                      <label className="toggle">
                        <input type="checkbox" checked={ltForm.isPaid} onChange={e => setLtForm(f => ({...f, isPaid: e.target.checked}))} />
                        <span className="toggle-slider" />
                      </label>
                      <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>Paid Leave</span>
                    </div>
                  </div>
                  <motion.button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} whileHover={{ scale: 1.02 }}>
                    <Plus size={16} /> Add Leave Type
                  </motion.button>
                </form>
              </div>

              {/* List */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>{leaveTypesState.length} Leave Types</div>
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Max Days/Year</th><th>Paid</th><th></th></tr></thead>
                    <tbody>
                      {leaveTypesState.map((lt, i) => (
                        <motion.tr key={lt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                          <td style={{ fontWeight: 600 }}>{lt.name}</td>
                          <td><span className="badge badge-draft">{lt.maxDaysPerYear} days</span></td>
                          <td><span className={`badge ${lt.isPaid ? 'badge-paid' : 'badge-draft'}`}>{lt.isPaid ? '✅ Paid' : '○ Unpaid'}</span></td>
                          <td><button className="btn btn-icon btn-ghost" style={{ color: 'var(--error)' }} onClick={() => setLeaveTypesState(l => l.filter(x => x.id !== lt.id))}><Trash2 size={14} /></button></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
