import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, X, Users, TrendingUp, TrendingDown, DollarSign, 
  FileText, SlidersHorizontal, History, Edit2, ExternalLink, Save, Search
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth, ROLES } from '../../context/AuthContext';
import { 
  getPayruns, runPayroll, getPayslipsForRun, updatePayslip,
  getSalaryStructure, updateSalaryStructure,
  getCtcBreakdown, getAllPayslips
} from '../../services/payrollService';
import { getEmployees } from '../../services/employeeService';
import { useNavigate } from 'react-router-dom';

const INR = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;
const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
const ALL_PAYSLIPS_QUERY = `/payroll/payslips`; // I'll assume this endpoint exists or I'll use run-specific ones if needed, but usually a global one is better.
// Actually, I'll check if I have a global payslip service. 
// I'll use api directly if needed.
import api from '../../services/api';

const EARNINGS_FIELDS = [
  { key:'basic',           label:'Basic Salary' },
  { key:'hra',             label:'HRA' },
  { key:'conveyance',      label:'Conveyance Allowance' },
  { key:'medical',         label:'Medical Allowance' },
  { key:'specialAllowance',label:'Special Allowance' },
  { key:'lta',             label:'Leave Travel Allowance (LTA)' },
  { key:'bonus',           label:'Bonus / Incentive' },
];

const PT_STATES = ['Maharashtra','Karnataka','West Bengal','Andhra Pradesh','Telangana','Tamil Nadu','Gujarat','Rajasthan','Other'];

export default function PayrollManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canRun = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL;

  const [activeTab, setTab] = useState('management');

  // Management State
  const [payruns,   setPayruns]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [runForm,   setRunForm]   = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() });
  const [running,   setRunning]   = useState(false);
  const [runError,  setRunError]  = useState('');
  const [expanded,  setExpanded]  = useState(null); 
  const [payslips,  setPayslips]  = useState([]);
  const [slipsLoading, setSlipsLoading] = useState(false);
  
  // Edit Slip State
  const [editingSlip, setEditingSlip] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingSlip, setSavingSlip] = useState(false);

  // Salary Structure State
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [salary,    setSalary]    = useState(null);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryDraft,   setSalaryDraft]   = useState({});
  const [salarySaving,  setSalarySaving]  = useState(false);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [saveError,     setSaveError]     = useState('');

  // All Payslips State
  const [allPayslips, setAllPayslips] = useState([]);
  const [allSlipsLoading, setAllSlipsLoading] = useState(false);
  const [slipSearch, setSlipSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [expandedSlip, setExpandedSlip] = useState(null);

  // CTC Auto-fill State
  const [ctcInput, setCtcInput] = useState('');
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillNote, setAutoFillNote] = useState('');

  const loadPayruns = async () => {
    setLoading(true);
    try { setPayruns(await getPayruns()); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPayruns(); }, []);

  const loadAllPayslips = async () => {
    setAllSlipsLoading(true);
    try {
      const data = await getAllPayslips({ month: filterMonth || undefined, year: filterYear || undefined });
      setAllPayslips(data);
    } catch { setAllPayslips([]); }
    finally { setAllSlipsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'payslips') loadAllPayslips();
  }, [activeTab, filterMonth, filterYear]);

  useEffect(() => {
    if (activeTab === 'salary') {
      getEmployees().then(emps => {
        setEmployees(emps);
        if (emps.length && !selectedEmpId) setSelectedEmpId(emps[0].id);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'salary' && selectedEmpId) {
      setSalaryLoading(true); setSalary(null);
      getSalaryStructure(selectedEmpId)
        .then(s => { setSalary(s); setSalaryDraft(s || {}); })
        .catch(() => { setSalary(null); setSalaryDraft({}); })
        .finally(() => setSalaryLoading(false));
    }
  }, [activeTab, selectedEmpId]);

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    setRunning(true); setRunError('');
    try {
      await runPayroll(Number(runForm.month), Number(runForm.year));
      setShowModal(false);
      loadPayruns();
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

  const startEditSlip = (ps) => {
    setEditingSlip(ps);
    setEditForm({ ...ps });
  };

  const handleUpdateSlip = async (e) => {
    e.preventDefault();
    setSavingSlip(true);
    try {
      const updated = await updatePayslip(editingSlip.id, editForm);
      setPayslips(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditingSlip(null);
      loadPayruns();
    } catch (err) { alert(err.message || 'Failed to update payslip'); }
    finally { setSavingSlip(false); }
  };

  const handleSaveSalary = async () => {
    setSalarySaving(true); setSaveError('');
    try {
      const payload = {
        basic:              Number(salaryDraft.basic || 0),
        hra:                Number(salaryDraft.hra || 0),
        conveyance:         Number(salaryDraft.conveyance || 0),
        medical:            Number(salaryDraft.medical || 0),
        special_allowance:  Number(salaryDraft.specialAllowance || 0),
        lta:                Number(salaryDraft.lta || 0),
        bonus:              Number(salaryDraft.bonus || 0),
        pf_applicable:      !!salaryDraft.pfApplicable,
        professional_tax_state: salaryDraft.professionalTaxState || 'Maharashtra',
      };
      const updated = await updateSalaryStructure(selectedEmpId, payload);
      setSalary(updated); setSalaryDraft(updated); setEditingSalary(false);
      setCtcInput(''); setAutoFillNote('');
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally { setSalarySaving(false); }
  };

  const handleAutoFill = async () => {
    const ctc = Number(ctcInput);
    if (!ctc || ctc <= 0) return;
    setAutoFilling(true);
    try {
      const bd = await getCtcBreakdown(ctc);
      setSalaryDraft(d => ({
        ...d,
        basic:            bd.basic,
        hra:              bd.hra,
        conveyance:       bd.conveyance,
        medical:          bd.medical,
        specialAllowance: bd.special_allowance,
        lta:              bd.lta ?? 0,
        bonus:            bd.bonus ?? 0,
      }));
      setAutoFillNote(`Auto-filled using ${Math.round((bd.hra_pct_used || 0.4) * 100)}% HRA ratio. Review and adjust before saving.`);
      setEditingSalary(true);
    } catch {
      setAutoFillNote('Could not fetch breakdown. Enter values manually.');
    } finally { setAutoFilling(false); }
  };


  // Salary Calculations — use draft during auto-fill preview, saved data otherwise
  const activeSalaryData = editingSalary ? salaryDraft : (salary || {});
  const salaryGross = EARNINGS_FIELDS.reduce((sum, f) => sum + Number(activeSalaryData[f.key] || 0), 0);
  const pfDeduction = activeSalaryData.pfApplicable ? Math.round(salaryGross * 0.12) : 0;
  const profTax = 200;
  const totalDeduction = pfDeduction + profTax;
  const netPay = salaryGross - totalDeduction;

  return (
    <div className="payroll-page">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Payroll & Compensation</h1>
          <p className="page-subtitle">Manage payruns, payslips, and employee salary structures</p>
        </div>
        {activeTab === 'management' && canRun && (
          <motion.button className="btn btn-primary" onClick={()=>setShowModal(true)} whileHover={{ scale:1.02 }}>
            <Play size={16}/> Run Payroll
          </motion.button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
        <button className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`} onClick={() => setTab('management')}>
          <History size={16} /> Payruns & History
        </button>
        <button className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setTab('salary')}>
          <SlidersHorizontal size={16} /> Salary Structure
        </button>
        <button className={`tab-btn ${activeTab === 'payslips' ? 'active' : ''}`} onClick={() => setTab('payslips')}>
          <FileText size={16} /> Payslips
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'management' && (
          <motion.div key="management" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            {/* Summary cards from latest */}
            {payruns[0] && (
              <div className="stats-grid" style={{ marginBottom:'var(--space-4)' }}>
                {[
                  { label:'Employees',     value: payruns[0].employees,           color:'var(--primary-container)' },
                  { label:'Gross Payout',  value: INR(payruns[0].totalGross),      color:'var(--success)' },
                  { label:'Net Payout',    value: INR(payruns[0].totalNet),        color:'var(--info)'    },
                ].map((s,i) => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label} (Latest)</div>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Employees</th>
                      <th>Gross</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={6} className="loading-state">Loading...</td></tr>}
                    {payruns.map(pr => (
                      <React.Fragment key={pr.id}>
                        <tr onClick={()=>toggleExpand(pr)} style={{ cursor:'pointer', background: expanded===pr.id ? 'var(--surface-container-low)' : '' }}>
                          <td style={{ fontWeight:700 }}>{pr.period || `${MONTHS[pr.month]} ${pr.year}`}</td>
                          <td style={{ textAlign:'center' }}>{pr.employees}</td>
                          <td style={{ fontFamily:'monospace' }}>{INR(pr.totalGross)}</td>
                          <td style={{ fontFamily:'monospace', fontWeight:700 }}>{INR(pr.totalNet)}</td>
                          <td><StatusBadge status={pr.status}/></td>
                          <td>
                            <button className="btn btn-sm btn-secondary">{expanded===pr.id ? 'Hide' : 'View'} Slips</button>
                          </td>
                        </tr>
                        {expanded === pr.id && (
                          <tr>
                            <td colSpan={6} style={{ padding:0 }}>
                              <div style={{ padding:'var(--space-4)', background:'var(--surface-container-lowest)' }}>
                                {slipsLoading ? <div className="loading-state">Loading...</div> : (
                                  <table className="data-table" style={{ background:'transparent' }}>
                                    <thead>
                                      <tr>
                                        <th>Employee</th><th>Net Pay</th><th>Status</th><th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {payslips.map(ps => (
                                        <tr key={ps.id}>
                                          <td style={{ fontWeight:600 }}>{ps.employee} <span style={{ fontSize:10, fontWeight:400 }}>({ps.employeeCode})</span></td>
                                          <td style={{ fontFamily:'monospace' }}>{INR(ps.netPay)}</td>
                                          <td><StatusBadge status={pr.status}/></td>
                                          <td>
                                            <div style={{ display:'flex', gap:4 }}>
                                              <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>navigate(`/payslip?id=${ps.id}`)}><ExternalLink size={14}/></button>
                                              <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>startEditSlip(ps)}><Edit2 size={14}/></button>
                                            </div>
                                          </td>
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
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'salary' && (
          <motion.div key="salary" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>

            {/* Unified: Employee selector + CTC input in one card */}
            <div className="card card-sm" style={{ marginBottom:'var(--space-4)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)', flexWrap:'wrap' }}>
                <label style={{ fontWeight:700, whiteSpace:'nowrap' }}>Employee:</label>
                <select className="form-select" style={{ maxWidth:280 }} value={selectedEmpId||''}
                  onChange={e => { setSelectedEmpId(Number(e.target.value)); setEditingSalary(false); setAutoFillNote(''); }}>
                  {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                {salary && <span style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>Active since {salary.createdAt?.slice(0,10)}</span>}

                <div style={{ flex:1 }}/>

                {/* CTC input — right side of same row */}
                {canRun && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:600, fontSize:'var(--font-size-sm)', whiteSpace:'nowrap', color:'var(--primary)' }}>⚡ Monthly CTC (₹)</span>
                    <input
                      type="number" min={1} placeholder="e.g. 50000"
                      className="form-input" style={{ width:140 }}
                      value={ctcInput}
                      onChange={e => setCtcInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAutoFill()}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleAutoFill}
                      disabled={!ctcInput || autoFilling}>
                      {autoFilling ? 'Calculating…' : 'Auto-fill'}
                    </button>
                  </div>
                )}
              </div>

              {/* Auto-fill note + pending save actions */}
              {autoFillNote && (
                <div style={{ marginTop:'var(--space-3)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'var(--space-3)', padding:'var(--space-2) var(--space-3)', background:'var(--surface-container)', borderRadius:'var(--radius-sm)', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'var(--font-size-xs)', color:'var(--primary)', fontWeight:500 }}>ℹ {autoFillNote}</span>
                  {editingSalary && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>{ setEditingSalary(false); setSalaryDraft(salary||{}); setAutoFillNote(''); setCtcInput(''); setAutoFillNote(''); setSaveError(''); }}>
                        Discard
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveSalary} disabled={salarySaving}>
                        <Save size={13}/> {salarySaving ? 'Saving…' : 'Save Structure'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {saveError && (
                <div style={{ marginTop:'var(--space-2)', fontSize:'var(--font-size-xs)', color:'var(--error)', fontWeight:600 }}>⚠ {saveError}</div>
              )}
            </div>

            {salaryLoading ? <div className="loading-state">Loading…</div> : (
              !salary && !editingSalary ? (
                <div className="card" style={{ textAlign:'center', padding:'var(--space-8)', color:'var(--on-surface-variant)' }}>
                  <div style={{ marginBottom:'var(--space-2)' }}>No active salary structure for this employee.</div>
                  {canRun && <div style={{ fontSize:'var(--font-size-sm)' }}>Enter a Monthly CTC above and click <strong>Auto-fill</strong> to create one.</div>}
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
                  {/* Earnings — always read-only, reflects auto-fill draft */}
                  <div className="card">
                    <div className="card-title" style={{ marginBottom:'var(--space-4)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>Earnings Breakdown</span>
                      {editingSalary && <span style={{ fontSize:'var(--font-size-xs)', background:'var(--primary-container)', color:'var(--primary)', padding:'2px 8px', borderRadius:99, fontWeight:600 }}>Preview</span>}
                    </div>
                    <table className="data-table">
                      <tbody>
                        {EARNINGS_FIELDS.map(f => {
                          const val = editingSalary ? (salaryDraft[f.key] || 0) : (salary?.[f.key] || 0);
                          const pct = salaryGross > 0 ? ((Number(val)/salaryGross)*100).toFixed(1) : '0.0';
                          return (
                            <tr key={f.key}>
                              <td>
                                {f.label}
                                {salaryGross > 0 && <span style={{ fontSize:10, color:'var(--on-surface-variant)', marginLeft:6 }}>{pct}%</span>}
                              </td>
                              <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:600 }}>
                                {INR(val)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr style={{ background:'var(--surface-container-low)', fontWeight:700 }}>
                          <td>Gross Salary</td>
                          <td style={{ textAlign:'right', fontFamily:'monospace', color:'var(--success)' }}>{INR(salaryGross)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Deductions + config */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                    <div className="card">
                      <div className="card-title" style={{ marginBottom:'var(--space-4)' }}>Deductions</div>
                      <table className="data-table">
                        <tbody>
                          <tr><td>PF (Employee 12%)</td><td style={{ textAlign:'right', fontFamily:'monospace' }}>{INR(pfDeduction)}</td></tr>
                          <tr><td>Professional Tax</td><td style={{ textAlign:'right', fontFamily:'monospace' }}>{INR(profTax)}</td></tr>
                          <tr style={{ background:'var(--surface-container-low)', fontWeight:700 }}>
                            <td>Total Deductions</td>
                            <td style={{ textAlign:'right', fontFamily:'monospace', color:'var(--error)' }}>{INR(totalDeduction)}</td>
                          </tr>
                          <tr style={{ background:'var(--primary-container)', color:'var(--on-primary)', fontWeight:800 }}>
                            <td>Net Take Home</td>
                            <td style={{ textAlign:'right', fontFamily:'monospace', fontSize:18 }}>{INR(netPay)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="card">
                      <div className="card-title" style={{ marginBottom:'var(--space-3)' }}>Configuration</div>
                      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'default', opacity: editingSalary ? 1 : 0.7 }}>
                        <input type="checkbox" checked={!!salaryDraft.pfApplicable} readOnly disabled={!editingSalary}
                          onChange={e => editingSalary && setSalaryDraft(d=>({...d, pfApplicable:e.target.checked}))}/>
                        <span>PF Applicable</span>
                        <span style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>(12% employee + 12% employer)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}


        {activeTab === 'payslips' && (
          <motion.div key="payslips" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            {/* Filter bar */}
            <div className="card card-sm" style={{ marginBottom:'var(--space-3)', display:'flex', alignItems:'center', gap:'var(--space-3)', flexWrap:'wrap' }}>
              <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
                <Search size={15} className="search-icon"/>
                <input className="form-input search-input" value={slipSearch} onChange={e=>setSlipSearch(e.target.value)} placeholder="Search by name or code…"/>
              </div>
              <select className="form-select" style={{ maxWidth:140 }} value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}>
                <option value="">All Months</option>
                {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select className="form-select" style={{ maxWidth:110 }} value={filterYear} onChange={e=>setFilterYear(Number(e.target.value))}>
                {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setFilterMonth(''); setFilterYear(new Date().getFullYear());}}>Reset</button>
            </div>

            {/* Summary totals bar */}
            {allPayslips.length > 0 && !allSlipsLoading && (() => {
              const vis = allPayslips.filter(ps=>
                ps.employee.toLowerCase().includes(slipSearch.toLowerCase()) ||
                ps.employeeCode?.toLowerCase().includes(slipSearch.toLowerCase()));
              const tGross = vis.reduce((s,p)=>s+Number(p.grossEarnings||0),0);
              const tDed   = vis.reduce((s,p)=>s+Number(p.totalDeductions||0),0);
              const tNet   = vis.reduce((s,p)=>s+Number(p.netPay||0),0);
              return (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'var(--space-3)', marginBottom:'var(--space-3)' }}>
                  {[['Total Gross',tGross,'var(--on-surface)'],[`Total Deductions`,tDed,'var(--error)'],[`Net Payout`,tNet,'var(--success)']].map(([l,v,c])=>(
                    <div key={l} className="card card-sm" style={{ textAlign:'center', padding:'var(--space-3)' }}>
                      <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginBottom:2 }}>{l} ({vis.length} slips)</div>
                      <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:'var(--font-size-lg)', color:c }}>{INR(v)}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Period</th><th>Gross</th>
                      <th>Deductions</th><th>Net Pay</th><th style={{ textAlign:'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSlipsLoading && <tr><td colSpan={6} className="loading-state">Loading payslips…</td></tr>}
                    {!allSlipsLoading && allPayslips.filter(ps=>
                      ps.employee.toLowerCase().includes(slipSearch.toLowerCase()) ||
                      ps.employeeCode?.toLowerCase().includes(slipSearch.toLowerCase())
                    ).flatMap(ps => {
                      const isExp = expandedSlip === ps.id;
                      return [
                        <tr key={ps.id} onClick={()=>setExpandedSlip(isExp ? null : ps.id)}
                          style={{ cursor:'pointer', background: isExp ? 'var(--surface-container-low)' : '' }}>
                          <td>
                            <div style={{ fontWeight:600 }}>{ps.employee}
                              {ps.isAnomalous && <span style={{ marginLeft:6, fontSize:10, background:'var(--warning-container)', color:'var(--warning)', borderRadius:4, padding:'1px 5px', fontWeight:700 }}>⚠ Anomaly</span>}
                              {ps.isAmended  && <span style={{ marginLeft:4,  fontSize:10, background:'var(--info-container)',    color:'var(--info)',    borderRadius:4, padding:'1px 5px', fontWeight:700 }}>Amended</span>}
                            </div>
                            <div style={{ fontSize:10, color:'var(--on-surface-variant)' }}>{ps.employeeCode}</div>
                          </td>
                          <td style={{ fontWeight:500 }}>{ps.period || '—'}</td>
                          <td style={{ fontFamily:'monospace' }}>{INR(ps.grossEarnings)}</td>
                          <td style={{ fontFamily:'monospace', color:'var(--error)' }}>{INR(ps.totalDeductions)}</td>
                          <td style={{ fontFamily:'monospace', fontWeight:700 }}>{INR(ps.netPay)}</td>
                          <td style={{ textAlign:'right' }}>
                            <button className="btn btn-icon btn-ghost btn-sm" onClick={e=>{e.stopPropagation(); navigate(`/payslip?id=${ps.id}`);}} title="View Full Payslip"><ExternalLink size={14}/></button>
                          </td>
                        </tr>,
                        isExp && (
                          <tr key={`${ps.id}-detail`}>
                            <td colSpan={6} style={{ padding:'var(--space-4)', background:'var(--surface-container-lowest)', borderBottom:'2px solid var(--outline-variant)' }}>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
                                <div>
                                  <div style={{ fontWeight:700, marginBottom:'var(--space-2)', fontSize:'var(--font-size-sm)' }}>Earnings</div>
                                  {[['Basic',ps.basic],['HRA',ps.hra],['Conveyance',ps.conveyance],['Medical',ps.medical],['Special',ps.specialAllowance],['LTA',ps.lta],['Bonus',ps.bonus]].filter(([,v])=>v>0).map(([l,v])=>(
                                    <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'var(--font-size-sm)', padding:'2px 0' }}>
                                      <span>{l}</span><span style={{ fontFamily:'monospace' }}>{INR(v)}</span>
                                    </div>
                                  ))}
                                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, borderTop:'1px solid var(--outline-variant)', marginTop:4, paddingTop:4 }}>
                                    <span>Gross</span><span style={{ fontFamily:'monospace', color:'var(--success)' }}>{INR(ps.grossEarnings)}</span>
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontWeight:700, marginBottom:'var(--space-2)', fontSize:'var(--font-size-sm)' }}>Deductions & Days</div>
                                  {[['PF Employee',ps.pfEmployee],['Professional Tax',ps.professionalTax],['TDS',ps.tds],['LOP',ps.lopDeduction],['Other',ps.otherDeductions]].filter(([,v])=>v>0).map(([l,v])=>(
                                    <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'var(--font-size-sm)', padding:'2px 0' }}>
                                      <span>{l}</span><span style={{ fontFamily:'monospace', color:'var(--error)' }}>{INR(v)}</span>
                                    </div>
                                  ))}
                                  <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:8 }}>
                                    {ps.daysPresent} present / {ps.totalWorkingDays} working days · {ps.paidLeaveDays} paid leave
                                  </div>
                                  {ps.isAnomalous && <div style={{ marginTop:6, fontSize:'var(--font-size-xs)', color:'var(--warning)', fontWeight:600 }}>⚠ {ps.anomalyFlags}</div>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      ].filter(Boolean);
                    })}
                    {allPayslips.length === 0 && !allSlipsLoading && (
                      <tr><td colSpan={6}>
                        <div style={{ textAlign:'center', padding:'var(--space-10)', color:'var(--on-surface-variant)' }}>
                          <FileText size={40} style={{ opacity:0.25, marginBottom:'var(--space-3)' }}/>
                          <div style={{ fontWeight:700, marginBottom:4 }}>No payslips found</div>
                          <div style={{ fontSize:'var(--font-size-sm)' }}>Run a payroll first — payslips will appear here once a payrun is completed.</div>
                          {canRun && <button className="btn btn-primary" style={{ marginTop:'var(--space-4)' }} onClick={()=>setTab('management')}>Go to Payruns</button>}
                        </div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Shared Modals (Run/Edit) */}
      {/* ... Run Payroll Modal ... */}
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
                  <div className="form-group"><label className="form-label">Month</label><select className="form-select" value={runForm.month} onChange={e=>setRunForm(f=>({...f, month:Number(e.target.value)}))}>{MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Year</label><input type="number" className="form-input" value={runForm.year} onChange={e=>setRunForm(f=>({...f, year:Number(e.target.value)}))}/></div>
                </div>
                {runError && <div className="badge badge-rejected" style={{ width:'100%', padding:8 }}>{runError}</div>}
                <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={running}>{running?'Running...':'Run Payroll'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {editingSlip && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setEditingSlip(null)}>
            <motion.div className="modal-content" initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }} onClick={e=>e.stopPropagation()} style={{ maxWidth:600 }}>
              <div className="modal-header">
                <h3 className="modal-title">Edit Payslip: {editingSlip.employee}</h3>
                <button className="btn btn-icon btn-ghost" onClick={()=>setEditingSlip(null)}><X size={18}/></button>
              </div>
              <form onSubmit={handleUpdateSlip} className="modal-body">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                  <div className="form-group"><label className="form-label">Basic</label><input type="number" className="form-input" value={editForm.basic} onChange={e=>setEditForm(f=>({...f, basic:Number(e.target.value)}))}/></div>
                  <div className="form-group"><label className="form-label">Bonus</label><input type="number" className="form-input" value={editForm.bonus} onChange={e=>setEditForm(f=>({...f, bonus:Number(e.target.value)}))}/></div>
                  <div className="form-group"><label className="form-label">PF Deduction</label><input type="number" className="form-input" value={editForm.pfEmployee} onChange={e=>setEditForm(f=>({...f, pfEmployee:Number(e.target.value)}))}/></div>
                  <div className="form-group"><label className="form-label">TDS</label><input type="number" className="form-input" value={editForm.tds} onChange={e=>setEditForm(f=>({...f, tds:Number(e.target.value)}))}/></div>
                </div>
                <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end', marginTop:'var(--space-5)' }}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setEditingSlip(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingSlip}>{savingSlip?'Saving...':'Update Slip'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
