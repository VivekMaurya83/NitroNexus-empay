import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Edit, Save, X } from 'lucide-react';
import { employees, salaryStructures } from '../../utils/mockData';

export default function SalaryStructure() {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = (s) => { setEditing(s.id); setForm({ ...s }); };
  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <h1 className="page-title">Salary Structure</h1>
      <p className="page-subtitle">Configure employee compensation packages</p>

      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic (₹)</th>
                <th>HRA (₹)</th>
                <th>Allowances (₹)</th>
                <th>PF %</th>
                <th>Prof. Tax (₹)</th>
                <th>Gross (₹)</th>
                <th>Effective From</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaryStructures.map((s, i) => {
                const gross = s.basic + s.hra + s.allowances;
                const isEditing = editing === s.id;
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                    <td style={{ fontWeight: 600 }}>{s.employee}</td>
                    {isEditing ? (
                      <>
                        <td><input name="basic" value={form.basic} onChange={handle} className="form-input" style={{ width: 90, padding: '4px 8px' }} /></td>
                        <td><input name="hra" value={form.hra} onChange={handle} className="form-input" style={{ width: 90, padding: '4px 8px' }} /></td>
                        <td><input name="allowances" value={form.allowances} onChange={handle} className="form-input" style={{ width: 90, padding: '4px 8px' }} /></td>
                        <td><input name="pf" value={form.pf} onChange={handle} className="form-input" style={{ width: 60, padding: '4px 8px' }} /></td>
                        <td><input name="profTax" value={form.profTax} onChange={handle} className="form-input" style={{ width: 80, padding: '4px 8px' }} /></td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{(+form.basic + +form.hra + +form.allowances).toLocaleString('en-IN')}</td>
                        <td><input name="effective" value={form.effective} onChange={handle} type="date" className="form-input" style={{ width: 130, padding: '4px 8px' }} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm btn-success" onClick={() => setEditing(null)}><Save size={13} /></button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditing(null)}><X size={13} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontFamily: 'monospace' }}>{s.basic.toLocaleString('en-IN')}</td>
                        <td style={{ fontFamily: 'monospace' }}>{s.hra.toLocaleString('en-IN')}</td>
                        <td style={{ fontFamily: 'monospace' }}>{s.allowances.toLocaleString('en-IN')}</td>
                        <td>{s.pf}%</td>
                        <td>{s.profTax}</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)', fontFamily: 'monospace' }}>₹{gross.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--on-surface-variant)' }}>{s.effective}</td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => startEdit(s)}><Edit size={13} /> Edit</button>
                        </td>
                      </>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
