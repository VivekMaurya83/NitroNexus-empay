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
  getSalaryStructure, updateSalaryStructure
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

  // All Payslips State
  const [allPayslips, setAllPayslips] = useState([]);
  const [allSlipsLoading, setAllSlipsLoading] = useState(false);
  const [slipSearch, setSlipSearch] = useState('');

  const loadPayruns = async () => {
    setLoading(true);
    try { setPayruns(await getPayruns()); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPayruns(); }, []);

  useEffect(() => {
    if (activeTab === 'payslips') {
      setAllSlipsLoading(true);
      api.get('/payroll/payslips')
        .then(data => setAllPayslips(data || []))
        .catch(() => setAllPayslips([]))
        .finally(() => setAllSlipsLoading(false));
    }
  }, [activeTab]);

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
    setSalarySaving(true);
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
    } finally { setSalarySaving(false); }
  };

  // Salary Calculations
  const salaryGross = EARNINGS_FIELDS.reduce((sum, f) => sum + Number(salaryDraft[f.key] || 0), 0);
  const pfDeduction = salaryDraft.pfApplicable ? Math.round(salaryGross * 0.12) : 0;
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
            <div className="card card-sm" style={{ marginBottom:'var(--space-4)', display:'flex', alignItems:'center', gap:'var(--space-4)' }}>
              <label style={{ fontWeight:700 }}>Employee:</label>
              <select className="form-select" style={{ maxWidth:300 }} value={selectedEmpId||''} onChange={e=>setSelectedEmpId(Number(e.target.value))}>
                {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <div style={{ flex: 1 }} />
              {canRun && !editingSalary && salary && (
                <button className="btn btn-primary" onClick={()=>setEditingSalary(true)}><Edit2 size={14}/> Edit Structure</button>
              )}
              {editingSalary && (
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-secondary" onClick={()=>{setEditingSalary(false); setSalaryDraft(salary||{});}}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveSalary} disabled={salarySaving}><Save size={14}/> Save</button>
                </div>
              )}
            </div>

            {salaryLoading ? <div className="loading-state">Loading...</div> : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
                {/* Earnings */}
                <div className="card">
                  <div className="card-title" style={{ marginBottom:'var(--space-4)' }}>Earnings Breakdown</div>
                  <table className="data-table">
                    <tbody>
                      {EARNINGS_FIELDS.map(f => (
                        <tr key={f.key}>
                          <td>{f.label}</td>
                          <td style={{ textAlign:'right' }}>
                            {editingSalary ? (
                              <input type="number" className="form-input" style={{ width:120, textAlign:'right' }} value={salaryDraft[f.key]||''} onChange={e=>setSalaryDraft(d=>({...d, [f.key]:e.target.value}))}/>
                            ) : <span style={{ fontFamily:'monospace' }}>{INR(salary?.[f.key])}</span>}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background:'var(--surface-container-low)', fontWeight:700 }}>
                        <td>Gross Salary</td>
                        <td style={{ textAlign:'right', fontFamily:'monospace', color:'var(--success)' }}>{INR(salaryGross)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions */}
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
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                        <input type="checkbox" checked={!!salaryDraft.pfApplicable} disabled={!editingSalary} onChange={e=>setSalaryDraft(d=>({...d, pfApplicable:e.target.checked}))}/>
                        <span>PF Applicable</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'payslips' && (
          <motion.div key="payslips" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--outline-variant)' }}>
                <div className="search-wrap" style={{ flex: 1, maxWidth: 400 }}>
                  <Search size={15} className="search-icon" />
                  <input className="form-input search-input" value={slipSearch} onChange={e => setSlipSearch(e.target.value)} placeholder="Search payslips by employee name or code..." />
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Gross</th>
                      <th>Deductions</th>
                      <th>Net Pay</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSlipsLoading ? (
                      <tr><td colSpan={6} className="loading-state">Loading payslips...</td></tr>
                    ) : allPayslips.filter(ps => 
                        ps.employee.toLowerCase().includes(slipSearch.toLowerCase()) || 
                        ps.employeeCode?.toLowerCase().includes(slipSearch.toLowerCase())
                      ).map(ps => (
                        <tr key={ps.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{ps.employee}</div>
                            <div style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{ps.employeeCode}</div>
                          </td>
                          <td>{ps.period}</td>
                          <td style={{ fontFamily: 'monospace' }}>{INR(ps.grossEarnings)}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--error)' }}>{INR(ps.totalDeductions)}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{INR(ps.netPay)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-icon btn-ghost btn-sm" onClick={() => navigate(`/payslip?id=${ps.id}`)} title="View Detail"><ExternalLink size={14}/></button>
                          </td>
                        </tr>
                      ))}
                    {allPayslips.length === 0 && !allSlipsLoading && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--on-surface-variant)' }}>No payslips found.</td></tr>
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
