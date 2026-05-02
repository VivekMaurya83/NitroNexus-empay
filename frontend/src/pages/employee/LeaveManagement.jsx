import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { leaveRequests, leaveTypes, leaveAllocations } from '../../utils/mockData';

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('requests');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Apply for leave, track balances, and manage approvals</p>
        </div>
        <motion.button className="btn btn-primary" onClick={() => setShowModal(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Plus size={16} /> Apply Leave
        </motion.button>
      </div>

      {/* Leave Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {leaveAllocations.slice(0, 3).map((alloc, i) => {
          const remaining = alloc.allocated - alloc.used;
          const pct = Math.round((alloc.used / alloc.allocated) * 100);
          return (
            <motion.div key={alloc.id} className="card card-sm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{alloc.leaveType}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{alloc.year}</div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 10 }}>
                <div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-container)' }}>{remaining}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>Remaining</div></div>
                <div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--on-surface-variant)' }}>{alloc.used}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>Used</div></div>
                <div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--on-surface)' }}>{alloc.allocated}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>Total</div></div>
              </div>
              <div style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-full)', height: 6, overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', background: pct > 80 ? 'var(--error)' : 'var(--primary-container)', borderRadius: 'var(--radius-full)' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['requests', 'history'].map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize' }}>
            {t === 'requests' ? 'My Requests' : 'History'}
          </button>
        ))}
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {leaveRequests.map((lr, i) => (
                <motion.tr key={lr.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td style={{ fontWeight: 500 }}>{lr.type}</td>
                  <td>{lr.from}</td>
                  <td>{lr.to}</td>
                  <td><span className="badge badge-draft">{lr.days}d</span></td>
                  <td style={{ color: 'var(--on-surface-variant)', maxWidth: 200 }}>{lr.reason}</td>
                  <td><StatusBadge status={lr.status} /></td>
                  <td>
                    {lr.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-success" title="Approve"><CheckCircle size={14} /></button>
                        <button className="btn btn-sm btn-danger" title="Reject"><XCircle size={14} /></button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--font-size-lg)' }}>Apply for Leave</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Leave Type *</label>
                  <select name="leaveTypeId" value={form.leaveTypeId} onChange={handle} className="form-select">
                    <option value="">Select leave type</option>
                    {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} {lt.isPaid ? '(Paid)' : '(Unpaid)'}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">From Date *</label>
                    <input name="fromDate" type="date" value={form.fromDate} onChange={handle} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date *</label>
                    <input name="toDate" type="date" value={form.toDate} onChange={handle} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea name="reason" value={form.reason} onChange={handle} className="form-textarea" placeholder="Brief reason for leave..." rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <motion.button className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal(false)}>
                  Submit Request
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
