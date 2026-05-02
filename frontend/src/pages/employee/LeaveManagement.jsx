import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, AlertCircle, CheckCircle, XCircle, BarChart2, CalendarDays, Trash2, Upload, Sparkles, FileText, Loader2, AlertTriangle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import {
  getLeaveRequests, applyLeave, cancelLeave,
  hrReviewLeave, payrollReviewLeave, getLeaveAllocations,
} from '../../services/leaveService';
import { getAnalytics } from '../../services/analyticsService';
import { extractTextFromImage, parseLeaveDetailsWithAI } from '../../services/ocrService';
import api from '../../services/api';

const getLeaveTypes = () => api.get('/leaves/types');
const createLeaveType = (data) => api.post('/leaves/policies', data);
const deleteLeaveType = (id) => api.delete(`/leaves/policies/${id}`);

const LEAVE_TYPES = ['casual','sick','earned','maternity','paternity','unpaid','comp_off'];
const LABEL = { casual:'Casual',sick:'Sick',earned:'Earned',maternity:'Maternity',paternity:'Paternity',unpaid:'Unpaid',comp_off:'Comp Off' };
const STATUS_FILTERS = ['all','pending','hr_approved','approved','rejected','cancelled'];

function StackedBar({ label, approved, pending, rejected }) {
  const total = approved + pending + rejected;
  return (
    <div style={{ marginBottom:'var(--space-3)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:'var(--font-size-sm)', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>Total: {total}</span>
      </div>
      <div style={{ display:'flex', height:12, borderRadius:'var(--radius-full)', overflow:'hidden', gap:2 }}>
        {total > 0 ? (
          <>
            <motion.div style={{ width:`${(approved/total)*100}%`, background:'var(--success)', minWidth:4 }} initial={{ width:0 }} animate={{ width:`${(approved/total)*100}%` }} transition={{ duration:0.7 }} title={`Approved: ${approved}`} />
            <motion.div style={{ width:`${(pending/total)*100}%`, background:'var(--warning)', minWidth:pending>0?4:0 }} initial={{ width:0 }} animate={{ width:`${(pending/total)*100}%` }} transition={{ duration:0.7, delay:0.1 }} title={`Pending: ${pending}`} />
            <motion.div style={{ width:`${(rejected/total)*100}%`, background:'var(--error)', minWidth:rejected>0?4:0 }} initial={{ width:0 }} animate={{ width:`${(rejected/total)*100}%` }} transition={{ duration:0.7, delay:0.2 }} title={`Rejected: ${rejected}`} />
          </>
        ) : <div style={{ width:'100%', background:'var(--surface-container)', borderRadius:'var(--radius-full)' }} />}
      </div>
      <div style={{ display:'flex', gap:'var(--space-4)', marginTop:4, fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>
        <span style={{ color:'var(--success)' }}>✓ {approved} approved</span>
        <span style={{ color:'var(--warning)' }}>🕐 {pending} pending</span>
        <span style={{ color:'var(--error)' }}>✗ {rejected} rejected</span>
      </div>
    </div>
  );
}

export default function LeaveManagement() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin    = role === ROLES.ADMIN;
  const isHR       = role === ROLES.HR;
  const isPayroll  = role === ROLES.PAYROLL;
  const isEmployee = role === ROLES.EMPLOYEE;

  const [activeTab, setTab] = useState('requests');
  const [leaves,      setLeaves]      = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [statusF,     setStatusF]     = useState('all');
  const [loading,     setLoading]     = useState(true);
  const [showApply,   setShowApply]   = useState(false);
  const [reviewModal, setReviewModal] = useState(null); 
  const [remarks,     setRemarks]     = useState('');
  const [form, setForm] = useState({ leaveType:'casual', fromDate:'', toDate:'', reason:'' });

  // OCR autofill state
  const [ocrFile,    setOcrFile]    = useState(null);
  const [ocrStep,    setOcrStep]    = useState('idle'); // idle | ocr | ai | done | error
  const [ocrNote,    setOcrNote]    = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const fileInputRef = useRef(null);

  const resetOcrState = () => {
    setOcrFile(null); setOcrStep('idle'); setOcrNote(''); setOcrRawText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOcrUpload = async (file) => {
    if (!file) return;
    setOcrFile(file);
    setOcrStep('ocr');
    setOcrNote('');
    try {
      const text = await extractTextFromImage(file);
      setOcrRawText(text);
      setOcrStep('ai');
      const parsed = await parseLeaveDetailsWithAI(text);
      setForm(f => ({
        ...f,
        leaveType: parsed.leaveType || f.leaveType,
        fromDate:  parsed.fromDate  || f.fromDate,
        toDate:    parsed.toDate    || f.toDate,
        reason:    parsed.reason    || f.reason,
      }));
      setOcrNote(parsed.notes || '');
      setOcrStep('done');
    } catch (err) {
      setOcrStep('error');
      setOcrNote(err.message);
    }
  };

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [deptF, setDeptF] = useState('All');

  // Policies / Settings state
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [ltForm, setLtForm] = useState({ leave_type: '', is_paid: true, max_days_per_year: 10 });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLeaveRequests(statusF !== 'all' ? { status: statusF } : {});
      setLeaves(data);
      if (isEmployee && user?.employeeId) {
        const alloc = await getLeaveAllocations(user.employeeId);
        setAllocations(alloc);
      }
      if (isAdmin || isHR || isPayroll) {
        const ana = await getAnalytics();
        setAnalyticsData(ana);
        
        // Load policies
        const lData = await getLeaveTypes();
        setLeavePolicies(lData.policies || []);
        setAvailableTypes(lData.available_types || []);
        if (lData.available_types?.length > 0 && !ltForm.leave_type) {
          setLtForm(f => ({ ...f, leave_type: lData.available_types[0] }));
        }
      }
    } finally { setLoading(false); }
  };

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    try {
      await createLeaveType(ltForm);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleRemovePolicy = async (id) => {
    if (!window.confirm('Delete this leave policy?')) return;
    try {
      await deleteLeaveType(id);
      load();
    } catch (err) { alert(err.message); }
  };

  useEffect(() => { load(); }, [statusF]);

  const handleApply = async (e) => {
    e.preventDefault();
    await applyLeave({ leaveType: form.leaveType, fromDate: form.fromDate, toDate: form.toDate, reason: form.reason });
    setShowApply(false);
    setForm({ leaveType:'casual', fromDate:'', toDate:'', reason:'' });
    resetOcrState();
    load();
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    await cancelLeave(id);
    load();
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    const { id, action, stage } = reviewModal;
    if (stage === 'hr')      await hrReviewLeave(id, action, remarks);
    else                     await payrollReviewLeave(id, action, remarks);
    setReviewModal(null); setRemarks('');
    load();
  };

  const rowActions = (leave) => {
    const buttons = [];
    const status = (leave.status || '').toLowerCase();
    if (isEmployee && status === 'pending') buttons.push({ label:'Cancel', variant:'btn-danger', onClick:()=>handleCancel(leave.id) });
    if ((isAdmin || isHR) && status === 'pending') {
      buttons.push(
        { label:'Approve', variant:'btn-success', onClick:()=>{ setReviewModal({ id:leave.id, action:'approve', stage:'hr' }); setRemarks(''); }},
        { label:'Reject',  variant:'btn-danger',  onClick:()=>{ setReviewModal({ id:leave.id, action:'reject',  stage:'hr' }); setRemarks(''); }},
      );
    }
    if ((isAdmin || isPayroll) && status === 'hr_approved') {
      buttons.push(
        { label:'Confirm', variant:'btn-success', onClick:()=>{ setReviewModal({ id:leave.id, action:'approve', stage:'payroll' }); setRemarks(''); }},
        { label:'Reject',  variant:'btn-danger',  onClick:()=>{ setReviewModal({ id:leave.id, action:'reject',  stage:'payroll' }); setRemarks(''); }},
      );
    }
    return buttons;
  };

  const filtered = leaves.filter(l => statusF === 'all' || l.status === statusF);
  const leaveAnalytics = deptF === 'All' ? analyticsData?.leaveByDept : analyticsData?.leaveByDept.filter(d => d.dept === deptF);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div>
          <h1 className="page-title">Leave {activeTab==='analytics'?'Analytics':'Management'}</h1>
          <p className="page-subtitle">{activeTab==='analytics'?'Insights and trends across departments':'Review, approve and apply for leave'}</p>
        </div>
        {(activeTab === 'requests' && (isEmployee || isAdmin || isHR)) && (
          <motion.button className="btn btn-primary" onClick={()=>setShowApply(true)} whileHover={{ scale:1.02 }}>
            <Plus size={16}/> Apply Leave
          </motion.button>
        )}
      </div>

      {/* Tabs for Admin/HR/Payroll */}
      {!isEmployee && (
        <div className="tabs" style={{ marginBottom:'var(--space-4)' }}>
          <button className={`tab-btn ${activeTab==='requests'?'active':''}`} onClick={()=>setTab('requests')}>
            <CalendarDays size={14}/> Requests
          </button>
          <button className={`tab-btn ${activeTab==='analytics'?'active':''}`} onClick={()=>setTab('analytics')}>
            <BarChart2 size={14}/> Analytics
          </button>
          <button className={`tab-btn ${activeTab==='settings'?'active':''}`} onClick={()=>setTab('settings')}>
            <X size={14}/> Leave Policies
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'requests' ? (
          <motion.div key="requests" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
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

            {/* Filters */}
            <div className="filter-chips" style={{ marginBottom:'var(--space-4)' }}>
              {STATUS_FILTERS.map(s => (
                <button key={s} className={`filter-chip ${statusF===s?'active':''}`} onClick={()=>setStatusF(s)}>
                  {s==='all'?'All':s==='hr_approved'?'HR Approved':s.charAt(0).toUpperCase()+s.slice(1)}
                  {s!=='all' && <span style={{ marginLeft:5, fontWeight:700 }}>({leaves.filter(l=>l.status===s).length})</span>}
                </button>
              ))}
            </div>

            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {!isEmployee && <th>Employee</th>}
                      <th>Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={7} className="loading-state">Loading…</td></tr>}
                    {!loading && filtered.map((l,i) => (
                      <motion.tr key={l.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}>
                        {!isEmployee && <td style={{ fontWeight:600 }}>{l.employee || `Emp #${l.employeeId}`}</td>}
                        <td><span className="badge badge-draft">{l.type || LABEL[l.leaveType] || l.leaveType}</span></td>
                        <td style={{ fontFamily:'monospace', fontSize:'var(--font-size-sm)' }}>{l.from}</td>
                        <td style={{ fontFamily:'monospace', fontSize:'var(--font-size-sm)' }}>{l.to}</td>
                        <td style={{ textAlign:'center', fontWeight:600 }}>{l.days}</td>
                        <td><StatusBadge status={l.status}/></td>
                        <td>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            {rowActions(l).map(btn => (
                              <button key={btn.label} className={`btn btn-sm ${btn.variant}`} onClick={btn.onClick}>{btn.label}</button>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'analytics' ? (
          <motion.div key="analytics" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Department Leave Distribution</div>
                <select className="form-select" style={{ width:180 }} value={deptF} onChange={e => setDeptF(e.target.value)}>
                  <option>All</option>
                  {analyticsData?.leaveByDept?.map(d => <option key={d.dept}>{d.dept}</option>)}
                </select>
              </div>
              <div style={{ marginTop:'var(--space-4)' }}>
                {leaveAnalytics?.map(d => <StackedBar key={d.dept} label={d.dept} approved={d.approved} pending={d.pending} rejected={d.rejected} />)}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="settings" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Policy</div>
                <form onSubmit={handleAddPolicy}>
                  <div className="form-group">
                    <label className="form-label">Leave Type</label>
                    <select value={ltForm.leave_type} onChange={e => setLtForm(f => ({...f, leave_type: e.target.value}))} className="form-select">
                      {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Days/Year</label>
                    <input type="number" value={ltForm.max_days_per_year} onChange={e => setLtForm(f => ({...f, max_days_per_year: +e.target.value}))} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <input type="checkbox" checked={ltForm.is_paid} onChange={e => setLtForm(f => ({...f, is_paid: e.target.checked}))} />
                      Paid Leave
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width:'100%' }}>Create Policy</button>
                </form>
              </div>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Existing Policies</div>
                <table className="data-table">
                  <thead><tr><th>Type</th><th>Max Days</th><th>Paid</th><th>Actions</th></tr></thead>
                  <tbody>
                    {leavePolicies.map(p => (
                      <tr key={p.id}>
                        <td style={{ textTransform:'capitalize', fontWeight:600 }}>{p.leave_type}</td>
                        <td>{p.max_days_per_year}</td>
                        <td>{p.is_paid ? '✅' : '❌'}</td>
                        <td><button className="btn btn-icon btn-ghost btn-sm" onClick={()=>handleRemovePolicy(p.id)} style={{ color:'var(--error)' }}><Trash2 size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showApply && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>{setShowApply(false); resetOcrState();}}>
            <motion.div className="modal-content" initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }} onClick={e=>e.stopPropagation()} style={{ maxWidth:500 }}>
              <div className="modal-header">
                <h3 className="modal-title">Apply for Leave</h3>
                <button className="btn btn-icon btn-ghost" onClick={()=>{setShowApply(false); resetOcrState();}}><X size={18}/></button>
              </div>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>

                {/* ── OCR Upload Zone ── */}
                <div style={{ border:'2px dashed var(--outline-variant)', borderRadius:'var(--radius-lg)', padding:'var(--space-4)', background:'var(--surface-container-lowest)', cursor:'pointer', transition:'border-color .2s', position:'relative' }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleOcrUpload(f); }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={e => { const f = e.target.files[0]; if(f) handleOcrUpload(f); }} />
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
                    <div style={{ width:40, height:40, borderRadius:'var(--radius-md)', background:'var(--primary-container)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {ocrStep === 'idle'  && <Upload size={18} color="var(--primary)" />}
                      {(ocrStep === 'ocr' || ocrStep === 'ai') && <Loader2 size={18} color="var(--primary)" style={{ animation:'spin 1s linear infinite' }} />}
                      {ocrStep === 'done'  && <Sparkles size={18} color="var(--success)" />}
                      {ocrStep === 'error' && <AlertTriangle size={18} color="var(--error)" />}
                    </div>
                    <div style={{ flex:1 }}>
                      {ocrStep === 'idle' && (
                        <>
                          <div style={{ fontWeight:600, fontSize:'var(--font-size-sm)' }}>Upload Medical / Leave Document</div>
                          <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:2 }}>Drag & drop or click — SpaceOCR + Groq AI will autofill the form</div>
                        </>
                      )}
                      {ocrStep === 'ocr' && (
                        <>
                          <div style={{ fontWeight:600, fontSize:'var(--font-size-sm)', color:'var(--primary)' }}>Extracting text from image…</div>
                          <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:2 }}>SpaceOCR is processing your document</div>
                        </>
                      )}
                      {ocrStep === 'ai' && (
                        <>
                          <div style={{ fontWeight:600, fontSize:'var(--font-size-sm)', color:'var(--primary)' }}>AI is reading the document…</div>
                          <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:2 }}>Groq is extracting leave dates, type and reason</div>
                        </>
                      )}
                      {ocrStep === 'done' && (
                        <>
                          <div style={{ fontWeight:600, fontSize:'var(--font-size-sm)', color:'var(--success)' }}>✓ Fields autofilled! Review and submit.</div>
                          {ocrFile && <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:2 }}>{ocrFile.name}</div>}
                        </>
                      )}
                      {ocrStep === 'error' && (
                        <>
                          <div style={{ fontWeight:600, fontSize:'var(--font-size-sm)', color:'var(--error)' }}>Autofill failed</div>
                          <div style={{ fontSize:'var(--font-size-xs)', color:'var(--error)', marginTop:2 }}>{ocrNote}</div>
                        </>
                      )}
                    </div>
                    {(ocrStep === 'done' || ocrStep === 'error') && (
                      <button type="button" className="btn btn-icon btn-ghost btn-sm" onClick={e => { e.stopPropagation(); resetOcrState(); }} title="Clear" style={{ flexShrink:0 }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {ocrStep === 'done' && ocrNote && (
                    <div style={{ marginTop:'var(--space-3)', padding:'8px 12px', background:'#fff7ed', border:'1px solid #f59e0b40', borderRadius:'var(--radius-md)', fontSize:'var(--font-size-xs)', color:'#92400e', display:'flex', gap:6, alignItems:'flex-start' }}>
                      <AlertTriangle size={12} color="#f59e0b" style={{ flexShrink:0, marginTop:1 }} />
                      <span>{ocrNote}</span>
                    </div>
                  )}
                </div>

                {/* ── Divider ── */}
                <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
                  <div style={{ flex:1, height:1, background:'var(--outline-variant)' }} />
                  <span style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', whiteSpace:'nowrap' }}>or fill manually</span>
                  <div style={{ flex:1, height:1, background:'var(--outline-variant)' }} />
                </div>

                {/* ── Form Fields ── */}
                <form onSubmit={handleApply} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Leave Type</label>
                    <select className="form-select" value={form.leaveType} onChange={e=>setForm(f=>({...f, leaveType:e.target.value}))}>
                      {LEAVE_TYPES.map(t=><option key={t} value={t}>{LABEL[t]}</option>)}
                    </select>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">From Date</label>
                      <input type="date" className={`form-input ${ocrStep==='done' && form.fromDate ? 'ocr-filled' : ''}`} required value={form.fromDate} onChange={e=>setForm(f=>({...f, fromDate:e.target.value}))}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Date</label>
                      <input type="date" className={`form-input ${ocrStep==='done' && form.toDate ? 'ocr-filled' : ''}`} required value={form.toDate} min={form.fromDate} onChange={e=>setForm(f=>({...f, toDate:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <textarea className={`form-input ${ocrStep==='done' && form.reason ? 'ocr-filled' : ''}`} rows={3} placeholder="Optional reason…" value={form.reason} onChange={e=>setForm(f=>({...f, reason:e.target.value}))} style={{ resize:'vertical' }}/>
                  </div>
                  <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={()=>{setShowApply(false); resetOcrState();}}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={ocrStep==='ocr'||ocrStep==='ai'}>Submit Request</button>
                  </div>
                </form>
              </div>
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
                <h3 className="modal-title">
                  {reviewModal.action==='approve' ? 'Approve' : 'Reject'} Leave
                  <span className="badge badge-draft" style={{ marginLeft:8 }}>{reviewModal.stage === 'hr' ? 'HR Review' : 'Payroll Confirm'}</span>
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
                  <button className={`btn ${reviewModal.action==='approve'?'btn-success':'btn-danger'}`} onClick={handleReview}>Confirm</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
