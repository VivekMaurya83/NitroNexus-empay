import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, AlertCircle, DollarSign, ArrowRight,
  Bell, RefreshCw, TrendingUp, Calendar, Clock,
  Activity
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminAlerts from './AdminAlerts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getEmployees } from '../../services/employeeService';
import { getLeaveRequests } from '../../services/leaveService';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function StatCard({ icon: Icon, label, value, sub, color, gradient, delay = 0 }) {
  return (
    <motion.div variants={fadeUp} transition={{ delay }}
      style={{
        background: gradient,
        borderRadius: 16,
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', top: 10, right: 24, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, display: 'flex' }}>
        <Icon size={20} color="#fff" />
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.7 }}>{sub}</div>}
    </motion.div>
  );
}


function AttendanceBar({ present, total }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--on-surface-variant)' }}>Attendance Rate Today</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-container)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--on-surface-variant)' }}>
        <span>{present} present</span><span>{total - present} absent / no record</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [stats,      setStats]      = useState({ activeEmployees: 0, presentToday: 0, pendingLeaves: 0, totalPayruns: 0 });
  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [payruns,    setPayruns]    = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const status = await api.get('/companies/me/onboarding-status');
        if (!status.complete && !cancelled) { navigate('/admin/setup'); return; }
      } catch {}

      setLoading(true);
      try {
        const [empList, leaveList, payrunData] = await Promise.all([
          getEmployees().catch(() => []),
          getLeaveRequests().catch(() => []),
          api.get('/payroll/runs').catch(() => []),
        ]);

        if (cancelled) return;

        const active = empList.filter(e => e.status === 'active');
        setEmployees(empList);

        const today = new Date().toISOString().split('T')[0];
        const attData = await api.get(`/attendance/?date=${today}&limit=100`).catch(() => null);
        if (!cancelled) {
          const attList = attData?.records || attData || [];
          const present = attList.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'work_from_home').length;

          // Resolve names
          const empMap = {};
          empList.forEach(e => { empMap[e.employeeId] = e; });
          const enriched = attList.slice(0, 6).map(a => ({
            ...a,
            resolvedName: empMap[a.employee_id]?.name || `Employee #${a.employee_id}`,
            resolvedAvatar: empMap[a.employee_id]?.avatar || String(a.employee_id)[0]?.toUpperCase(),
            resolvedColor: empMap[a.employee_id]?.photoColor || '#6366f1',
          }));

          setAttendance(enriched);
          setStats(s => ({ ...s, activeEmployees: active.length, presentToday: present }));
        }

        const pending = leaveList.filter(l => l.status === 'pending');
        setLeaves(leaveList.slice(0, 5));
        setPayruns((payrunData || []).slice(0, 4));
        setStats(s => ({ ...s, pendingLeaves: pending.length, totalPayruns: (payrunData || []).length }));

        const audit = await api.get('/analytics/audit-logs?limit=6').catch(() => []);
        if (!cancelled) setAuditLogs(audit || []);
      } catch (e) {
        console.warn('Dashboard load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 4 }}>
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            Here's what's happening at <strong>{user?.company || 'your company'}</strong> — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button className="btn btn-secondary" onClick={() => window.location.reload()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <RefreshCw size={15} /> Refresh
          </motion.button>
          <motion.button className={`btn ${alertsOpen ? 'btn-danger' : 'btn-primary'}`} onClick={() => setAlertsOpen(o => !o)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Bell size={15} /> {alertsOpen ? 'Hide Alerts' : 'Alerts'}
          </motion.button>
        </div>
      </div>

      {/* Alerts panel */}
      {alertsOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{ marginBottom: 24, background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 16, padding: 20, borderLeft: '4px solid var(--error)' }}>
          <AdminAlerts embedded />
        </motion.div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--on-surface-variant)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
          <div style={{ marginTop: 10 }}>Loading dashboard…</div>
        </div>
      )}

      {/* Stat Cards */}
      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard icon={Users}       label="Active Employees"  value={stats.activeEmployees} sub={`${employees.length} total`}           gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" />
        <StatCard icon={CheckCircle} label="Present Today"     value={stats.presentToday}    sub={`of ${stats.activeEmployees} employees`} gradient="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard icon={AlertCircle} label="Pending Leaves"    value={stats.pendingLeaves}   sub="awaiting approval"                      gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
        <StatCard icon={DollarSign}  label="Payroll Runs"      value={stats.totalPayruns}    sub="all time"                               gradient="linear-gradient(135deg,#3b82f6,#2563eb)" />
      </motion.div>

      {/* Attendance Rate Bar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 16, padding: '16px 24px', marginBottom: 20 }}>
        <AttendanceBar present={stats.presentToday} total={stats.activeEmployees} />
      </motion.div>


      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Today's Attendance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Today's Attendance</div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>Live check-in board</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/status-board')}>View All <ArrowRight size={13} /></button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Check In</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.length > 0 ? attendance.map(a => (
                  <tr key={a.id || a.employee_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: a.resolvedColor, fontSize: 12 }}>{a.resolvedAvatar}</div>
                        <span style={{ fontWeight: 600 }}>{a.resolvedName}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{a.check_in_time || (a.check_in ? new Date(a.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—')}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 32, color: 'var(--on-surface-variant)' }}>
                    <Clock size={24} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    No attendance records today
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Leave Requests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Leave Requests</div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                <span style={{ color: stats.pendingLeaves > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{stats.pendingLeaves} pending</span> approval
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>View All <ArrowRight size={13} /></button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.length > 0 ? leaves.map(lr => (
                  <tr key={lr.id}>
                    <td style={{ fontWeight: 600 }}>{lr.employee}</td>
                    <td style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>{lr.type}</td>
                    <td><span className="badge badge-draft">{lr.days}d</span></td>
                    <td><StatusBadge status={lr.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--on-surface-variant)' }}>
                    <Calendar size={24} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    No leave requests
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Payroll Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Payroll Overview</div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>Recent payroll runs</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payroll')}>View All <ArrowRight size={13} /></button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Period</th><th>Employees</th><th>Net Total</th><th>Status</th></tr></thead>
              <tbody>
                {payruns.length > 0 ? payruns.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{String(p.month).padStart(2, '0')}/{p.year}</td>
                    <td><span className="badge badge-draft">{p.employee_count} emp</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(p.total_net || 0).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--on-surface-variant)' }}>
                    <DollarSign size={24} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    No payroll runs yet
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Activity</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>Audit trail</div>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {auditLogs.length > 0 ? auditLogs.map((log, i) => (
              <div key={log.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < auditLogs.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={14} color="var(--primary-container)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{log.action?.replace(/_/g, ' ')} <span style={{ fontWeight: 400, color: 'var(--on-surface-variant)' }}>on {log.entity_type}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                    {log.description || `by user #${log.user_id}`} · {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--on-surface-variant)' }}>
                <TrendingUp size={24} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                No recent activity
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .db-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
