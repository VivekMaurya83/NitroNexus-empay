import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Download, Plus, Play } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { payrolls } from '../../utils/mockData';

export default function PayrollManagement() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">Manage payroll runs, generate payslips and view reports</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <motion.button className="btn btn-secondary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Download size={16} /> Export</motion.button>
          <motion.button className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Plus size={16} /> New Payrun</motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Employees', value: 8, color: 'var(--primary-container)' },
          { label: 'April Payroll', value: '₹8.42L', color: 'var(--success)' },
          { label: 'Avg Salary', value: '₹1.05L', color: 'var(--info)' },
          { label: 'Pending Payslips', value: 0, color: 'var(--warning)' },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Payroll Runs Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="card-header">
          <div className="card-title">Payroll Runs</div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Employees</th>
                <th>Total Amount</th>
                <th>Generated</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                  <td style={{ fontWeight: 600 }}>{p.month} {p.year}</td>
                  <td>{p.employees} employees</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: 'var(--font-size-base)' }}>{p.total}</td>
                  <td style={{ color: 'var(--on-surface-variant)' }}>{p.generated}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {p.status === 'draft' ? (
                        <motion.button className="btn btn-sm btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                          <Play size={12} /> Run Payroll
                        </motion.button>
                      ) : (
                        <motion.button className="btn btn-sm btn-secondary" whileHover={{ scale: 1.04 }}><Download size={12} /> Download</motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
