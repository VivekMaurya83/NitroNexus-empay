import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CalendarDays, FileText, Users, ArrowRight,
  CheckCircle, AlertCircle, RefreshCw, TrendingUp
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { getLeaveRequests, getLeaveAllocations } from '../../services/leaveService';
import { getMonthlySummary } from '../../services/attendanceService';
import { getEmployees } from '../../services/employeeService';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import PremiumHeader from '../../components/ui/PremiumHeader';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6'];


/* ── main component ──────────────────────────────────────────── */
export default function EmployeePortal() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [todayRecord,  setTodayRecord]  = useState(null);
  const [allocations,  setAllocations]  = useState([]);
  const [myLeaves,     setMyLeaves]     = useState([]);
  const [monthStats,   setMonthStats]   = useState(null);
  const [teamCount,    setTeamCount]    = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const now = new Date();

    const load = async () => {
      setLoading(true);
      try {
        // Always fetch team list first
        const emps = await getEmployees().catch(() => []);
        setTeamCount(emps.filter(e => e.status === 'active').length);

        // Resolve employeeId: use token value, else match by email
        let empId = user?.employeeId;
        if (!empId && user?.email) {
          const matched = emps.find(e => e.email?.toLowerCase() === user.email.toLowerCase());
          if (matched) empId = matched.employeeId;
        }

        // Fetch leave requests (all if no empId, else filtered)
        const leaves = await getLeaveRequests(empId ? { employeeId: empId } : {}).catch(() => []);
        setMyLeaves(leaves.slice(0, 6));

        if (empId) {
          const [alloc, summary, todayRec] = await Promise.all([
            getLeaveAllocations(empId).catch(() => []),
            getMonthlySummary(empId, now.getMonth()+1, now.getFullYear()).catch(() => null),
            api.get('/attendance/today').catch(() => null),
          ]);
          setAllocations(alloc);
          setMonthStats(summary);
          if (todayRec && !Array.isArray(todayRec)) {
            const ci = todayRec.check_in;
            setTodayRecord({ checkIn: ci ? new Date(ci).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : null });
          }
        }
      } catch(e) {
        console.warn('Portal load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.employeeId, user?.email]);

  /* derived data */
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const gEmoji   = hour < 12 ? '☀️' : hour < 17 ? '👋' : '🌙';

  const pendingLeaves  = myLeaves.filter(l => l.status === 'pending').length;
  const totalBalance   = allocations.reduce((s, a) => s + (a.remaining ?? (a.allocated - a.used)), 0);
  const presentDays    = monthStats?.presentDays ?? 0;

  /* chart data */
  const attendancePieData = monthStats ? [
    { name:'Present', value: monthStats.presentDays ?? 0, fill:'#10b981' },
    { name:'Late',    value: monthStats.lateDays    ?? 0, fill:'#f59e0b' },
    { name:'Absent',  value: monthStats.absentDays  ?? 0, fill:'#ef4444' },
    { name:'Half Day',value: monthStats.halfDays    ?? 0, fill:'#6366f1' },
  ].filter(d => d.value > 0) : [];

  const leaveBalanceData = allocations.map(a => ({
    name:      a.leaveType || `Policy #${a.policyId}`,
    remaining: a.remaining ?? (a.allocated - a.used),
    used:      a.used ?? 0,
    total:     a.allocated ?? 0,
  }));

  const statusCounts = myLeaves.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const STATUS_COLORS_MAP = { pending:'#f59e0b', hr_approved:'#0ea5e9', approved:'#16a34a', rejected:'#ef4444', cancelled:'#94a3b8' };
  const STATUS_LABEL      = { pending:'Pending', hr_approved:'HR Approved', approved:'Approved', rejected:'Rejected', cancelled:'Cancelled' };

  return (
    <div style={{ maxWidth:1300 }}>
      {/* Welcome banner */}
      <PremiumHeader
        pretitle={`${greeting} ${gEmoji}`}
        title={user?.name || 'Welcome'}
        subtitle={`${user?.designation || user?.role?.replace('_',' ')} · ${user?.company || 'Your Company'}`}
      >
        {todayRecord ? (
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.12)',
            padding:'7px 16px',borderRadius:99,fontSize:13,border:'1px solid rgba(255,255,255,0.15)' }}>
            <CheckCircle size={14} color="#4ade80" />
            {todayRecord.checkIn ? `Clocked in at ${todayRecord.checkIn}` : 'Not clocked in yet'}
          </div>
        ) : !loading && user?.employeeId ? (
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',
            padding:'7px 16px',borderRadius:99,fontSize:13,border:'1px solid rgba(255,255,255,0.1)' }}>
            <AlertCircle size={14} color="#fbbf24" /> No attendance record today
          </div>
        ) : null}
        <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',
          padding:'7px 16px',borderRadius:99,fontSize:13,border:'1px solid rgba(255,255,255,0.1)' }}>
          <CalendarDays size={14} />
          {new Date().toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long' })}
        </div>
      </PremiumHeader>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <StatCard icon={Clock}        label="Days Present"    value={loading?'—':presentDays}     sub="This month"         gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" />
        <StatCard icon={CalendarDays} label="Leave Balance"   value={loading?'—':totalBalance}    sub="Days remaining"     gradient="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard icon={FileText}     label="Pending Leaves"  value={loading?'—':pendingLeaves}   sub="Awaiting approval"  gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
        <StatCard icon={Users}        label="Team Members"    value={loading?'—':(teamCount??'—')} sub="Active employees"  gradient="linear-gradient(135deg,#3b82f6,#2563eb)" />
      </div>

      {/* Leave Allocation Detail Cards */}
      {!loading && leaveBalanceData.length > 0 && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          style={{ marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Leave Allocations</div>
          <div style={{ fontSize:12, color:'var(--on-surface-variant)', marginBottom:14 }}>
            Your current leave entitlement for this year
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:14 }}>
            {leaveBalanceData.map((a, i) => {
              const pct = a.total > 0 ? Math.min(Math.round((a.used / a.total)*100), 100) : 0;
              const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : PIE_COLORS[i % PIE_COLORS.length];
              return (
                <motion.div key={a.name} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.15 + i*0.06 }}
                  style={{ background:'var(--surface-container-lowest)', border:`1px solid var(--outline-variant)`,
                    borderRadius:14, padding:'16px 18px', borderTop:`3px solid ${barColor}` }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:10, color:'var(--on-surface)' }}>{a.name}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                    {[
                      { label:'Total',     value: a.total,     color:'var(--on-surface)' },
                      { label:'Used',      value: a.used,      color:'#ef4444' },
                      { label:'Remaining', value: a.remaining, color:'#16a34a' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign:'center', background:'var(--surface-container)', borderRadius:10, padding:'8px 4px' }}>
                        <div style={{ fontSize:22, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
                        <div style={{ fontSize:10, color:'var(--on-surface-variant)', marginTop:3, fontWeight:600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'var(--surface-container)', borderRadius:99, height:7, overflow:'hidden' }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8, delay:0.3+i*0.05 }}
                      style={{ height:'100%', borderRadius:99, background:`linear-gradient(90deg,${barColor}99,${barColor})` }} />
                  </div>
                  <div style={{ fontSize:11, color:'var(--on-surface-variant)', marginTop:5, textAlign:'right' }}>{pct}% used</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Charts row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {/* Attendance donut */}
        <ChartCard title="Monthly Attendance" subtitle={`${new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}`} delay={0.2}>
          {loading ? (
            <div style={{ height:220, display:'flex',alignItems:'center',justifyContent:'center',color:'var(--on-surface-variant)' }}>
              <RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }} />
            </div>
          ) : attendancePieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {attendancePieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:10,fontSize:13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center' }}>
                {attendancePieData.map(d => (
                  <div key={d.name} style={{ display:'flex',alignItems:'center',gap:6,fontSize:12 }}>
                    <div style={{ width:10,height:10,borderRadius:'50%',background:d.fill }} />
                    <span>{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height:200,display:'flex',alignItems:'center',justifyContent:'center',
              color:'var(--on-surface-variant)',flexDirection:'column',gap:8 }}>
              <TrendingUp size={28} style={{ opacity:0.3 }} />
              <span style={{ fontSize:13 }}>No attendance data yet</span>
            </div>
          )}
        </ChartCard>

        {/* Leave balance bar */}
        <ChartCard title="Leave Balance" subtitle="Remaining days per leave type" delay={0.25}>
          {loading ? (
            <div style={{ height:220, display:'flex',alignItems:'center',justifyContent:'center',color:'var(--on-surface-variant)' }}>
              <RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }} />
            </div>
          ) : leaveBalanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaveBalanceData} margin={{ top:4, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                <Bar dataKey="remaining" fill="#6366f1" radius={[6,6,0,0]} name="Remaining" />
                <Bar dataKey="used"      fill="#e2e8f0" radius={[6,6,0,0]} name="Used" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:220,display:'flex',alignItems:'center',justifyContent:'center',
              color:'var(--on-surface-variant)',flexDirection:'column',gap:8 }}>
              <CalendarDays size={28} style={{ opacity:0.3 }} />
              <span style={{ fontSize:13 }}>No allocations found</span>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:20, marginBottom:20 }}>
        {/* Leave request status pie */}
        <ChartCard title="Leave Request Status" subtitle="All my requests breakdown" delay={0.3}>
          {statusPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={72} dataKey="value" paddingAngle={2}>
                    {statusPieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS_MAP[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v,n) => [v, STATUS_LABEL[n]||n]} contentStyle={{ borderRadius:10,fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex',flexDirection:'column',gap:8,marginTop:4 }}>
                {statusPieData.map(entry => (
                  <div key={entry.name} style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ width:10,height:10,borderRadius:'50%',background:STATUS_COLORS_MAP[entry.name]||'#94a3b8' }} />
                      <span style={{ fontSize:13 }}>{STATUS_LABEL[entry.name]||entry.name}</span>
                    </div>
                    <span style={{ fontWeight:700,fontSize:13 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height:200,display:'flex',alignItems:'center',justifyContent:'center',
              color:'var(--on-surface-variant)',flexDirection:'column',gap:8 }}>
              <FileText size={28} style={{ opacity:0.3 }} />
              <span style={{ fontSize:13 }}>No leave requests yet</span>
            </div>
          )}
        </ChartCard>

        {/* Recent leave table */}
        <ChartCard title="My Leave Requests" subtitle="Recent applications"
          delay={0.35} style={{ padding:0 }}>
          <div style={{ padding:'16px 22px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>My Leave Requests</div>
              <div style={{ fontSize:12,color:'var(--on-surface-variant)',marginTop:2 }}>Recent applications</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leave')}>View All <ArrowRight size={13} /></button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} style={{ textAlign:'center',padding:24,color:'var(--on-surface-variant)' }}>
                    <RefreshCw size={16} style={{ animation:'spin 1s linear infinite',display:'inline-block',marginRight:8 }} />
                    Loading…
                  </td></tr>
                )}
                {!loading && myLeaves.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center',padding:28,color:'var(--on-surface-variant)' }}>
                    <CalendarDays size={22} style={{ opacity:0.3,display:'block',margin:'0 auto 8px' }} />
                    No leave requests yet
                  </td></tr>
                )}
                {myLeaves.map((lr,i) => (
                  <motion.tr key={lr.id||i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}>
                    <td><span className="badge badge-draft">{lr.type}</span></td>
                    <td style={{ fontFamily:'monospace',fontSize:12 }}>{lr.from}</td>
                    <td style={{ fontFamily:'monospace',fontSize:12 }}>{lr.to}</td>
                    <td><span className="badge badge-draft">{lr.days}d</span></td>
                    <td><StatusBadge status={lr.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
