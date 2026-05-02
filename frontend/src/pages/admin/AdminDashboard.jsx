import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CalendarDays, DollarSign, TrendingUp, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { employees, attendanceLogs, leaveRequests, payrolls, auditLogs } from '../../utils/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const presentToday = attendanceLogs.filter(a => a.date === '2026-05-02' && a.status === 'present').length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const thisMonthPayroll = payrolls.find(p => p.month === 'April' && p.year === 2026);

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Welcome back, Arjun! Here's what's happening at Acme Corp today.</p>

      {/* Stats */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show">
        <motion.div className="stat-card" variants={item}>
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-value">{activeEmployees}</div>
          <div className="stat-label">Active Employees</div>
        </motion.div>
        <motion.div className="stat-card success" variants={item}>
          <div className="stat-icon" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stat-value">{presentToday}</div>
          <div className="stat-label">Present Today</div>
        </motion.div>
        <motion.div className="stat-card warning" variants={item}>
          <div className="stat-icon" style={{ color: 'var(--warning)' }}><AlertCircle size={20} /></div>
          <div className="stat-value">{pendingLeaves}</div>
          <div className="stat-label">Pending Leaves</div>
        </motion.div>
        <motion.div className="stat-card" variants={item}>
          <div className="stat-icon" style={{ color: 'var(--info)' }}><DollarSign size={20} /></div>
          <div className="stat-value">₹8.4L</div>
          <div className="stat-label">April Payroll</div>
        </motion.div>
      </motion.div>

      <div className="dashboard-grid">
        {/* Recent Attendance */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Today's Attendance</div>
              <div className="card-subtitle">May 2, 2026</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/attendance')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
              <tbody>
                {employees.slice(0, 5).map((emp, i) => {
                  const log = attendanceLogs[i] || {};
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm">{emp.name.split(' ').map(n=>n[0]).join('')}</div>
                          <span>{emp.name}</span>
                        </div>
                      </td>
                      <td>{log.checkIn || '—'}</td>
                      <td>{log.checkOut || '—'}</td>
                      <td><StatusBadge status={log.status || 'absent'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Leave Requests */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Leave Requests</div>
              <div className="card-subtitle">{pendingLeaves} pending approval</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Status</th></tr></thead>
              <tbody>
                {leaveRequests.map(lr => (
                  <tr key={lr.id}>
                    <td>{lr.employee}</td>
                    <td style={{ color: 'var(--on-surface-variant)' }}>{lr.type}</td>
                    <td>{lr.days}d</td>
                    <td><StatusBadge status={lr.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Payroll Summary */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Payroll Overview</div>
              <div className="card-subtitle">Recent payroll runs</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payroll')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Period</th><th>Employees</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.month} {p.year}</td>
                    <td>{p.employees}</td>
                    <td style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{p.total}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Audit Logs */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Audit trail</div>
            </div>
          </div>
          <div className="audit-list">
            {auditLogs.map(log => (
              <div key={log.id} className="audit-item">
                <div className="audit-dot" />
                <div className="audit-info">
                  <div className="audit-action">{log.action}</div>
                  <div className="audit-meta">by {log.actor} · {log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
        .audit-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .audit-item { display: flex; align-items: flex-start; gap: var(--space-3); }
        .audit-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary-container); margin-top: 6px; flex-shrink: 0; }
        .audit-action { font-size: var(--font-size-md); font-weight: 500; color: var(--on-surface); }
        .audit-meta { font-size: var(--font-size-sm); color: var(--on-surface-variant); }
        @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
