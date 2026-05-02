import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Printer } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getPayslip, downloadPayslip } from '../../services/payrollService';

export default function DetailedPayslip() {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Extract ID from query string if present (e.g. ?id=1)
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const idParam = searchParams.get('id');

  useEffect(() => {
    if (!idParam) {
      setError('No payslip ID provided. Please select a payslip from Payroll Management.');
      setLoading(false);
      return;
    }
    setLoading(true);
    getPayslip(idParam)
      .then(p => {
        if (!p) setError('Payslip not found');
        else setPayslip(p);
      })
      .catch(e => setError(e.message || 'Failed to load payslip'))
      .finally(() => setLoading(false));
  }, [idParam]);

  const handleDownload = () => {
    if (payslip?.id) downloadPayslip(payslip.id);
  };

  if (loading) return <div className="loading-state">Loading payslip details…</div>;
  if (error) return <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--error)' }}>{error}</div>;
  if (!payslip) return null;

  const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;

  const earnings = [
    { label:'Basic Salary', amount: payslip.basic },
    { label:'HRA',          amount: payslip.hra },
    { label:'Conveyance',   amount: payslip.conveyance },
    { label:'Medical',      amount: payslip.medical },
    { label:'Special',      amount: payslip.specialAllowance },
    { label:'LTA',          amount: payslip.lta },
    { label:'Bonus',        amount: payslip.bonus },
  ].filter(e => e.amount > 0);

  const deductions = [
    { label:'PF Employee',     amount: payslip.pfEmployee },
    { label:'Professional Tax',amount: payslip.professionalTax },
    { label:'TDS',             amount: payslip.tds },
    { label:'Other Deductions',amount: payslip.otherDeductions },
  ].filter(d => d.amount > 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Payslip</h1>
          <p className="page-subtitle">Detailed salary breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <motion.button className="btn btn-secondary" whileHover={{ scale: 1.02 }} onClick={()=>window.print()}><Printer size={16} /> Print</motion.button>
          <motion.button className="btn btn-primary" whileHover={{ scale: 1.02 }} onClick={handleDownload}><Download size={16} /> Download PDF</motion.button>
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
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>PAYSLIP #{payslip.id}</div>
              <div style={{ opacity: 0.75, fontSize: 'var(--font-size-sm)' }}>Payrun #{payslip.payrunId}</div>
            </div>
          </div>
        </div>

        {payslip.isAnomalous && (
          <div style={{ background:'var(--warning-container)', color:'var(--warning)', padding:'12px', borderRadius:'var(--radius-md)', marginBottom:'var(--space-4)', fontSize:'var(--font-size-sm)', fontWeight:600 }}>
            ⚠ Anomaly Detected: {payslip.anomalyFlags}
          </div>
        )}

        {/* Employee Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Employee Name</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{payslip.employee}</div>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Attendance (Days)</div>
              <div style={{ fontWeight: 500 }}>
                {payslip.daysPresent} Present / {payslip.totalWorkingDays} Total
              </div>
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Leave Breakdown</div>
              <div style={{ fontWeight: 500, fontSize:'var(--font-size-sm)' }}>
                {payslip.paidLeaveDays} Paid | {payslip.unpaidLeaveDays} Unpaid
              </div>
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
                    <td style={{ fontWeight: 700 }}>Gross Earnings</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--success)' }}>{fmt(payslip.grossEarnings)}</td>
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
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--error)' }}>{fmt(payslip.totalDeductions)}</td>
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
            <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.7 }}>After all deductions</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmt(payslip.netPay)}</div>
        </motion.div>

        <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
          This is a system-generated payslip. For queries, contact HR. · Generated by EmPay HRMS
        </div>
      </motion.div>
    </div>
  );
}
