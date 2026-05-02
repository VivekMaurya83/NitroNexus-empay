import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Printer } from 'lucide-react';
import { payslipData } from '../../utils/mockData';

export default function DetailedPayslip() {
  const { employee, earnings, deductions } = payslipData;
  const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0);
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  const netPay = totalEarnings - totalDeductions;
  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Payslip</h1>
          <p className="page-subtitle">Detailed salary breakdown for {employee.month}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <motion.button className="btn btn-secondary" whileHover={{ scale: 1.02 }}><Printer size={16} /> Print</motion.button>
          <motion.button className="btn btn-primary" whileHover={{ scale: 1.02 }}><Download size={16} /> Download PDF</motion.button>
        </div>
      </div>

      <motion.div className="card" style={{ maxWidth: 760 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Payslip Header */}
        <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', padding: 'var(--space-6)', margin: 'calc(-1 * var(--space-6)) calc(-1 * var(--space-6)) var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 4 }}>EmPay</div>
              <div style={{ opacity: 0.75, fontSize: 'var(--font-size-sm)' }}>Smart HR Management System</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>PAYSLIP</div>
              <div style={{ opacity: 0.75, fontSize: 'var(--font-size-sm)' }}>{employee.month}</div>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Employee Name</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{employee.name}</div>
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Designation</div>
              <div style={{ fontWeight: 500 }}>{employee.designation}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Department</div>
              <div style={{ fontWeight: 500 }}>{employee.department}</div>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Employee Code</div>
              <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{employee.code}</div>
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Days Worked</div>
              <div style={{ fontWeight: 500 }}>{employee.daysWorked} / {employee.totalDays} days</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Pay Period</div>
              <div style={{ fontWeight: 500 }}>{employee.month}</div>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div>
            <h6 style={{ marginBottom: 'var(--space-3)' }}>Earnings</h6>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Component</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {earnings.map(e => (
                    <tr key={e.label}>
                      <td>{e.label}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 500 }}>{fmt(e.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--surface-container-low)' }}>
                    <td style={{ fontWeight: 700 }}>Total Earnings</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--success)' }}>{fmt(totalEarnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h6 style={{ marginBottom: 'var(--space-3)' }}>Deductions</h6>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Component</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {deductions.map(d => (
                    <tr key={d.label}>
                      <td>{d.label}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 500, color: 'var(--error)' }}>{fmt(d.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--surface-container-low)' }}>
                    <td style={{ fontWeight: 700 }}>Total Deductions</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--error)' }}>{fmt(totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <motion.div
          style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          initial={{ scale: 0.97 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8, marginBottom: 4 }}>NET PAY</div>
            <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.7 }}>After all deductions for {employee.month}</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmt(netPay)}</div>
        </motion.div>

        <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
          This is a system-generated payslip. For queries, contact HR. · Generated by EmPay HRMS
        </div>
      </motion.div>
    </div>
  );
}
