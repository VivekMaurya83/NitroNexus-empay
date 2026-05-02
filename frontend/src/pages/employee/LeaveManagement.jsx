import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import {
  getLeaveRequests, applyLeave, cancelLeave,
  hrReviewLeave, payrollReviewLeave, getLeaveAllocations, getLeavePolicies,
} from '../../services/leaveService';

const LEAVE_TYPES = ['casual','sick','earned','maternity','paternity','unpaid','comp_off'];
const LABEL = { casual:'Casual',sick:'Sick',earned:'Earned',maternity:'Maternity',paternity:'Paternity',unpaid:'Unpaid',comp_off:'Comp Off' };
const STATUS_FILTERS = ['all','pending','hr_approved','approved','rejected','cancelled'];

export default function LeaveManagement() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin    = role === ROLES.ADMIN;
  const isHR       = role === ROLES.HR;
  const isPayroll  = role === ROLES.PAYROLL;
  const isEmployee = role === ROLES.EMPLOYEE;

  const [leaves,      setLeaves]      = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [statusF,     setStatusF]     = useState('all');
  const [loading,     setLoading]     = useState(true);
  const [showApply,   setShowApply]   = useState(false);
  const [reviewModal, setReviewModal] = useState(null); // { id, action, stage }
  const [remarks,     setRemarks]     = useState('');
  const [form, setForm] = useState({ leaveType:'casual', fromDate:'', toDate:'', reason:'' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLeaveRequests(statusF !== 'all' ? { status: statusF } : {});
      setLeaves(data);
      if (isEmployee && user?.employeeId) {
        const alloc = await getLeaveAllocations(user.employeeId);
        setAllocations(alloc);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusF]);

  // ── Apply leave ─────────────────────────────────────────────────────────────
  const handleApply = async (e) => {
    e.preventDefault();
    await applyLeave({ leaveType: form.leaveType, fromDate: form.fromDate, toDate: form.toDate, reason: form.reason });
    setShowApply(false);
    setForm({ leaveType:'casual', fromDate:'', toDate:'', reason:'' });
    load();
  };

  // ── Cancel (employee own leave) ─────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    await cancelLeave(id);
    load();
  };

  // ── Review modal confirm ────────────────────────────────────────────────────
  const handleReview = async () => {
    if (!reviewModal) return;
    const { id, action, stage } = reviewModal;
    if (stage === 'hr')      await hrReviewLeave(id, action, remarks);
    else                     await payrollReviewLeave(id, action, remarks);
    setReviewModal(null); setRemarks('');
    load();
  };

  // ── Decide which actions to show per row ────────────────────────────────────
  const rowActions = (leave) => {
    const buttons = [];
    if (isEmployee && leave.status === 'pending') {
      buttons.push({ label:'Cancel', variant:'btn-danger', onClick:()=>handleCancel(leave.id) });
    }
    // HR can review pending → hr_approved / rejected
    if ((isAdmin || isHR) && leave.status === 'pending') {
      buttons.push(
        { label:'Approve', variant:'btn-success', onClick:()=>{ setReviewModal({ id:leave.id, action:'approve', stage:'hr' }); setRemarks(''); }},
        { label:'Reject',  variant:'btn-danger',  onClick:()=>{ setReviewModal({ id:leave.id, action:'reject',  stage:'hr' }); setRemarks(''); }},
      );
    }
    // Payroll (or Admin) can confirm hr_approved → approved / rejected
    if ((isAdmin || isPayroll) && leave.status === 'hr_approved') {
      buttons.push(
        { label:'Confirm', variant:'btn-success', onClick:()=>{ setReviewModal({ id:leave.id, action:'approve', stage:'payroll' }); setRemarks(''); }},
        { label:'Reject',  variant:'btn-danger',  onClick:()=>{ setReviewModal({ id:leave.id, action:'reject',  stage:'payroll' }); setRemarks(''); }},
      );
    }
    return buttons;
  };

  const filtered = leaves.filter(l => statusF === 'all' || l.status === statusF);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div><h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{isEmployee ? 'Apply and track your leave requests' : '2-stage approval: HR → Payroll'}</p>
        </div>
        {(isEmployee || isAdmin || isHR) && (
          <motion.button className="btn btn-primary" onClick={()=>setShowApply(true)} whileHover={{ scale:1.02 }}>
            <Plus size={16}/> Apply Leave
          </motion.button>
        )}
      </div>

      {/* Leave Balance Cards — Employee only */}
      {isEmployee && allocations.length > 0 && (
        <div className="stats-grid" style={{ marginBottom:'var(--space-4)' }}>
          {allocations.map((a,i) => (
            <motion.div key={a.id} className="stat-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
              <div className="stat-value" style={{ color:'var(--primary-container)' }}>{a.remaining}</div>
              <div className="stat-label">{a.leaveType || `Policy #${a.policyId}`}</div>
              <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:2 }}>{a.used} used / {a.allocated} total</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payroll workflow notice */}
      {isPayroll && (
        <div className="card card-sm" style={{ background:'#eff6ff', borderColor:'var(--info)', marginBottom:'var(--space-4)' }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', color:'var(--info)' }}>
            <AlertCircle size={16}/>
            <span style={{ fontSize:'var(--font-size-sm)' }}><strong>Your queue:</strong> Only leaves with status <span className="badge badge-hr">HR Approved</span> need your confirmation.</span>
          </div>
        </div>
      )}

      {/* Status Filters */}
      <div className="filter-chips" style={{ marginBottom:'var(--space-4)' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} className={`filter-chip ${statusF===s?'active':''}`} onClick={()=>setStatusF(s)}>
            {s==='all'?'All':s==='hr_approved'?'HR Approved':s.charAt(0).toUpperCase()+s.slice(1)}
            {s!=='all' && <span style={{ marginLeft:5, fontWeight:700 }}>
              ({leaves.filter(l=>l.status===s).length})
            </span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>HR Remarks</th>
                <th>Payroll Remarks</th>
                {!isEmployee && <th>Amendment?</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="loading-state">Loading…</td></tr>}
              {!loading && filtered.map((l,i) => (
                <motion.tr key={l.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}>
                  {!isEmployee && <td style={{ fontWeight:600 }}>{l.employee || `Emp #${l.employeeId}`}</td>}
                  <td><span className="badge badge-draft">{l.type || LABEL[l.leaveType] || l.leaveType}</span></td>
                  <td style={{ fontFamily:'monospace', fontSize:'var(--font-size-sm)' }}>{l.from}</td>
                  <td style={{ fontFamily:'monospace', fontSize:'var(--font-size-sm)' }}>{l.to}</td>
                  <td style={{ textAlign:'center', fontWeight:600 }}>{l.days}</td>
                  <td style={{ maxWidth:160, fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{l.reason || '—'}</td>
                  <td style={{ maxWidth:140, fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{l.hrRemarks || '—'}</td>
                  <td style={{ maxWidth:140, fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{l.payrollRemarks || '—'}</td>
                  {!isEmployee && (
                    <td style={{ textAlign:'center' }}>
                      {l.requiresPayrunAmendment
                        ? <span className="badge badge-warning" title={`Affects payrun #${l.affectsPayrunId}`}>⚠ Amend</span>
                        : <span style={{ color:'var(--on-surface-variant)', fontSize:'var(--font-size-sm)' }}>—</span>}
                    </td>
                  )}
                  <td><StatusBadge status={l.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {rowActions(l).map(btn => (
                        <motion.button key={btn.label} className={`btn btn-sm ${btn.variant}`} onClick={btn.onClick} whileHover={{ scale:1.03 }}>
                          {btn.label}
                        </motion.button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!loading && filtered.length===0 && (
                <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--on-surface-variant)', padding:'var(--space-8)' }}>No leave applications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showApply && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setShowApply(false)}>
            <motion.div className="modal-content" initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }} onClick={e=>e.stopPropagation()} style={{ maxWidth:460 }}>
              <div className="modal-header">
                <h3 className="modal-title">Apply Leave</h3>
                <button className="btn btn-icon btn-ghost" onClick={()=>setShowApply(false)}><X size={18}/></button>
              </div>
              <form onSubmit={handleApply} className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-select" value={form.leaveType} onChange={e=>setForm(f=>({...f, leaveType:e.target.value}))}>
                    {LEAVE_TYPES.map(t=><option key={t} value={t}>{LABEL[t]}</option>)}
                  </select>
                </div>
                <div className="form-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">From Date</label>
                    <input type="date" className="form-input" required value={form.fromDate} onChange={e=>setForm(f=>({...f, fromDate:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date</label>
                    <input type="date" className="form-input" required value={form.toDate} min={form.fromDate} onChange={e=>setForm(f=>({...f, toDate:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea className="form-input" rows={3} placeholder="Optional reason…" value={form.reason} onChange={e=>setForm(f=>({...f, reason:e.target.value}))} style={{ resize:'vertical' }}/>
                </div>
                <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowApply(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setReviewModal(null)}>
            <motion.div className="modal-content" initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }} onClick={e=>e.stopPropagation()} style={{ maxWidth:400 }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {reviewModal.action==='approve' ? <CheckCircle size={18} color="var(--success)"/> : <XCircle size={18} color="var(--error)"/>}
                  {reviewModal.action==='approve' ? 'Approve' : 'Reject'} Leave
                  <span className="badge badge-draft" style={{ marginLeft:4 }}>({reviewModal.stage === 'hr' ? 'HR Review' : 'Payroll Confirm'})</span>
                </h3>
                <button className="btn btn-icon btn-ghost" onClick={()=>setReviewModal(null)}><X size={18}/></button>
              </div>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Remarks (optional)</label>
                  <textarea className="form-input" rows={3} placeholder="Add remarks…" value={remarks} onChange={e=>setRemarks(e.target.value)} style={{ resize:'vertical' }}/>
                </div>
                <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
                  <button className="btn btn-secondary" onClick={()=>setReviewModal(null)}>Cancel</button>
                  <button className={`btn ${reviewModal.action==='approve'?'btn-success':'btn-danger'}`} onClick={handleReview}>
                    Confirm {reviewModal.action==='approve'?'Approval':'Rejection'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
