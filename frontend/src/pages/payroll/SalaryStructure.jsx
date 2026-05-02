import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Edit, Save, X, Lock } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/mockData';
import { getSalaryStructures, updateSalaryStructure } from '../../services/payrollService';

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function SalaryStructure() {
  const { user } = useAuth();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const canEdit    = [ROLES.ADMIN, ROLES.PAYROLL].includes(user?.role);

  const [structures, setStructures] = useState([]);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState({});

  useEffect(() => {
    const filters = isEmployee ? { employeeId: user.id } : {};
    getSalaryStructures(filters).then(setStructures);
  }, [isEmployee, user?.id]);

  const startEdit = (s) => { setEditing(s.id); setForm({ ...s }); };
  const cancelEdit = () => setEditing(null);
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const saveEdit = async () => {
    await updateSalaryStructure(form.id, form);
    setStructures(s => s.map(x => x.id === form.id ? { ...form } : x));
    setEditing(null);
  };

  return (
    <div>
      <div style={{ marginBottom:'var(--space-5)' }}>
        <h1 className="page-title">{isEmployee ? 'My Salary Structure' : 'Salary Structure'}</h1>
        <p className="page-subtitle">
          {isEmployee ? 'Your current compensation breakdown (read-only)' : 'View and update employee compensation packages'}
        </p>
      </div>

      {isEmployee && (
        <motion.div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'var(--surface-container-low)', border:'1px solid var(--outline-variant)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-4)', fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}
          initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
          <Lock size={14}/> This is a read-only view of your salary structure. Contact HR for changes.
        </motion.div>
      )}

      <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Basic</th><th>HRA</th><th>Allowances</th><th>Gross</th>
                <th>PF %</th><th>Prof. Tax</th><th>Net Approx.</th><th>Effective From</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {structures.map((s, i) => {
                const gross = +s.basic + +s.hra + +s.allowances;
                const pf    = Math.round(gross * (+s.pf / 100));
                const net   = gross - pf - +s.profTax;
                const isEd  = editing === s.id;
                return (
                  <motion.tr key={s.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.06 }}>
                    {!isEmployee && <td style={{ fontWeight:600 }}>{s.employee}</td>}
                    {isEd ? (
                      <>
                        {(['basic','hra','allowances']).map(field => (
                          <td key={field}><input name={field} value={form[field]} onChange={handle} className="form-input" style={{ width:90, padding:'4px 8px' }} type="number"/></td>
                        ))}
                        <td style={{ fontWeight:700, color:'var(--success)' }}>{fmt(+form.basic + +form.hra + +form.allowances)}</td>
                        <td><input name="pf" value={form.pf} onChange={handle} className="form-input" style={{ width:56, padding:'4px 8px' }} type="number"/></td>
                        <td><input name="profTax" value={form.profTax} onChange={handle} className="form-input" style={{ width:70, padding:'4px 8px' }} type="number"/></td>
                        <td style={{ color:'var(--on-surface-variant)', fontFamily:'monospace' }}>—</td>
                        <td><input name="effective" value={form.effective} onChange={handle} type="date" className="form-input" style={{ width:130, padding:'4px 8px' }}/></td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button className="btn btn-sm btn-success" onClick={saveEdit}><Save size={12}/></button>
                            <button className="btn btn-sm btn-secondary" onClick={cancelEdit}><X size={12}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontFamily:'monospace' }}>{fmt(s.basic)}</td>
                        <td style={{ fontFamily:'monospace' }}>{fmt(s.hra)}</td>
                        <td style={{ fontFamily:'monospace' }}>{fmt(s.allowances)}</td>
                        <td style={{ fontWeight:700, color:'var(--success)', fontFamily:'monospace' }}>{fmt(gross)}</td>
                        <td>{s.pf}%</td>
                        <td style={{ fontFamily:'monospace' }}>{fmt(s.profTax)}</td>
                        <td style={{ fontWeight:700, fontFamily:'monospace', color:'var(--primary-container)' }}>{fmt(net)}</td>
                        <td style={{ color:'var(--on-surface-variant)', fontSize:'var(--font-size-sm)' }}>{s.effective}</td>
                        {canEdit && (
                          <td><button className="btn btn-sm btn-secondary" onClick={() => startEdit(s)}><Edit size={12}/> Edit</button></td>
                        )}
                      </>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {structures.length === 0 && <div style={{ textAlign:'center', padding:'var(--space-8)', color:'var(--on-surface-variant)' }}>No salary data found.</div>}
      </motion.div>
    </div>
  );
}
