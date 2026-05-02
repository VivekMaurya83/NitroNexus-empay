import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import { getPayruns, runPayroll, getPayslipsForRun } from '../../services/payrollService';
import { invitePayroll } from '../../services/adminService';

const INR = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;
const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollManagement() {
  const { user } = useAuth();
  const canRun = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL;

  const [payruns,   setPayruns]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [runForm,   setRunForm]   = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() });
  const [running,   setRunning]   = useState(false);
  const [runError,  setRunError]  = useState('');
  const [expanded,  setExpanded]  = useState(null); // payrun id
  const [payslips,  setPayslips]  = useState([]);
  const [slipsLoading, setSlipsLoading] = useState(false);

  const [showInvitePayroll, setShowInvitePayroll] = useState(false);
  const [poForm, setPoForm] = useState({ name: '', email: '' });
  const [invitingPO, setInvitingPO] = useState(false);
  const [poError, setPoError] = useState('');

  const handleInvitePayroll = async (e) => {
    e.preventDefault();
    setInvitingPO(true); setPoError('');
    try {
      await invitePayroll(poForm);
      setShowInvitePayroll(false);
      setPoForm({ name: '', email: '' });
      load();
    } catch (err) {
      setPoError(err.message || 'Failed to invite Payroll Officer');
    } finally {
      setInvitingPO(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try { setPayruns(await getPayruns()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    setRunning(true); setRunError('');
    try {
      await runPayroll(Number(runForm.month), Number(runForm.year));
      setShowModal(false);
      load();
    } catch (err) { setRunError(err.message || 'Failed to run payroll'); }
    finally { setRunning(false); }
  };

  const toggleExpand = async (payrun) => {
    if (expanded === payrun.id) { setExpanded(null); setPayslips([]); return; }
    setExpanded(payrun.id);
    setSlipsLoading(true);
    try { setPayslips(await getPayslipsForRun(payrun.id)); }
    finally { setSlipsLoading(false); }
  };

  // Summary stats from latest payrun
  const latest = payruns[0] || null;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div><h1 className="page-title">Payroll Management</h1><p className="page-subtitle">Run payroll and review payslips</p></div>
        {canRun && (
          <motion.button className="btn btn-primary" onClick={()=>setShowModal(true)} whileHover={{ scale:1.02 }}>
            <Play size={16}/> Run Payroll
          </motion.button>
        )}
        {user?.role === ROLES.ADMIN && (
          <motion.button className="btn btn-secondary" onClick={()=>setShowInvitePayroll(true)} whileHover={{ scale:1.02 }}>
            <Users size={16}/> Invite Payroll Officer
          </motion.button>
        )}
      </div>

      {/* Invite Payroll Modal */}
      <AnimatePresence>
        {showInvitePayroll && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setShowInvitePayroll(false)}>
            <motion.div className="modal-content" initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }} onClick={e=>e.stopPropagation()} style={{ maxWidth:400 }}>
              <div className="modal-header">
                <h3 className="modal-title"><Users size={16}/> Invite Payroll Officer</h3>
                <button className="btn btn-icon btn-ghost" onClick={()=>setShowInvitePayroll(false)}><X size={18}/></button>
              </div>
              <form onSubmit={handleInvitePayroll} className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                <p style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>
                  Invite a Payroll Officer. Note: Only one Payroll Officer is allowed per organization.
                </p>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={poForm.name} onChange={e=>setPoForm(f=>({...f, name:e.target.value}))} placeholder="e.g. Amit Joshi" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" value={poForm.email} onChange={e=>setPoForm(f=>({...f, email:e.target.value}))} placeholder="payroll@company.com" required />
                </div>
                {poError && <div style={{ color:'var(--error)', fontSize:'var(--font-size-sm)', padding:'8px 12px', background:'var(--error-container)', borderRadius:8 }}>{poError}</div>}
                <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowInvitePayroll(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={invitingPO}>{invitingPO ? 'Inviting…' : 'Send Invite'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest payrun stats */}
      {latest && (
        <div className="stats-grid" style={{ marginBottom:'var(--space-4)' }}>
          {[
            { icon:<Users size={20}/>,      label:'Employees',     value: latest.employees,               color:'var(--primary-container)' },
            { icon:<TrendingUp size={20}/>,  label:'Gross Payout',  value: INR(latest.totalGross),          color:'var(--success)' },
            { icon:<TrendingDown size={20}/>,label:'Deductions',    value: INR(latest.totalDeductions),     color:'var(--error)'   },
            { icon:<DollarSign size={20}/>,  label:'Net Payout',    value: INR(latest.totalNet),            color:'var(--info)'    },
          ].map((s,i) => (
            <motion.div key={s.label} className="stat-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
              <div style={{ color:s.color, marginBottom:4 }}>{s.icon}</div>
              <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:2 }}>Latest: {latest.period}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payrun History Table */}
      <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="card-header"><div className="card-title">Payrun History</div></div>
        {loading && <div className="loading-state">Loading payrun history…</div>}
        {!loading && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Employees</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Amended</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payruns.map((pr, i) => (
                  <React.Fragment key={pr.id}>
                    <motion.tr initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}
                      style={{ cursor:'pointer', background: expanded===pr.id ? 'var(--surface-container-low)' : '' }}
                      onClick={()=>toggleExpand(pr)}>
                      <td style={{ fontWeight:700 }}>{pr.period || `${MONTHS[pr.month]} ${pr.year}`}</td>
                      <td style={{ textAlign:'center' }}>{pr.employees}</td>
                      <td style={{ fontFamily:'monospace', color:'var(--success)' }}>{INR(pr.totalGross)}</td>
                      <td style={{ fontFamily:'monospace', color:'var(--error)' }}>{INR(pr.totalDeductions)}</td>
                      <td style={{ fontFamily:'monospace', fontWeight:700 }}>{INR(pr.totalNet)}</td>
                      <td><StatusBadge status={pr.status}/></td>
                      <td style={{ textAlign:'center' }}>{pr.isAmended ? <span className="badge badge-warning">✎ Amended</span> : '—'}</td>
                      <td>
                        <motion.button className="btn btn-sm btn-secondary" whileHover={{ scale:1.03 }} onClick={e=>{e.stopPropagation();toggleExpand(pr);}}>
                          {expanded===pr.id ? 'Hide' : 'View'} Payslips
                        </motion.button>
                      </td>
                    </motion.tr>
                    {/* Expanded payslips row */}
                    {expanded === pr.id && (
                      <tr>
                        <td colSpan={8} style={{ padding:0, background:'var(--surface-container-lowest)' }}>
                          <div style={{ padding:'var(--space-4)' }}>
                            {slipsLoading && <div className="loading-state">Loading payslips…</div>}
                            {!slipsLoading && payslips.length === 0 && <div style={{ color:'var(--on-surface-variant)', textAlign:'center', padding:'var(--space-4)' }}>No payslips found.</div>}
                            {!slipsLoading && payslips.length > 0 && (
                              <table className="data-table" style={{ background:'transparent' }}>
                                <thead>
                                  <tr>
                                    <th>Employee</th><th>Present</th><th>Absent</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Anomaly</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payslips.map(ps => (
                                    <tr key={ps.id}>
                                      <td style={{ fontWeight:600 }}>{ps.employee}</td>
                                      <td style={{ textAlign:'center' }}>{ps.daysPresent}</td>
                                      <td style={{ textAlign:'center', color:'var(--error)' }}>{ps.daysAbsent}</td>
                                      <td style={{ fontFamily:'monospace' }}>{INR(ps.grossEarnings)}</td>
                                      <td style={{ fontFamily:'monospace', color:'var(--error)' }}>{INR(ps.totalDeductions)}</td>
                                      <td style={{ fontFamily:'monospace', fontWeight:700 }}>{INR(ps.netPay)}</td>
                                      <td>{ps.isAnomalous ? <span className="badge badge-warning" title={ps.anomalyFlags}>⚠ {ps.anomalyFlags || 'Flag'}</span> : '✓'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {!loading && payruns.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--on-surface-variant)', padding:'var(--space-8)' }}>No payrun history. Run your first payroll!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Run Payroll Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }} onClick={e=>e.stopPropagation()} style={{ maxWidth:400 }}>
              <div className="modal-header">
                <h3 className="modal-title"><Play size={16}/> Run Payroll</h3>
                <button className="btn btn-icon btn-ghost" onClick={()=>setShowModal(false)}><X size={18}/></button>
              </div>
              <form onSubmit={handleRunPayroll} className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                <div className="form-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select className="form-select" value={runForm.month} onChange={e=>setRunForm(f=>({...f, month:Number(e.target.value)}))}>
                      {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-input" value={runForm.year} min={2020} max={2099}
                      onChange={e=>setRunForm(f=>({...f, year:Number(e.target.value)}))}/>
                  </div>
                </div>
                {runError && <div style={{ color:'var(--error)', fontSize:'var(--font-size-sm)', padding:'8px 12px', background:'var(--error-container)', borderRadius:'var(--radius-md)' }}>{runError}</div>}
                <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={running}>{running?'Running…':'Run Payroll'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
