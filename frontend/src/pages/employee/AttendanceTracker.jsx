import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, LogIn, LogOut, Download } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import {
  clockIn, clockOut, getMyTodayRecord, getMonthlySummary,
  getAttendanceRange, getTodayStatusBoard,
} from '../../services/attendanceService';
import StatCard from '../../components/ui/StatCard';
import PremiumHeader from '../../components/ui/PremiumHeader';

const DEPT_FILTERS   = ['All','Engineering','HR','Finance','Design','Analytics','Product'];
const STATUS_FILTERS = ['All','present','late','absent','work_from_home','on_leave'];

export default function AttendanceTracker() {
  const { user } = useAuth();
  const isEmployee = user?.role === ROLES.EMPLOYEE;

  const [todayRecord,  setTodayRecord]  = useState(null);
  const [myLogs,       setMyLogs]       = useState([]);
  const [mySummary,    setMySummary]    = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [allLogs,  setAllLogs]  = useState([]);
  const [deptF,    setDeptF]    = useState('All');
  const [statusF,  setStatusF]  = useState('All');

  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-IN',{ hour:'2-digit', minute:'2-digit', hour12:true });
  const dateStr = now.toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  const [adminDate, setAdminDate] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`);

  useEffect(() => {
    if (isEmployee && user?.employeeId) {
      getMyTodayRecord().then(r => setTodayRecord(r));
    }
  }, [isEmployee, user?.employeeId]);

  useEffect(() => {
    if (isEmployee && user?.employeeId) {
      const [y, m] = selectedMonth.split('-');
      getMonthlySummary(user.employeeId, parseInt(m), parseInt(y)).then(setMySummary);
      const start = `${selectedMonth}-01`;
      const isCurrentMonth = selectedMonth === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const end = isCurrentMonth 
        ? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
        : new Date(y, m, 0).toISOString().split('T')[0];
      getAttendanceRange(user.employeeId, start, end).then(setMyLogs);
    }
  }, [isEmployee, user?.employeeId, selectedMonth]);

  useEffect(() => {
    if (!isEmployee) {
      getTodayStatusBoard(adminDate).then(setAllLogs);
    }
  }, [isEmployee, adminDate]);

  const handleClockIn = async () => {
    if (!user?.employeeId) return;
    setClockLoading(true);
    try {
      const rec = await clockIn(user.employeeId);
      // Store attendance record ID — required for checkout endpoint
      setTodayRecord({ id: rec.id || rec.attendanceId, checkIn: rec.checkIn, status:'present' });
    } finally { setClockLoading(false); }
  };

  const handleClockOut = async () => {
    if (!todayRecord?.id) return;
    setClockLoading(true);
    try {
      const rec = await clockOut(todayRecord.id);
      setTodayRecord(r => ({ ...r, checkOut: rec.checkOut, hours: rec.hours }));
    } finally { setClockLoading(false); }
  };

  const isClockedIn  = !!todayRecord?.checkIn  && !todayRecord?.checkOut;
  const isClockedOut = !!todayRecord?.checkIn  && !!todayRecord?.checkOut;

  const filteredAll = allLogs.filter(a => {
    const matchDept   = deptF   === 'All' || a.department === deptF;
    const matchStatus = statusF === 'All' || a.status     === statusF;
    return matchDept && matchStatus;
  });

  if (isEmployee) {
    return (
      <div>
        <PremiumHeader 
          title="My Attendance" 
          subtitle="Clock in / out and view your monthly history" 
        />

        <motion.div className="card" style={{ maxWidth:560, marginBottom:'var(--space-6)',
          background: isClockedIn ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
          borderColor: isClockedIn ? 'var(--success)' : 'var(--outline-variant)' }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--space-4)' }}>
            <div>
              <div style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)', marginBottom:4 }}><Clock size={13} style={{ verticalAlign:'middle', marginRight:4 }}/>{dateStr}</div>
              <div style={{ fontSize:44, fontWeight:800, letterSpacing:'-0.03em', lineHeight:1 }}>{timeStr}</div>
              {todayRecord?.checkIn  && <div style={{ marginTop:8, fontSize:'var(--font-size-sm)', color:'var(--success)' }}>✅ In: <strong>{todayRecord.checkIn}</strong></div>}
              {todayRecord?.checkOut && <div style={{ marginTop:4, fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>⏏ Out: <strong>{todayRecord.checkOut}</strong></div>}
            </div>
            <motion.button
              className={`btn btn-lg ${isClockedIn ? 'btn-danger' : 'btn-success'}`}
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              disabled={clockLoading || isClockedOut}
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }} style={{ minWidth:150 }}>
              {clockLoading ? '…' : isClockedIn
                ? <><LogOut size={17}/> Clock Out</>
                : <><LogIn size={17}/> Clock In</>}
            </motion.button>
          </div>
          {todayRecord?.checkIn && (
            <div style={{ marginTop:'var(--space-4)', paddingTop:'var(--space-4)', borderTop:'1px solid var(--outline-variant)', display:'flex', gap:'var(--space-6)', flexWrap:'wrap', alignItems:'center' }}>
              {[['Check In', todayRecord.checkIn],['Check Out', todayRecord.checkOut],['Hours', todayRecord.hours]].map(([l,v])=>v&&(
                <div key={l}><div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', fontWeight:700, textTransform:'uppercase' }}>{l}</div><div style={{ fontWeight:700, fontFamily:'monospace', fontSize:'var(--font-size-lg)' }}>{v}</div></div>
              ))}
              <div style={{ marginLeft:'auto' }}><StatusBadge status={todayRecord.status||'present'}/></div>
            </div>
          )}
        </motion.div>

        <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'var(--space-4)' }}>
          {[
            { label:'Present',  value: mySummary?.presentDays ?? '—', color:'var(--success)' },
            { label:'Absent',   value: mySummary?.absentDays  ?? '—', color:'var(--error)'   },
            { label:'Late',     value: mySummary?.lateDays    ?? '—', color:'var(--warning)'  },
            { label:'Hrs (mo)', value: mySummary?.totalHours ? `${Math.round(mySummary.totalHours)}h` : '—', color:'var(--primary-container)' },
          ].map((s,i)=>(
            <motion.div key={s.label} className="stat-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
              <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Attendance History</div>
            <input 
              type="month" 
              className="form-select" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-size-sm)' }} 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
            />
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Remarks</th><th>Status</th></tr></thead>
              <tbody>
                {myLogs.map((log,i)=>(
                  <motion.tr key={log.id||i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}>
                    <td style={{ fontWeight:500 }}>{log.date}</td>
                    <td style={{ fontFamily:'monospace' }}>{log.checkIn  || '—'}</td>
                    <td style={{ fontFamily:'monospace' }}>{log.checkOut || '—'}</td>
                    <td style={{ fontFamily:'monospace' }}>{log.hours}</td>
                    <td style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{log.remarks || '—'}</td>
                    <td><StatusBadge status={log.status}/></td>
                  </motion.tr>
                ))}
                {myLogs.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--on-surface-variant)', padding:'var(--space-6)' }}>No records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PremiumHeader 
        title="Attendance Management" 
        subtitle="Daily check-in status for all employees"
        actionRight={
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              type="date" 
              className="form-select" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: 'var(--font-size-sm)' }} 
              value={adminDate} 
              onChange={e => setAdminDate(e.target.value)} 
            />
            <motion.button className="btn" style={{ background: '#fff', color: 'var(--primary)' }} whileHover={{ scale:1.02 }}>
              <Download size={16}/> Export
            </motion.button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Present" value={allLogs.filter(a=>a.status==='present').length} gradient="linear-gradient(135deg, #10b981, #059669)" delay={0} />
        <StatCard label="Late" value={allLogs.filter(a=>a.status==='late').length} gradient="linear-gradient(135deg, #f59e0b, #d97706)" delay={0.08} />
        <StatCard label="Absent" value={allLogs.filter(a=>a.status==='absent').length} gradient="linear-gradient(135deg, #ef4444, #dc2626)" delay={0.16} />
        <StatCard label="WFH" value={allLogs.filter(a=>a.status==='work_from_home').length} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" delay={0.24} />
      </div>

      <div className="filter-bar" style={{ marginBottom:'var(--space-4)' }}>
        <div className="filter-chips">
          {STATUS_FILTERS.map(s=>(
            <button key={s} className={`filter-chip ${statusF===s?'active':''}`} onClick={()=>setStatusF(s)}>
              {s==='All'?'All Status':s==='work_from_home'?'WFH':s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <select className="form-select" style={{ width:160, padding:'7px 12px', fontSize:'var(--font-size-sm)' }} value={deptF} onChange={e=>setDeptF(e.target.value)}>
          {DEPT_FILTERS.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {filteredAll.map((a,i)=>(
                <motion.tr key={a.employeeId||i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}>
                  <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><div className="avatar avatar-sm" style={{ background:a.photoColor }}>{a.avatar}</div><span style={{ fontWeight:600 }}>{a.name}</span></div></td>
                  <td><span className="badge badge-draft">{a.department}</span></td>
                  <td style={{ fontFamily:'monospace' }}>{a.checkIn  || '—'}</td>
                  <td style={{ fontFamily:'monospace' }}>{a.checkOut || '—'}</td>
                  <td style={{ fontFamily:'monospace' }}>{a.hours    || '—'}</td>
                  <td><StatusBadge status={a.status}/></td>
                </motion.tr>
              ))}
              {filteredAll.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--on-surface-variant)', padding:'var(--space-6)' }}>No records.</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
