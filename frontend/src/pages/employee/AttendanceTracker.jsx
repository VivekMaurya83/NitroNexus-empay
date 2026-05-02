import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, LogIn, LogOut, Calendar, Download, Filter } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/mockData';
import { getMyAttendance, getAllAttendance, clockIn, clockOut } from '../../services/attendanceService';

const DEPT_FILTERS   = ['All', 'Engineering', 'HR', 'Finance', 'Design', 'Analytics', 'Product'];
const STATUS_FILTERS = ['All', 'present', 'late', 'absent'];

export default function AttendanceTracker() {
  const { user } = useAuth();
  const isEmployee = user?.role === ROLES.EMPLOYEE;

  // Employee state
  const [clockedIn,  setClockedIn]  = useState(false);
  const [checkInTs,  setCheckInTs]  = useState(null);
  const [checkOutTs, setCheckOutTs] = useState(null);
  const [myLogs,     setMyLogs]     = useState([]);

  // Admin/HR/Payroll state
  const [allLogs,    setAllLogs]    = useState([]);
  const [deptF,      setDeptF]      = useState('All');
  const [statusF,    setStatusF]    = useState('All');
  const [monthF,     setMonthF]     = useState('May 2026');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  useEffect(() => {
    if (isEmployee) {
      getMyAttendance(user.id).then(setMyLogs);
    } else {
      getAllAttendance().then(setAllLogs);
    }
  }, [isEmployee, user?.id]);

  const handleClockIn = async () => {
    const res = await clockIn(user.id);
    setClockedIn(true);
    setCheckInTs(res.checkIn || timeStr);
  };

  const handleClockOut = async () => {
    const res = await clockOut(user.id);
    setClockedIn(false);
    setCheckOutTs(res.checkOut || timeStr);
  };

  // Filter all-attendance
  const filteredAll = allLogs.filter(a => {
    const matchDept   = deptF   === 'All' || a.department === deptF;
    const matchStatus = statusF === 'All' || a.status     === statusF;
    return matchDept && matchStatus;
  });

  // ── Employee View ──────────────────────────────────────────────────────────
  if (isEmployee) {
    return (
      <div>
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">Track your daily clock-in / clock-out and view your history</p>

        {/* Clock Widget */}
        <motion.div className="card" style={{ maxWidth:560, marginBottom:'var(--space-6)', background: clockedIn ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderColor: clockedIn ? 'var(--success)' : 'var(--outline-variant)' }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--space-4)' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', marginBottom:4 }}>
                <Clock size={15} color="var(--on-surface-variant)" />
                <span style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{dateStr}</span>
              </div>
              <div style={{ fontSize:44, fontWeight:800, color:'var(--on-surface)', letterSpacing:'-0.03em', lineHeight:1 }}>{timeStr}</div>
              {checkInTs && (
                <div style={{ marginTop:8, fontSize:'var(--font-size-sm)', color:'var(--success)' }}>✅ Checked in at <strong>{checkInTs}</strong></div>
              )}
              {checkOutTs && !clockedIn && (
                <div style={{ marginTop:4, fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>⚪ Checked out at <strong>{checkOutTs}</strong></div>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
              <motion.button className={`btn btn-lg ${clockedIn ? 'btn-danger' : 'btn-success'}`} onClick={clockedIn ? handleClockOut : handleClockIn} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }} style={{ minWidth:150 }}>
                {clockedIn ? <><LogOut size={17}/> Clock Out</> : <><LogIn size={17}/> Clock In</>}
              </motion.button>
            </div>
          </div>

          {checkInTs && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              style={{ marginTop:'var(--space-4)', paddingTop:'var(--space-4)', borderTop:'1px solid var(--outline-variant)', display:'flex', gap:'var(--space-6)' }}>
              <div>
                <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Check In</div>
                <div style={{ fontWeight:700, fontFamily:'monospace', fontSize:'var(--font-size-lg)' }}>{checkInTs}</div>
              </div>
              {checkOutTs && (
                <div>
                  <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Check Out</div>
                  <div style={{ fontWeight:700, fontFamily:'monospace', fontSize:'var(--font-size-lg)' }}>{checkOutTs}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Status</div>
                <StatusBadge status="present" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Monthly stats */}
        <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'var(--space-4)' }}>
          {[
            { label:'Present', value:18, color:'var(--success)' },
            { label:'Absent',  value:2,  color:'var(--error)'   },
            { label:'Late',    value:3,  color:'var(--warning)'  },
            { label:'Working Hrs', value:'162h', color:'var(--primary-container)' },
          ].map((s,i) => (
            <motion.div key={s.label} className="stat-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
              <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
              <div className="stat-label">{s.label} (Apr)</div>
            </motion.div>
          ))}
        </div>

        {/* Log table */}
        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div className="card-header">
            <div className="card-title">Attendance History</div>
            <select className="form-select" style={{ width:130, padding:'6px 10px', fontSize:'var(--font-size-sm)' }}>
              <option>May 2026</option><option>April 2026</option>
            </select>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Working Hours</th><th>Status</th></tr></thead>
              <tbody>
                {myLogs.map((log, i) => (
                  <motion.tr key={log.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}>
                    <td style={{ fontWeight:500 }}>{log.date}</td>
                    <td style={{ fontFamily:'monospace' }}>{log.checkIn  || <span style={{ color:'var(--outline)' }}>—</span>}</td>
                    <td style={{ fontFamily:'monospace' }}>{log.checkOut || <span style={{ color:'var(--outline)' }}>—</span>}</td>
                    <td style={{ fontFamily:'monospace' }}>{log.hours}</td>
                    <td><StatusBadge status={log.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Admin / HR / Payroll View ──────────────────────────────────────────────
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">View and track attendance for all employees</p>
        </div>
        <motion.button className="btn btn-secondary" whileHover={{ scale:1.02 }}><Download size={16}/> Export</motion.button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:'var(--space-4)' }}>
        {[
          { label:'Present Today', value: filteredAll.filter(a=>a.status==='present').length, color:'var(--success)' },
          { label:'Late Today',    value: filteredAll.filter(a=>a.status==='late').length,    color:'var(--warning)' },
          { label:'Absent Today',  value: filteredAll.filter(a=>a.status==='absent').length,  color:'var(--error)'   },
          { label:'Total Tracked', value: filteredAll.length,                                 color:'var(--primary-container)' },
        ].map((s,i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom:'var(--space-4)' }}>
        <div className="filter-chips">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-chip ${statusF === s ? 'active' : ''}`} onClick={() => setStatusF(s)}>
              {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <select className="form-select" style={{ width:160, padding:'7px 12px', fontSize:'var(--font-size-sm)' }} value={deptF} onChange={e => setDeptF(e.target.value)}>
          {DEPT_FILTERS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="form-select" style={{ width:130, padding:'7px 12px', fontSize:'var(--font-size-sm)' }} value={monthF} onChange={e => setMonthF(e.target.value)}>
          <option>May 2026</option><option>April 2026</option>
        </select>
      </div>

      <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {filteredAll.map((a, i) => (
                <motion.tr key={a.employeeId + a.date} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}>
                  <td style={{ fontWeight:600 }}>{a.employee}</td>
                  <td><span className="badge badge-draft">{a.department}</span></td>
                  <td>{a.date}</td>
                  <td style={{ fontFamily:'monospace' }}>{a.checkIn  || <span style={{ color:'var(--outline)' }}>—</span>}</td>
                  <td style={{ fontFamily:'monospace' }}>{a.checkOut || <span style={{ color:'var(--outline)' }}>—</span>}</td>
                  <td style={{ fontFamily:'monospace' }}>{a.hours}</td>
                  <td><StatusBadge status={a.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
