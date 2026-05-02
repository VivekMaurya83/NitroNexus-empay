import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, Edit, Trash2, Phone, RefreshCw, Building2, X } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getEmployees, getDepartments, deleteEmployee } from '../../services/employeeService';
import { inviteHR } from '../../services/adminService';
import { AnimatePresence } from 'motion/react';

const STATUS_FILTERS = ['All', 'active', 'inactive', 'terminated'];

export default function HRDirectory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isHR    = user?.role === ROLES.HR;

  const [search,    setSearch]    = useState('');
  const [deptF,     setDeptF]     = useState('');
  const [statusF,   setStatusF]   = useState('All');
  const [emps,      setEmps]      = useState([]);
  const [depts,     setDepts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const [showInviteHR, setShowInviteHR] = useState(false);
  const [hrForm, setHrForm] = useState({ name: '', email: '' });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleInviteHR = async (e) => {
    e.preventDefault();
    setInviting(true); setInviteError('');
    try {
      await inviteHR(hrForm);
      setShowInviteHR(false);
      setHrForm({ name: '', email: '' });
      load();
    } catch (err) {
      setInviteError(err.message || 'Failed to invite HR Officer');
    } finally {
      setInviting(false);
    }
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
      setError(e.message || 'Failed to load employees.');
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 className="page-title">HR Directory</h1>
          <p className="page-subtitle">Manage and view all employee profiles</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button className="btn btn-secondary btn-sm" onClick={load} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} title="Refresh">
            <RefreshCw size={14} />
          </motion.button>
          <Link to="/hr/add-employee" className="btn btn-primary">
            <UserPlus size={16} /> Add Employee
          </Link>
          {isAdmin && (
            <motion.button className="btn btn-secondary" onClick={() => setShowInviteHR(true)} whileHover={{ scale: 1.02 }}>
              <Building2 size={16} /> Invite HR Officer
            </motion.button>
          )}
        </div>
      </div>

      {/* Invite HR Modal */}
      <AnimatePresence>
        {showInviteHR && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInviteHR(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-header">
                <h3 className="modal-title"><Building2 size={16} /> Invite HR Officer</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowInviteHR(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleInviteHR} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>
                  Invite a new HR Officer. They will receive a temporary password via email.
                </p>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={hrForm.name} onChange={e => setHrForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Riya Sharma" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" value={hrForm.email} onChange={e => setHrForm(f => ({ ...f, email: e.target.value }))} placeholder="hr@company.com" required />
                </div>
                {inviteError && <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', padding: '8px 12px', background: 'var(--error-container)', borderRadius: 8 }}>{inviteError}</div>}
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInviteHR(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={inviting}>{inviting ? 'Inviting…' : 'Send Invite'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            <div style={{ marginTop: 10 }}>Loading employees…</div>
          </div>
        ) : (
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
                  {(isAdmin || isHR) && <th>Bank Details</th>}
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emps.map((emp, i) => (
                  <motion.tr key={emp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: emp.photoColor }}>
                          {emp.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.name}</div>
                          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {emp.loginId ? (
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc', background: 'rgba(99,102,241,.1)', padding: '2px 7px', borderRadius: 6 }}>
                          {emp.loginId}
                        </span>
                      ) : <span style={{ color: 'var(--on-surface-variant)' }}>—</span>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{emp.code}</td>
                    <td><span className="badge badge-draft">{emp.employmentType?.replace('_', ' ')}</span></td>
                    <td>
                      {emp.departmentId
                        ? <span className="badge badge-draft">{deptMap[emp.departmentId] || emp.department}</span>
                        : <span style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>—</span>
                      }
                    </td>
                    {(isAdmin || isHR) && (
                      <td style={{ fontSize: 'var(--font-size-sm)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} /> {emp.phone || '—'}
                        </span>
                      </td>
                    )}
                    {(isAdmin || isHR) && (
                      <td>
                        {emp.hasBankDetails
                          ? <span className="badge badge-approved">✓ Complete</span>
                          : <span className="badge badge-rejected" title="No bank details">⚠ Missing</span>
                        }
                      </td>
                    )}
                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{emp.joined}</td>
                    <td><StatusBadge status={emp.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-icon btn-ghost" title="View"><Eye size={14} /></button>
                        {(isAdmin || isHR) && (
                          <button className="btn btn-icon btn-ghost" title="Edit" onClick={() => navigate(`/hr/edit-employee/${emp.id}`)}>
                            <Edit size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-icon btn-ghost" style={{ color: 'var(--error)' }} title="Remove" onClick={() => handleDelete(emp.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && emps.length === 0 && !error && (
          <div className="empty-state">
            <Building2 size={32} style={{ color: 'var(--on-surface-variant)', marginBottom: 8 }} />
            <div className="empty-state-text">No employees found. Add your first employee!</div>
          </div>
        )}
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
