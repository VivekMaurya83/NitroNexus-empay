import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/mockData';
import { getLeaveRequests, applyLeave, updateLeaveStatus, getLeaveAllocations, getLeaveTypes } from '../../services/leaveService';

const TYPE_FILTERS   = ['All', 'Annual Leave', 'Sick Leave', 'Casual Leave'];
const STATUS_FILTERS = ['All', 'pending', 'approved', 'rejected'];

export default function LeaveManagement() {
  const { user } = useAuth();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const canApprove = [ROLES.ADMIN, ROLES.HR, ROLES.PAYROLL].includes(user?.role);

  const [requests,    setRequests]    = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [leaveTypes,  setLeaveTypes]  = useState([]);
  const [statusF,     setStatusF]     = useState('All');
  const [typeF,       setTypeF]       = useState('All');
  const [showModal,   setShowModal]   = useState(false);
  const [override,    setOverride]    = useState(null); // id of request being overridden
  const [form,        setForm]        = useState({ leaveTypeId:'', fromDate:'', toDate:'', reason:'' });

  useEffect(() => {
    const filters = isEmployee ? { employeeId: user.id } : {};
    getLeaveRequests(filters).then(setRequests);
    getLeaveAllocations(isEmployee ? { employeeId: user.id } : {}).then(setAllocations);
    getLeaveTypes().then(setLeaveTypes);
  }, [isEmployee, user?.id]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submitLeave = async (e) => {
    e.preventDefault();
    const lt = leaveTypes.find(l => l.id === form.leaveTypeId);
    const newReq = await applyLeave({ ...form, employee: user.name, employeeId: user.id, type: lt?.name, status:'pending', days: 1 });
    setRequests(r => [{ ...newReq, employee: user.name }, ...r]);
    setShowModal(false);
    setForm({ leaveTypeId:'', fromDate:'', toDate:'', reason:'' });
  };

  const changeStatus = async (id, status) => {
    await updateLeaveStatus(id, status, user.name);
    setRequests(r => r.map(x => x.id === id ? { ...x, status, approvedBy: user.name } : x));
    setOverride(null);
  };

  const filtered = requests.filter(r => {
    const matchStatus = statusF === 'All' || r.status === statusF;
    const matchType   = typeF   === 'All' || r.type   === typeF;
    return matchStatus && matchType;
  });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div>
          <h1 className="page-title">{isEmployee ? 'My Leave' : 'Leave Management'}</h1>
          <p className="page-subtitle">{isEmployee ? 'Apply for leave and track your requests' : 'Review and action all employee leave requests'}</p>
        </div>
        {isEmployee && (
          <motion.button className="btn btn-primary" onClick={() => setShowModal(true)} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
            <Plus size={16}/> Apply Leave
          </motion.button>
        )}
      </div>

      {/* Leave balances (employee and managers can see) */}
      {allocations.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'var(--space-3)', marginBottom:'var(--space-5)' }}>
          {allocations.slice(0,4).map((a, i) => {
            const rem = a.allocated - a.used;
            const pct = Math.round((a.used / a.allocated) * 100);
            return (
              <motion.div key={a.id} className="card card-sm" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
                <div style={{ fontWeight:600, fontSize:'var(--font-size-sm)', marginBottom:6 }}>{a.leaveType}</div>
                <div style={{ display:'flex', gap:'var(--space-3)', marginBottom:8 }}>
                  <div><div style={{ fontSize:24, fontWeight:800, color:rem<=2?'var(--error)':'var(--primary-container)' }}>{rem}</div><div style={{ fontSize:11, color:'var(--on-surface-variant)' }}>Left</div></div>
                  <div><div style={{ fontSize:24, fontWeight:800, color:'var(--on-surface-variant)' }}>{a.used}</div><div style={{ fontSize:11, color:'var(--on-surface-variant)' }}>Used</div></div>
                  <div><div style={{ fontSize:24, fontWeight:800 }}>{a.allocated}</div><div style={{ fontSize:11, color:'var(--on-surface-variant)' }}>Total</div></div>
                </div>
                <div style={{ background:'var(--surface-container)', borderRadius:'var(--radius-full)', height:6, overflow:'hidden' }}>
                  <motion.div style={{ height:'100%', background: pct>80?'var(--error)':'var(--success)', borderRadius:'var(--radius-full)' }}
                    initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.3+i*0.1, duration:0.6 }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom:'var(--space-4)' }}>
        <div className="filter-chips">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-chip ${statusF===s?'active':''}`} onClick={()=>setStatusF(s)}>
              {s==='All'?'All Status':s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <select className="form-select" style={{ width:160, padding:'7px 12px', fontSize:'var(--font-size-sm)' }} value={typeF} onChange={e=>setTypeF(e.target.value)}>
          {TYPE_FILTERS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>
                {canApprove && <th>Approved By</th>}
                {canApprove && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lr, i) => (
                <motion.tr key={lr.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}>
                  {!isEmployee && <td style={{ fontWeight:600 }}>{lr.employee}</td>}
                  <td><span className="badge badge-draft">{lr.type}</span></td>
                  <td>{lr.from}</td><td>{lr.to}</td>
                  <td><span className="badge badge-draft">{lr.days}d</span></td>
                  <td style={{ color:'var(--on-surface-variant)', maxWidth:200, fontSize:'var(--font-size-sm)' }}>{lr.reason}</td>
                  <td><StatusBadge status={lr.status} /></td>
                  {canApprove && <td style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{lr.approvedBy || '—'}</td>}
                  {canApprove && (
                    <td>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {lr.status === 'pending' && (
                          <>
                            <motion.button className="btn btn-sm btn-success" whileHover={{ scale:1.05 }} onClick={() => changeStatus(lr.id,'approved')}>
                              <CheckCircle size={12}/> Approve
                            </motion.button>
                            <motion.button className="btn btn-sm btn-danger" whileHover={{ scale:1.05 }} onClick={() => changeStatus(lr.id,'rejected')}>
                              <XCircle size={12}/> Reject
                            </motion.button>
                          </>
                        )}
                        {lr.status !== 'pending' && user?.role === ROLES.ADMIN && (
                          <motion.button className="btn btn-sm btn-secondary" whileHover={{ scale:1.05 }} title="Override decision"
                            onClick={() => setOverride(override===lr.id ? null : lr.id)}>
                            <ShieldAlert size={12}/> Override
                          </motion.button>
                        )}
                        <AnimatePresence>
                          {override === lr.id && (
                            <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                              style={{ position:'absolute', zIndex:50, background:'var(--surface-container)', border:'1px solid var(--outline-variant)', borderRadius:'var(--radius-md)', padding:'var(--space-3)', boxShadow:'var(--shadow-lg)', display:'flex', gap:8 }}>
                              <button className="btn btn-sm btn-success" onClick={() => changeStatus(lr.id,'approved')}>Force Approve</button>
                              <button className="btn btn-sm btn-danger"  onClick={() => changeStatus(lr.id,'rejected')}>Force Reject</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div style={{ textAlign:'center', padding:'var(--space-8)', color:'var(--on-surface-variant)' }}>No requests match your filters.</div>}
      </motion.div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h3>Apply for Leave</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18}/></button>
              </div>
              <form onSubmit={submitLeave}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Leave Type *</label>
                    <select name="leaveTypeId" value={form.leaveTypeId} onChange={handle} className="form-select" required>
                      <option value="">Select leave type</option>
                      {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} {lt.isPaid?'(Paid)':'(Unpaid)'}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">From Date *</label>
                      <input name="fromDate" type="date" value={form.fromDate} onChange={handle} className="form-input" required/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Date *</label>
                      <input name="toDate" type="date" value={form.toDate} onChange={handle} className="form-input" required/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <textarea name="reason" value={form.reason} onChange={handle} className="form-textarea" placeholder="Brief reason for leave…" rows={3}/>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <motion.button type="submit" className="btn btn-primary" whileHover={{ scale:1.02 }}>Submit Request</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
