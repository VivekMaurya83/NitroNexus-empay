import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import { getSalaryStructure, updateSalaryStructure } from '../../services/payrollService';
import { getEmployees } from '../../services/employeeService';

const INR = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;

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

export default function SalaryStructure() {
  const { user } = useAuth();
  const canEdit = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL;

  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [salary,    setSalary]    = useState(null);
  const [editing,   setEditing]   = useState(false);
  const [draft,     setDraft]     = useState({});
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    getEmployees().then(emps => {
      setEmployees(emps);
      if (emps.length) setSelectedId(emps[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true); setSalary(null);
    getSalaryStructure(selectedId)
      .then(s => { setSalary(s); setDraft(s || {}); })
      .catch(() => { setSalary(null); setDraft({}); })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const gross = EARNINGS_FIELDS.reduce((sum, f) => sum + Number(draft[f.key] || 0), 0);
  const pfDeduction    = draft.pfApplicable ? Math.round(gross * 0.12) : 0;
  const profTax        = 200; // simplified
  const totalDeduction = pfDeduction + profTax;
  const netPay         = gross - totalDeduction;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        basic:              Number(draft.basic || 0),
        hra:                Number(draft.hra || 0),
        conveyance:         Number(draft.conveyance || 0),
        medical:            Number(draft.medical || 0),
        special_allowance:  Number(draft.specialAllowance || 0),
        lta:                Number(draft.lta || 0),
        bonus:              Number(draft.bonus || 0),
        pf_applicable:      !!draft.pfApplicable,
        professional_tax_state: draft.professionalTaxState || 'Maharashtra',
      };
      const updated = await updateSalaryStructure(selectedId, payload);
      setSalary(updated); setDraft(updated); setEditing(false);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div><h1 className="page-title">Salary Structure</h1><p className="page-subtitle">View and manage compensation breakdown</p></div>
        {canEdit && !editing && salary && (
          <motion.button className="btn btn-primary" onClick={()=>setEditing(true)} whileHover={{ scale:1.02 }}>
            <Edit size={16}/> Edit Structure
          </motion.button>
        )}
        {editing && (
          <div style={{ display:'flex', gap:'var(--space-2)' }}>
            <motion.button className="btn btn-secondary" onClick={()=>{ setEditing(false); setDraft(salary||{}); }} whileHover={{ scale:1.02 }}><X size={16}/> Cancel</motion.button>
            <motion.button className="btn btn-primary" onClick={handleSave} disabled={saving} whileHover={{ scale:1.02 }}><Save size={16}/> {saving?'Saving…':'Save'}</motion.button>
          </div>
        )}
      </div>

      {/* Employee Selector */}
      <div className="card card-sm" style={{ marginBottom:'var(--space-4)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', flexWrap:'wrap' }}>
          <label style={{ fontWeight:600, fontSize:'var(--font-size-sm)', whiteSpace:'nowrap' }}>Select Employee:</label>
          <select className="form-select" style={{ minWidth:240 }} value={selectedId||''} onChange={e=>setSelectedId(Number(e.target.value))}>
            {employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.designation}</option>)}
          </select>
          {salary && <span style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>Active since {salary.createdAt?.slice(0,10)}</span>}
        </div>
      </div>

      {loading && <div className="loading-state">Loading salary data…</div>}
      {!loading && !salary && selectedId && (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-8)', color:'var(--on-surface-variant)' }}>
          No active salary structure for this employee.
          {canEdit && <div style={{ marginTop:'var(--space-4)' }}><motion.button className="btn btn-primary" onClick={()=>{ setEditing(true); setDraft({ pfApplicable:true, professionalTaxState:'Maharashtra' }); }} whileHover={{ scale:1.02 }}>+ Create Structure</motion.button></div>}
        </div>
      )}

      {!loading && (salary || editing) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
          {/* Earnings */}
          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <div className="card-header"><div className="card-title">Earnings</div></div>
            <table className="data-table">
              <tbody>
                {EARNINGS_FIELDS.map(f => (
                  <tr key={f.key}>
                    <td style={{ fontWeight:500 }}>{f.label}</td>
                    <td style={{ textAlign:'right' }}>
                      {editing ? (
                        <input type="number" className="form-input" style={{ width:120, textAlign:'right', padding:'4px 8px' }}
                          value={draft[f.key]||''} min={0}
                          onChange={e=>setDraft(d=>({...d, [f.key]:e.target.value}))}/>
                      ) : <span style={{ fontFamily:'monospace', fontWeight:600 }}>{INR(salary?.[f.key])}</span>}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop:'2px solid var(--outline-variant)', background:'var(--surface-container-low)' }}>
                  <td style={{ fontWeight:700 }}>Gross Earnings</td>
                  <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:700, color:'var(--success)' }}>{INR(gross)}</td>
                </tr>
              </tbody>
            </table>
          </motion.div>

          {/* Deductions + Settings */}
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
              <div className="card-header"><div className="card-title">Deductions</div></div>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td>PF (Employee 12%)</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace' }}>{INR(pfDeduction)}</td>
                  </tr>
                  <tr>
                    <td>Professional Tax</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace' }}>{INR(profTax)}</td>
                  </tr>
                  <tr style={{ borderTop:'2px solid var(--outline-variant)', background:'var(--surface-container-low)' }}>
                    <td style={{ fontWeight:700 }}>Total Deductions</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:700, color:'var(--error)' }}>{INR(totalDeduction)}</td>
                  </tr>
                  <tr style={{ background:'var(--primary-container)', opacity:0.9 }}>
                    <td style={{ fontWeight:800 }}>Net Pay</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontWeight:800, color:'var(--on-primary)', fontSize:'var(--font-size-lg)' }}>{INR(netPay)}</td>
                  </tr>
                </tbody>
              </table>
            </motion.div>

            <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
              <div className="card-header"><div className="card-title">Settings</div></div>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)', padding:'var(--space-2) 0' }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor: editing?'pointer':'default' }}>
                  <input type="checkbox" checked={!!draft.pfApplicable}
                    disabled={!editing}
                    onChange={e=>setDraft(d=>({...d, pfApplicable:e.target.checked}))}/>
                  <span style={{ fontWeight:500 }}>PF Applicable</span>
                  <span style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>(12% employee + 12% employer)</span>
                </label>
                <div className="form-group" style={{ margin:0 }}>
                  <label className="form-label">Professional Tax State</label>
                  {editing ? (
                    <select className="form-select" value={draft.professionalTaxState||'Maharashtra'}
                      onChange={e=>setDraft(d=>({...d, professionalTaxState:e.target.value}))}>
                      {PT_STATES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontWeight:600, padding:'6px 0' }}>{salary?.professionalTaxState || 'Maharashtra'}</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
