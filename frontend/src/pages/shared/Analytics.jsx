import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart2, CalendarDays, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { getAnalytics } from '../../services/analyticsService';
import PremiumHeader from '../../components/ui/PremiumHeader';
import StatCard from '../../components/ui/StatCard';

const TABS = [
  { key:'leave',      label:'Leave Analytics',     icon: CalendarDays },
  { key:'hours',      label:'Hours Worked',         icon: Clock        },
  { key:'attendance', label:'Monthly Attendance',   icon: TrendingUp   },
];

function BarRow({ label, value, max, color, suffix = '' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div style={{ marginBottom:'var(--space-3)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:'var(--font-size-sm)', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)', fontFamily:'monospace' }}>{value}{suffix}</span>
      </div>
      <div style={{ background:'var(--surface-container)', borderRadius:'var(--radius-full)', height:10, overflow:'hidden' }}>
        <motion.div style={{ height:'100%', background: color, borderRadius:'var(--radius-full)' }}
          initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.7, ease:'easeOut' }} />
      </div>
    </div>
  );
}

function StackedBar({ label, approved, pending, rejected }) {
  const total = approved + pending + rejected;
  return (
    <div style={{ marginBottom:'var(--space-3)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:'var(--font-size-sm)', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>Total: {total}</span>
      </div>
      <div style={{ display:'flex', height:12, borderRadius:'var(--radius-full)', overflow:'hidden', gap:2 }}>
        {total > 0 && <>
          <motion.div style={{ width:`${(approved/total)*100}%`, background:'var(--success)', minWidth:4 }} initial={{ width:0 }} animate={{ width:`${(approved/total)*100}%` }} transition={{ duration:0.7 }} title={`Approved: ${approved}`} />
          <motion.div style={{ width:`${(pending/total)*100}%`, background:'var(--warning)', minWidth:pending>0?4:0 }} initial={{ width:0 }} animate={{ width:`${(pending/total)*100}%` }} transition={{ duration:0.7, delay:0.1 }} title={`Pending: ${pending}`} />
          <motion.div style={{ width:`${(rejected/total)*100}%`, background:'var(--error)', minWidth:rejected>0?4:0 }} initial={{ width:0 }} animate={{ width:`${(rejected/total)*100}%` }} transition={{ duration:0.7, delay:0.2 }} title={`Rejected: ${rejected}`} />
        </>}
      </div>
      <div style={{ display:'flex', gap:'var(--space-4)', marginTop:4, fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>
        <span style={{ color:'var(--success)' }}>✓ {approved} approved</span>
        <span style={{ color:'var(--warning)' }}>🕐 {pending} pending</span>
        <span style={{ color:'var(--error)' }}>✗ {rejected} rejected</span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData]       = useState(null);
  const [activeTab, setTab]   = useState('leave');
  const [deptF, setDeptF]     = useState('All');

  useEffect(() => { getAnalytics().then(setData); }, []);
  if (!data) return <div className="loading-state">Loading analytics…</div>;

  const leaveData = deptF === 'All' ? data.leaveByDept : data.leaveByDept.filter(d => d.dept === deptF);

  return (
    <div>
      <PremiumHeader title="Analytics" subtitle="Leave, attendance and productivity insights for your team" />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={CalendarDays} label="Total Leave Days Taken" value={data.leaveByDept.reduce((s,d)=>s+d.approved,0)} gradient="linear-gradient(135deg, #10b981, #059669)" delay={0} />
        <StatCard icon={AlertCircle} label="Pending Approvals" value={data.leaveByDept.reduce((s,d)=>s+d.pending,0)} gradient="linear-gradient(135deg, #f59e0b, #d97706)" delay={0.08} />
        <StatCard icon={Clock} label="Avg Hours (Apr)" value={`${Math.round(data.hoursWorked.reduce((s,e)=>s+e.hours,0)/data.hoursWorked.length)}h`} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" delay={0.16} />
        <StatCard icon={TrendingUp} label="Attendance Rate (Apr)" value={`${Math.round((data.monthlyAttendance.find(m=>m.month==='Apr')?.present/26)*100)}%`} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" delay={0.24} />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:'var(--space-4)' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leave' && (
          <motion.div key="leave" className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div className="card-header">
              <div className="card-title">Leave by Department</div>
              <select className="form-select" style={{ width:180, padding:'6px 10px', fontSize:'var(--font-size-sm)' }} value={deptF} onChange={e => setDeptF(e.target.value)}>
                <option>All</option>
                {data.leaveByDept.map(d => <option key={d.dept}>{d.dept}</option>)}
              </select>
            </div>
            <div style={{ marginTop:'var(--space-2)' }}>
              {leaveData.map(d => <StackedBar key={d.dept} label={d.dept} approved={d.approved} pending={d.pending} rejected={d.rejected} />)}
            </div>
            <div style={{ marginTop:'var(--space-3)', padding:'var(--space-3)', background:'var(--surface-container-low)', borderRadius:'var(--radius-md)', fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>
              💡 Bars show approved (green) / pending (orange) / rejected (red) proportions per department.
            </div>
          </motion.div>
        )}

        {activeTab === 'hours' && (
          <motion.div key="hours" className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div className="card-title" style={{ marginBottom:'var(--space-4)' }}>Hours Worked — April 2026</div>
            {data.hoursWorked.map(e => (
              <BarRow key={e.employee} label={e.employee} value={e.hours} max={e.target} color={e.hours >= e.target*0.9 ? 'var(--success)' : e.hours >= e.target*0.7 ? 'var(--warning)' : 'var(--error)'} suffix={`h / ${e.target}h`} />
            ))}
            <div style={{ marginTop:'var(--space-3)', padding:'var(--space-3)', background:'var(--surface-container-low)', borderRadius:'var(--radius-md)', fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>
              🟢 ≥ 90% of target &nbsp;&nbsp; 🟡 70–90% &nbsp;&nbsp; 🔴 &lt; 70%
            </div>
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div key="attendance" className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div className="card-title" style={{ marginBottom:'var(--space-4)' }}>Monthly Attendance Trend — 2026</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'var(--space-3)' }}>
              {data.monthlyAttendance.map(m => {
                const total = m.present + m.absent + m.late;
                return (
                  <div key={m.month} style={{ textAlign:'center', padding:'var(--space-3)', background:'var(--surface-container-low)', borderRadius:'var(--radius-md)' }}>
                    <div style={{ fontWeight:700, fontSize:'var(--font-size-sm)', marginBottom:'var(--space-2)', color:'var(--on-surface-variant)' }}>{m.month}</div>
                    <div style={{ height:80, display:'flex', alignItems:'flex-end', justifyContent:'center', gap:4 }}>
                      {[
                        { val:m.present, color:'var(--success)',  label:'P' },
                        { val:m.late,    color:'var(--warning)',  label:'L' },
                        { val:m.absent,  color:'var(--error)',    label:'A' },
                      ].map(bar => (
                        <div key={bar.label} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          <div style={{ fontSize:9, color:'var(--on-surface-variant)', marginBottom:2 }}>{bar.val}</div>
                          <motion.div style={{ width:18, background:bar.color, borderRadius:3 }} initial={{ height:0 }} animate={{ height: Math.max((bar.val/26)*70, 3) }} transition={{ duration:0.6 }} />
                          <div style={{ fontSize:9, color:'var(--on-surface-variant)', marginTop:2 }}>{bar.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
