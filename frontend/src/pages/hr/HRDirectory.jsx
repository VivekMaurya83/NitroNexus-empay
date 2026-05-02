import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, Edit, Trash2, Phone, RefreshCw, Building2, X, Users, FolderTree, Plus } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getEmployees, getDepartments, deleteEmployee } from '../../services/employeeService';
import { AnimatePresence } from 'motion/react';
import StatCard from '../../components/ui/StatCard';
import PremiumHeader from '../../components/ui/PremiumHeader';

const STATUS_FILTERS = ['All', 'active', 'inactive', 'terminated'];

export default function HRDirectory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isHR    = user?.role === ROLES.HR;

  const [activeTab, setActiveTab] = useState('employees');
  const [search,    setSearch]    = useState('');
  const [deptF,     setDeptF]     = useState('');
  const [statusF,   setStatusF]   = useState('All');
  const [emps,      setEmps]      = useState([]);
  const [depts,     setDepts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Department Form State
  const [deptForm, setDeptForm] = useState({ name: '', description: '', manager_name: '', headcount: '' });
  const [deptLoading, setDeptLoading] = useState(false);

  const deleteDepartment = (id) => api.delete(`/employees/departments/${id}`);
  const createDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees/departments/', {
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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [empData, deptData] = await Promise.all([
        getEmployees({ search, status: statusF === 'All' ? '' : statusF, departmentId: deptF }),
        getDepartments(),
      ]);
      setEmps(empData);
      setDepts(deptData || []);
    } catch (e) {
      setError(e.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [search, statusF, deptF]);

  useEffect(() => { load(); }, [load]);
  
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
    try {
      await deleteEmployee(id);
      setEmps(emps => emps.filter(e => e.id !== id));
    } catch (err) {
      alert("Failed to delete employee: " + err.message);
    }
  };

  // Map dept id → name for fast lookup
  const deptMap = Object.fromEntries((depts || []).map(d => [d.id, d.name]));

  return (
    <div>
      <PremiumHeader
        title={activeTab === 'employees' ? 'HR Directory' : 'Department Management'}
        subtitle={activeTab === 'employees' ? 'Manage and view all employee profiles' : 'Manage organizational departments and structures'}
        actionRight={
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={load} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <RefreshCw size={14} />
            </motion.button>
            {activeTab === 'employees' && (
              <Link to="/hr/add-employee" className="btn" style={{ background: '#fff', color: 'var(--primary)' }}>
                <UserPlus size={16} /> Add Employee
              </Link>
            )}
          </div>
        }
      />

      {/* Workforce summary stat cards */}
      {!loading && activeTab === 'employees' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard icon={Users} label="Total Employees" value={emps.length} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" delay={0} />
          <StatCard icon={Building2} label="Active" value={emps.filter(e => e.status === 'active').length} gradient="linear-gradient(135deg, #10b981, #059669)" delay={0.07} />
          <StatCard icon={FolderTree} label="Departments" value={depts.length} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" delay={0.14} />
          <StatCard icon={Users} label="Inactive / Terminated" value={emps.filter(e => e.status !== 'active').length} gradient="linear-gradient(135deg, #f59e0b, #d97706)" delay={0.21} />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-4)' }}>
        <button className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
          <Users size={14} /> Employees
        </button>
        <button className={`tab-btn ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')}>
          <FolderTree size={14} /> Departments
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'employees' ? (
          <motion.div key="employees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 10 }}>
              <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
                <Search size={15} className="search-icon" />
                <input
                  className="form-input search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email, login ID, code…"
                />
              </div>

              <div className="filter-chips">
                {STATUS_FILTERS.map(s => (
                  <button key={s} className={`filter-chip ${statusF === s ? 'active' : ''}`} onClick={() => setStatusF(s)}>
                    {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <select
                className="form-select"
                style={{ width: 180, padding: '7px 12px', fontSize: 'var(--font-size-sm)' }}
                value={deptF}
                onChange={e => setDeptF(e.target.value)}
              >
                <option value="">All Departments</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <span className="badge badge-present">{emps.length} employees</span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ color: 'var(--error)', padding: '10px 14px', background: 'var(--error-container)', borderRadius: 8, marginBottom: 16, fontSize: 'var(--font-size-sm)' }}>
                {error}
              </div>
            )}

            {/* Table */}
            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Login ID</th>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Department</th>
                      {(isAdmin || isHR) && <th>Phone</th>}
                      {(isAdmin || isHR) && <th>Bank</th>}
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={9} className="loading-state">Loading...</td></tr> : emps.map((emp, i) => (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm" style={{ background: emp.photoColor }}>{emp.avatar}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{emp.name}</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-draft" style={{ fontFamily: 'monospace' }}>{emp.loginId || '—'}</span></td>
                        <td style={{ fontSize: 'var(--font-size-sm)' }}>{emp.code}</td>
                        <td><span className="badge badge-draft">{emp.employmentType?.replace('_', ' ')}</span></td>
                        <td><span className="badge badge-draft">{deptMap[emp.departmentId] || emp.department || '—'}</span></td>
                        {(isAdmin || isHR) && <td style={{ fontSize: 12 }}>{emp.phone || '—'}</td>}
                        {(isAdmin || isHR) && <td>{emp.hasBankDetails ? '✅' : '❌'}</td>}
                        <td><StatusBadge status={emp.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-icon btn-ghost btn-sm" title="View"><Eye size={14} /></button>
                            {(isAdmin || isHR) && (
                              <button className="btn btn-icon btn-ghost btn-sm" title="Edit" onClick={() => navigate(`/hr/edit-employee/${emp.id}`)}>
                                <Edit size={14} />
                              </button>
                            )}
                            {isAdmin && (
                              <button className="btn btn-icon btn-ghost btn-sm" style={{ color: 'var(--error)' }} title="Remove" onClick={() => handleDelete(emp.id)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="departments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 'var(--space-4)' }}>
              {/* Add Form */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Department</div>
                <form onSubmit={createDept}>
                  <div className="form-group">
                    <label className="form-label">Department Name *</label>
                    <input value={deptForm.name} onChange={e => setDeptForm(f => ({...f, name: e.target.value}))} className="form-input" placeholder="e.g. Marketing" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({...f, description: e.target.value}))} className="form-input" placeholder="Brief description..." rows={2} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manager Name</label>
                    <input value={deptForm.manager_name} onChange={e => setDeptForm(f => ({...f, manager_name: e.target.value}))} className="form-input" placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Planned Headcount</label>
                    <input type="number" value={deptForm.headcount} onChange={e => setDeptForm(f => ({...f, headcount: e.target.value}))} className="form-input" placeholder="e.g. 10" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Plus size={16} /> Create Department
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">{depts.length} Departments</div>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Department</th><th>Manager</th><th>Headcount</th><th>Actions</th></tr></thead>
                    <tbody>
                      {depts.map(d => (
                        <tr key={d.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{d.name}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>{d.description}</div>
                          </td>
                          <td style={{ fontSize: 'var(--font-size-sm)' }}>{d.manager_name || '—'}</td>
                          <td>
                            <div style={{ fontSize: 'var(--font-size-xs)' }}>
                              <span style={{ fontWeight: 600 }}>{d.headcount_actual || 0}</span> / {d.headcount || '∞'}
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-icon btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => removeDept(d.id)}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
