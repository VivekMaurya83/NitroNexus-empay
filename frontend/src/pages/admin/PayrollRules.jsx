import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Save, AlertTriangle } from 'lucide-react';
import { getPayrollRules, updatePayrollRules } from '../../services/payrollService';

const RULE_FIELDS = [
  { key:'pfPercentage',       label:'Employee PF %',          suffix:'%', desc:'Employee provident fund deduction rate',      group:'Provident Fund'  },
  { key:'employerPf',         label:'Employer PF %',          suffix:'%', desc:'Employer contribution to PF',                 group:'Provident Fund'  },
  { key:'professionalTax',    label:'Professional Tax',        suffix:'₹', desc:'Fixed monthly professional tax deduction',    group:'Tax'             },
  { key:'taxSlab1Rate',       label:'Tax Slab 1 (≤ 5L) %',    suffix:'%', desc:'Income tax rate for annual income up to ₹5L', group:'Tax'             },
  { key:'taxSlab2Rate',       label:'Tax Slab 2 (5–10L) %',   suffix:'%', desc:'Income tax rate for ₹5L – ₹10L bracket',     group:'Tax'             },
  { key:'taxSlab3Rate',       label:'Tax Slab 3 (>10L) %',    suffix:'%', desc:'Income tax rate above ₹10L',                 group:'Tax'             },
  { key:'overtimeMultiplier', label:'Overtime Multiplier',     suffix:'x', desc:'Hourly rate multiplier for overtime hours',   group:'Payroll'         },
  { key:'cutoffDate',         label:'Payroll Cutoff Day',      suffix:'',  desc:'Day of month payroll calculations close',     group:'Payroll'         },
  { key:'gratuityRate',       label:'Gratuity Rate %',         suffix:'%', desc:'Annual gratuity accrual rate',               group:'Benefits'        },
  { key:'esiRate',            label:'ESI Rate %',              suffix:'%', desc:'Employee State Insurance contribution rate',  group:'Benefits'        },
  { key:'esiThreshold',       label:'ESI Salary Threshold',   suffix:'₹', desc:'Monthly gross limit for ESI eligibility',     group:'Benefits'        },
];

const GROUPS = ['Provident Fund', 'Tax', 'Payroll', 'Benefits'];

export default function PayrollRules() {
  const [rules, setRules]   = useState(null);
  const [dirty, setDirty]   = useState(false);
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getPayrollRules().then(r => setRules({ ...r })); }, []);

  const handle = (key, val) => {
    setRules(r => ({ ...r, [key]: parseFloat(val) || val }));
    setDirty(true);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await updatePayrollRules(rules);
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setDirty(false);
    setSaved(true);
  };

  if (!rules) return <div className="loading-state">Loading payroll rules…</div>;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div>
          <h1 className="page-title">Payroll Rules</h1>
          <p className="page-subtitle">Global payroll configuration — changes affect the next payroll run</p>
        </div>
        <motion.button className="btn btn-primary" onClick={save} disabled={!dirty || saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{ background: saved ? 'var(--success)' : undefined }}>
          <Save size={16} /> {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
        </motion.button>
      </div>

      {dirty && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#fff7ed', border:'1px solid #f59e0b', borderRadius:'var(--radius-md)', marginBottom:'var(--space-4)', fontSize:'var(--font-size-sm)', color:'#92400e' }}>
          <AlertTriangle size={16} color="#f59e0b" />
          Unsaved changes — these will affect salary calculations from the next payroll run.
        </motion.div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'var(--space-4)' }}>
        {GROUPS.map(group => {
          const fields = RULE_FIELDS.filter(f => f.group === group);
          return (
            <motion.div key={group} className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-4)' }}>
                <ShieldCheck size={18} color="var(--primary-container)" />
                <div className="card-title" style={{ margin:0 }}>{group}</div>
              </div>
              {fields.map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                    <div style={{ position:'relative', flex:1 }}>
                      <input
                        type="number"
                        value={rules[f.key] ?? ''}
                        onChange={e => handle(f.key, e.target.value)}
                        className="form-input"
                        style={{ paddingRight: f.suffix ? 36 : undefined }}
                        step="0.01"
                      />
                      {f.suffix && (
                        <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)', fontWeight:600 }}>
                          {f.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginTop:3 }}>{f.desc}</div>
                </div>
              ))}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
