import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Clock, CalendarDays, FileText, Users, ArrowRight, CheckCircle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { currentUser, attendanceLogs, leaveRequests, leaveAllocations } from '../../utils/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function EmployeePortal() {
  const navigate = useNavigate();
  const today = attendanceLogs[0];
  const myLeaves = leaveRequests.slice(0, 3);
  const myAllocations = leaveAllocations.slice(0, 3);

  return (
    <div>
      {/* Welcome Banner */}
      <motion.div
        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)', color: 'white', position: 'relative', overflow: 'hidden' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8, marginBottom: 4 }}>Good morning 👋</div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 8 }}>{currentUser.name}</h2>
          <div style={{ opacity: 0.8, fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>Software Engineer · {currentUser.company}</div>
          {today && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)' }}>
              <CheckCircle size={14} />
              {today.checkIn ? `Clocked in at ${today.checkIn}` : 'Not clocked in yet'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show" style={{ marginBottom: 'var(--space-6)' }}>
        <motion.div className="stat-card" variants={item}>
          <div className="stat-icon"><Clock size={20} /></div>
          <div className="stat-value">18</div>
          <div className="stat-label">Days Present (Apr)</div>
        </motion.div>
        <motion.div className="stat-card success" variants={item}>
          <div className="stat-icon" style={{ color: 'var(--success)' }}><CalendarDays size={20} /></div>
          <div className="stat-value">11</div>
          <div className="stat-label">Leave Balance</div>
        </motion.div>
        <motion.div className="stat-card warning" variants={item}>
          <div className="stat-icon" style={{ color: 'var(--warning)' }}><FileText size={20} /></div>
          <div className="stat-value">1</div>
          <div className="stat-label">Pending Requests</div>
        </motion.div>
        <motion.div className="stat-card" variants={item}>
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-value">8</div>
          <div className="stat-label">Team Members</div>
        </motion.div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Quick Actions */}
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            {[
              { icon: Clock,        label: 'Mark Attendance', path: '/attendance',   color: 'var(--primary-container)' },
              { icon: CalendarDays, label: 'Apply for Leave', path: '/leave',        color: 'var(--success)' },
              { icon: FileText,     label: 'View Payslip',    path: '/payslip',      color: 'var(--info)' },
              { icon: Users,        label: 'HR Directory',    path: '/hr-directory', color: 'var(--warning)' },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-4)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-fast)' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                    <Icon size={18} />
                  </div>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--on-surface)' }}>{a.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Leave Balances */}
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="card-header">
            <div className="card-title">Leave Balances</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>View All <ArrowRight size={14} /></button>
          </div>
          {myAllocations.map((a) => {
            const rem = a.allocated - a.used;
            const pct = Math.round((a.used / a.allocated) * 100);
            return (
              <div key={a.id} style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{a.leaveType}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{rem}/{a.allocated} days</span>
                </div>
                <div style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: pct > 80 ? 'var(--error)' : 'var(--primary-container)', borderRadius: 'var(--radius-full)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5, duration: 0.7 }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Recent Leave Requests */}
        <motion.div className="card" style={{ gridColumn: '1 / -1' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="card-header">
            <div className="card-title">My Leave Requests</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>View All <ArrowRight size={14} /></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {myLeaves.map((lr, i) => (
                  <motion.tr key={lr.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                    <td style={{ fontWeight: 500 }}>{lr.type}</td>
                    <td>{lr.from}</td><td>{lr.to}</td>
                    <td><span className="badge badge-draft">{lr.days}d</span></td>
                    <td style={{ color: 'var(--on-surface-variant)' }}>{lr.reason}</td>
                    <td><StatusBadge status={lr.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <style>{`@media (max-width: 768px) { .ep-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
