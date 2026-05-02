import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, LogIn, LogOut, Calendar, CheckCircle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { attendanceLogs } from '../../utils/mockData';

export default function AttendanceTracker() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState(null);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleClock = () => {
    setClockedIn(c => !c);
    setClockTime(timeStr);
  };

  return (
    <div>
      <h1 className="page-title">Attendance Tracker</h1>
      <p className="page-subtitle">Mark your attendance and view your timesheet logs</p>

      {/* Clock Widget */}
      <motion.div
        className="card"
        style={{ maxWidth: 560, marginBottom: 'var(--space-6)', background: clockedIn ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderColor: clockedIn ? 'var(--success)' : 'var(--outline-variant)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
              <Clock size={16} color="var(--on-surface-variant)" />
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{dateStr}</span>
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {timeStr}
            </div>
            {clockTime && (
              <div style={{ marginTop: 8, fontSize: 'var(--font-size-sm)', color: clockedIn ? 'var(--success)' : 'var(--error)' }}>
                {clockedIn ? `✅ Clocked in at ${clockTime}` : `✗ Clocked out at ${clockTime}`}
              </div>
            )}
          </div>
          <motion.button
            className={`btn btn-lg ${clockedIn ? 'btn-danger' : 'btn-success'}`}
            onClick={handleClock}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ minWidth: 160 }}
          >
            {clockedIn ? <><LogOut size={18} /> Clock Out</> : <><LogIn size={18} /> Clock In</>}
          </motion.button>
        </div>

        {clockedIn && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
              <div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Check In</div><div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{clockTime}</div></div>
              <div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Working Hours</div><div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>0h 00m</div></div>
              <div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div><StatusBadge status="present" /></div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Monthly Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--space-4)' }}>
        {[
          { label: 'Present', value: 18, status: 'present', color: 'var(--success)' },
          { label: 'Absent', value: 2, status: 'absent', color: 'var(--error)' },
          { label: 'Late', value: 3, status: 'late', color: 'var(--warning)' },
          { label: 'Working Hrs', value: '162h', status: null, color: 'var(--primary-container)' },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label} (April)</div>
          </motion.div>
        ))}
      </div>

      {/* Attendance Log */}
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Attendance Log</div>
            <div className="card-subtitle">Your daily attendance history</div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <select className="form-select" style={{ width: 120, padding: '6px 10px', fontSize: 'var(--font-size-sm)' }}>
              <option>May 2026</option>
              <option>April 2026</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLogs.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <td style={{ fontWeight: 500 }}>{log.date}</td>
                  <td>{log.checkIn || <span style={{ color: 'var(--outline)' }}>—</span>}</td>
                  <td>{log.checkOut || <span style={{ color: 'var(--outline)' }}>—</span>}</td>
                  <td style={{ fontFamily: 'monospace' }}>{log.hours}</td>
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
