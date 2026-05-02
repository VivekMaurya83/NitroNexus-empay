import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, AlertCircle, DollarSign, ArrowRight, Bell, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminAlerts from './AdminAlerts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [alertsOpen, setAlertsOpen] = useState(false);

  const [stats,      setStats]      = useState({ activeEmployees: 0, presentToday: 0, pendingLeaves: 0 });
  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [payruns,    setPayruns]    = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Check onboarding first
      try {
        const status = await api.get('/companies/me/onboarding-status');
        if (!status.complete && !cancelled) {
          navigate('/admin/setup');
          return;
        }
      } catch (e) { console.warn('Onboarding check failed', e); }

      setLoading(true);
      try {
        const [empData, leaveData, payrunData] = await Promise.all([
          api.get('/employees/?limit=200').catch(() => null),
          api.get('/leaves/?limit=20').catch(() => null),
          api.get('/payroll/runs').catch(() => null),
        ]);

        if (cancelled) return;

        // Employees stats
        const empList = empData?.employees || empData || [];
        const activeEmployees = empList.filter(e => e.employment_status === 'active').length;
        setStats(s => ({ ...s, activeEmployees }));

        // Today attendance — pull from analytics or attendance endpoint
        const today = new Date().toISOString().split('T')[0];
        const attData = await api.get(`/attendance/?date=${today}&limit=50`).catch(() => null);
        if (!cancelled) {
          const attList = attData?.records || attData || [];
          const presentToday = attList.filter(a => a.status === 'present' || a.status === 'work_from_home').length;
          setStats(s => ({ ...s, presentToday }));
          setAttendance(attList.slice(0, 6));
        }

        // Leave requests
        const leaveList = leaveData?.leave_applications || leaveData || [];
        const pendingLeaves = leaveList.filter(l => l.status === 'pending').length;
        setStats(s => ({ ...s, pendingLeaves }));
        setLeaves(leaveList.slice(0, 5));

        // Payruns
        setPayruns((payrunData || []).slice(0, 4));

        // Audit logs (best-effort)
        const auditData = await api.get('/analytics/audit-logs?limit=6').catch(() => null);
        if (!cancelled) setAuditLogs(auditData || []);

      } catch (e) {
        console.warn('Dashboard load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here's what's happening at {user?.company} today.</p>
        </div>
        <motion.button
          className={`btn ${alertsOpen ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setAlertsOpen(o => !o)}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          <Bell size={16} /> {alertsOpen ? 'Hide Alerts' : 'Alerts'}
        </motion.button>
      </div>

      {alertsOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{ marginBottom: 'var(--space-5)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', borderLeft: '4px solid var(--error)' }}>
          <AdminAlerts embedded />
        </motion.div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--on-surface-variant)' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
          <div style={{ marginTop: 8 }}>Loading dashboard…</div>
        </div>
      )}

      {/* Stats */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show">
        <motion.div className="stat-card" variants={item}>
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-value">{stats.activeEmployees}</div>
          <div className="stat-label">Active Employees</div>
        </motion.div>
        <motion.div className="stat-card success" variants={item}>
          <div className="stat-icon" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stat-value">{stats.presentToday}</div>
          <div className="stat-label">Present Today</div>
        </motion.div>
        <motion.div className="stat-card warning" variants={item}>
          <div className="stat-icon" style={{ color: 'var(--warning)' }}><AlertCircle size={20} /></div>
          <div className="stat-value">{stats.pendingLeaves}</div>
          <div className="stat-label">Pending Leaves</div>
        </motion.div>
        <motion.div className="stat-card" variants={item}>
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div className="stat-value">{payruns.length}</div>
          <div className="stat-label">Payroll Runs</div>
        </motion.div>
      </motion.div>

      <div className="dashboard-grid">
        {/* Today's Attendance */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card-header">
            <div><div className="card-title">Today's Status</div><div className="card-subtitle">Live attendance board</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/status-board')}>View All <ArrowRight size={14} /></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Check In</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.length > 0 ? attendance.map(a => (
                  <tr key={a.id || a.employee_id}>
                    <td style={{ fontWeight: 500 }}>{a.employee_name || `Employee #${a.employee_id}`}</td>
                    <td style={{ fontFamily: 'monospace' }}>{a.check_in_time || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: 20 }}>No attendance records today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Leave Requests */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="card-header">
            <div><div className="card-title">Leave Requests</div><div className="card-subtitle">{stats.pendingLeaves} pending approval</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>View All <ArrowRight size={14} /></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.length > 0 ? leaves.map(lr => (
                  <tr key={lr.id}>
                    <td style={{ fontWeight: 500 }}>{lr.employee_name || `#${lr.employee_id}`}</td>
                    <td style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)', textTransform: 'capitalize' }}>{lr.leave_type}</td>
                    <td><span className="badge badge-draft">{lr.days_requested || '?'}d</span></td>
                    <td><StatusBadge status={lr.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: 20 }}>No pending leave requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Payroll */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="card-header">
            <div><div className="card-title">Payroll Overview</div><div className="card-subtitle">Recent payroll runs</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payroll')}>View All <ArrowRight size={14} /></button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Period</th><th>Employees</th><th>Net Total</th><th>Status</th></tr></thead>
              <tbody>
                {payruns.length > 0 ? payruns.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{String(p.month).padStart(2, '0')}/{p.year}</td>
                    <td>{p.employee_count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{Number(p.total_net || 0).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: 20 }}>No payroll runs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Audit */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="card-header">
            <div><div className="card-title">Recent Activity</div><div className="card-subtitle">Audit trail</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {auditLogs.length > 0 ? auditLogs.map((log, i) => (
              <div key={log.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-container)', marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>{log.action} — <span style={{ color: 'var(--on-surface-variant)' }}>{log.entity_type}</span></div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>by #{log.user_id} · {log.created_at ? new Date(log.created_at).toLocaleString() : ''}</div>
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)', padding: 8 }}>No recent activity</div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-4); }
        @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
