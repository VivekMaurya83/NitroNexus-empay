import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CalendarDays, DollarSign, CheckCircle, AlertCircle, ArrowRight, Bell } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminAlerts from './AdminAlerts';
import { useAuth } from '../../context/AuthContext';
import { employees, leaveRequests, payrolls, auditLogs, systemAlerts, todayAttendance } from '../../utils/mockData';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alertsOpen, setAlertsOpen] = useState(systemAlerts.length > 0);

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const presentToday    = todayAttendance.filter(a => a.status === 'present').length;
  const pendingLeaves   = leaveRequests.filter(l => l.status === 'pending').length;
  const alertCount      = systemAlerts.length;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-2)' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here's what's happening at {user?.company} today.</p>
        </div>
        {alertCount > 0 && (
          <motion.button
            className={`btn ${alertsOpen ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setAlertsOpen(o => !o)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ position: 'relative' }}
          >
            <Bell size={16} />
            {alertsOpen ? 'Hide Alerts' : 'Show Alerts'}
            <span style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'var(--error)', color:'white', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {alertCount}
            </span>
          </motion.button>
        )}
      </div>

      {/* Alerts Panel */}
      {alertsOpen && alertCount > 0 && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
          style={{ marginBottom:'var(--space-5)', background:'var(--surface-container-lowest)', border:'1px solid var(--outline-variant)', borderRadius:'var(--radius-xl)', padding:'var(--space-5)', borderLeft:'4px solid var(--error)' }}>
          <AdminAlerts embedded />
        </motion.div>
      )}

      {/* Stats */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show">
        <motion.div className="stat-card" variants={item}>
          <div className="stat-icon"><Users size={20}/></div>
          <div className="stat-value">{activeEmployees}</div>
          <div className="stat-label">Active Employees</div>
        </motion.div>
        <motion.div className="stat-card success" variants={item}>
          <div className="stat-icon" style={{ color:'var(--success)' }}><CheckCircle size={20}/></div>
          <div className="stat-value">{presentToday}</div>
          <div className="stat-label">Present Today</div>
        </motion.div>
        <motion.div className="stat-card warning" variants={item}>
          <div className="stat-icon" style={{ color:'var(--warning)' }}><AlertCircle size={20}/></div>
          <div className="stat-value">{pendingLeaves}</div>
          <div className="stat-label">Pending Leaves</div>
        </motion.div>
        <motion.div className="stat-card error" variants={item}>
          <div className="stat-icon" style={{ color:'var(--error)' }}><Bell size={20}/></div>
          <div className="stat-value" style={{ color:'var(--error)' }}>{alertCount}</div>
          <div className="stat-label">System Alerts</div>
        </motion.div>
      </motion.div>

      <div className="dashboard-grid">
        {/* Today's Attendance */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <div className="card-header">
            <div><div className="card-title">Today's Status</div><div className="card-subtitle">Live attendance board</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/status-board')}>View All <ArrowRight size={14}/></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Dept</th><th>Check In</th><th>Status</th></tr></thead>
              <tbody>
                {todayAttendance.slice(0, 6).map((emp) => (
                  <tr key={emp.employeeId}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="avatar avatar-sm" style={{ background: emp.photoColor }}>{emp.avatar}</div>
                        <span style={{ fontWeight:500 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-draft" style={{ fontSize:11 }}>{emp.department}</span></td>
                    <td style={{ fontFamily:'monospace' }}>{emp.checkIn || '—'}</td>
                    <td><StatusBadge status={emp.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Leave Requests */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div className="card-header">
            <div><div className="card-title">Leave Requests</div><div className="card-subtitle">{pendingLeaves} pending approval</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>View All <ArrowRight size={14}/></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Status</th></tr></thead>
              <tbody>
                {leaveRequests.slice(0,5).map(lr => (
                  <tr key={lr.id}>
                    <td style={{ fontWeight:500 }}>{lr.employee}</td>
                    <td style={{ color:'var(--on-surface-variant)', fontSize:'var(--font-size-sm)' }}>{lr.type}</td>
                    <td><span className="badge badge-draft">{lr.days}d</span></td>
                    <td><StatusBadge status={lr.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Payroll */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
          <div className="card-header">
            <div><div className="card-title">Payroll Overview</div><div className="card-subtitle">Recent payroll runs</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payroll')}>View All <ArrowRight size={14}/></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Period</th><th>Employees</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight:500 }}>{p.month} {p.year}</td>
                    <td>{p.employees}</td>
                    <td style={{ fontWeight:600, color:'var(--success)' }}>{p.total}</td>
                    <td><StatusBadge status={p.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Audit */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          <div className="card-header">
            <div><div className="card-title">Recent Activity</div><div className="card-subtitle">Audit trail</div></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
            {auditLogs.map(log => (
              <div key={log.id} style={{ display:'flex', alignItems:'flex-start', gap:'var(--space-3)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--primary-container)', marginTop:6, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:'var(--font-size-md)', fontWeight:500 }}>{log.action} — <span style={{ color:'var(--on-surface-variant)' }}>{log.target}</span></div>
                  <div style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>by {log.actor} · {log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
        @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
        .stat-card.error::before { background: var(--error); }
      `}</style>
    </div>
  );
}
