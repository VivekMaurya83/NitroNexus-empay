import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { getDepartments, createDepartment } from '../../services/employeeService';
import api from '../../services/api';

// We'll add a deleteDepartment service or use api directly
const deleteDepartment = (id) => api.delete(`/employees/departments/${id}`);
const getLeaveTypes = () => api.get('/leaves/types');
const createLeaveType = (data) => api.post('/leaves/policies', data);
const deleteLeaveType = (id) => api.delete(`/leaves/policies/${id}`);

export default function AdminConfigurations() {
  const [activeTab, setActiveTab] = useState('departments');
  const [depts, setDepts] = useState([]);
  const [leaveTypesState, setLeaveTypesState] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: '', description: '', manager_name: '', headcount: '' });
  const [ltForm, setLtForm] = useState({ leave_type: '', is_paid: true, max_days_per_year: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [d, lData] = await Promise.all([getDepartments(), getLeaveTypes()]);
      setDepts(d || []);
      setLeaveTypesState(lData.policies || []);
      setAvailableTypes(lData.available_types || []);
      if (lData.available_types?.length > 0) {
        setLtForm(f => ({ ...f, leave_type: lData.available_types[0] }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const addDept = async (e) => {
    e.preventDefault();
    try {
      await createDepartment({
        ...deptForm,
        headcount: deptForm.headcount ? parseInt(deptForm.headcount) : null
      });
      setDeptForm({ name: '', description: '', manager_name: '', headcount: '' });
      load();
    } catch (err) { alert(err.message); }
  };

  const removeDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await deleteDepartment(id);
      load();
    } catch (err) { alert(err.message); }
  };

  const addLt = async (e) => {
    e.preventDefault();
    try {
      await createLeaveType(ltForm);
      setLtForm(f => ({ ...f, is_paid: true, max_days_per_year: 10 }));
      load();
    } catch (err) { alert(err.message); }
  };

  const removeLt = async (id) => {
    if (!window.confirm('Delete this leave type?')) return;
    try {
      await deleteLeaveType(id);
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <h1 className="page-title">Configurations</h1>
      <p className="page-subtitle">Manage departments, leave types and system settings</p>

      <div className="tabs">
        {[['departments', 'Departments'], ['leaveTypes', 'Leave Types']].map(([key, label]) => (
          <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
        {loading && <RefreshCw size={16} className="spin" style={{ marginLeft: 12, color: 'var(--primary-container)' }} />}
      </div>

      {error && <div style={{ color: 'var(--error)', padding: 12, background: 'var(--error-container)', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

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
                    <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({...f, description: e.target.value}))} className="form-textarea" placeholder="Brief description..." rows={2} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manager Name</label>
                    <input value={deptForm.manager_name} onChange={e => setDeptForm(f => ({...f, manager_name: e.target.value}))} className="form-input" placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Planned Headcount</label>
                    <input type="number" value={deptForm.headcount} onChange={e => setDeptForm(f => ({...f, headcount: e.target.value}))} className="form-input" placeholder="e.g. 10" />
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
                    <thead><tr><th>Name</th><th>Manager</th><th>H.C.</th><th>Employees</th><th></th></tr></thead>
                    <tbody>
                      {depts.map((d, i) => (
                        <motion.tr key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{d.name}</div>
                            <div style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>{d.description}</div>
                          </td>
                          <td style={{ fontSize: 'var(--font-size-sm)' }}>{d.manager_name || '—'}</td>
                          <td><span style={{ fontSize: 'var(--font-size-sm)' }}>{d.headcount || '—'}</span></td>
                          <td><span className="badge badge-draft">{d.headcount_actual || 0}</span></td>
                          <td><button className="btn btn-icon btn-ghost" style={{ color: 'var(--error)' }} onClick={() => removeDept(d.id)}><Trash2 size={14} /></button></td>
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
                    <label className="form-label">Leave Type *</label>
                    <select value={ltForm.leave_type} onChange={e => setLtForm(f => ({...f, leave_type: e.target.value}))} className="form-select" required>
                      {availableTypes.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Days Per Year *</label>
                    <input type="number" value={ltForm.max_days_per_year} onChange={e => setLtForm(f => ({...f, max_days_per_year: +e.target.value}))} className="form-input" min={1} max={365} />
                  </div>
                  <div className="form-group">
                    <div className="toggle-wrapper">
                      <label className="toggle">
                        <input type="checkbox" checked={ltForm.is_paid} onChange={e => setLtForm(f => ({...f, is_paid: e.target.checked}))} />
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
                          <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{lt.leave_type}</td>
                          <td><span className="badge badge-draft">{lt.max_days_per_year} days</span></td>
                          <td><span className={`badge ${lt.is_paid ? 'badge-paid' : 'badge-draft'}`}>{lt.is_paid ? '✅ Paid' : '○ Unpaid'}</span></td>
                          <td><button className="btn btn-icon btn-ghost" style={{ color: 'var(--error)' }} onClick={() => removeLt(lt.id)}><Trash2 size={14} /></button></td>
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
