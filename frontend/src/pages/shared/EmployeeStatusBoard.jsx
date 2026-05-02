import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { getTodayStatusBoard } from '../../services/attendanceService';

const DEPT_FILTERS = ['All', 'Engineering', 'HR', 'Finance', 'Design', 'Analytics', 'Product'];
const STATUS_FILTERS = ['All', 'present', 'late', 'absent'];

export default function EmployeeStatusBoard() {
  const [board, setBoard]     = useState([]);
  const [search, setSearch]   = useState('');
  const [deptF, setDeptF]     = useState('All');
  const [statusF, setStatusF] = useState('All');
  const [view, setView]       = useState('grid'); // grid | table

  useEffect(() => {
    getTodayStatusBoard().then(setBoard);
  }, []);

  const filtered = board.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.designation.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptF   === 'All' || e.department === deptF;
    const matchStatus = statusF === 'All' || e.status     === statusF;
    return matchSearch && matchDept && matchStatus;
  });

  const stats = {
    present: board.filter(e => e.status === 'present').length,
    late:    board.filter(e => e.status === 'late').length,
    absent:  board.filter(e => e.status === 'absent').length,
  };

  return (
    <div>
      <h1 className="page-title">Employee Status Board</h1>
      <p className="page-subtitle">Live today's check-in / check-out status for all employees</p>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'var(--space-4)' }}>
        {[
          { label:'Present Today', value: stats.present, color:'var(--success)'  },
          { label:'Late',          value: stats.late,    color:'var(--warning)'  },
          { label:'Absent',        value: stats.absent,  color:'var(--error)'    },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.08 }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom:'var(--space-4)' }}>
        <div className="search-wrap" style={{ flex:1, maxWidth:300 }}>
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" placeholder="Search name or role…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="filter-chips">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-chip ${statusF === s ? 'active' : ''}`} onClick={() => setStatusF(s)}>
              {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <select className="form-select" style={{ width:160, padding:'7px 12px', fontSize:'var(--font-size-sm)' }} value={deptF} onChange={e => setDeptF(e.target.value)}>
          {DEPT_FILTERS.map(d => <option key={d}>{d}</option>)}
        </select>

        <div className="filter-chips">
          <button className={`filter-chip ${view === 'grid'  ? 'active' : ''}`} onClick={() => setView('grid')}>Grid</button>
          <button className={`filter-chip ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>Table</button>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'var(--space-3)' }}>
          {filtered.map((emp, i) => (
            <motion.div key={emp.employeeId} className="card card-sm" style={{ textAlign:'center' }}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y:-3, boxShadow:'var(--shadow-lg)' }}
            >
              <div className="avatar avatar-lg" style={{ margin:'0 auto var(--space-3)', background: emp.photoColor, fontSize:20 }}>{emp.avatar}</div>
              <div style={{ fontWeight:700, fontSize:'var(--font-size-md)', marginBottom:2 }}>{emp.name}</div>
              <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginBottom:4 }}>{emp.designation}</div>
              <div><span className="badge badge-draft" style={{ fontSize:11 }}>{emp.department}</span></div>
              <div style={{ marginTop:'var(--space-3)', paddingTop:'var(--space-3)', borderTop:'1px solid var(--outline-variant)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>
                  <div>In: <strong>{emp.checkIn || '—'}</strong></div>
                  <div>Out: <strong>{emp.checkOut || '—'}</strong></div>
                </div>
                <StatusBadge status={emp.status} />
              </div>
              <div style={{ marginTop:'var(--space-2)', fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>
                Present this month: <strong style={{ color:'var(--success)' }}>{emp.daysPresent ?? '—'} days</strong>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <motion.div className="card" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Days Present</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <motion.tr key={emp.employeeId} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar avatar-sm" style={{ background: emp.photoColor }}>{emp.avatar}</div>
                        <span style={{ fontWeight:600 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--on-surface-variant)' }}>{emp.designation}</td>
                    <td><span className="badge badge-draft">{emp.department}</span></td>
                    <td style={{ fontFamily:'monospace', fontWeight:500 }}>{emp.checkIn  || <span style={{ color:'var(--outline)' }}>—</span>}</td>
                    <td style={{ fontFamily:'monospace', fontWeight:500 }}>{emp.checkOut || <span style={{ color:'var(--outline)' }}>—</span>}</td>
                    <td><strong style={{ color:'var(--success)' }}>{emp.daysPresent ?? '—'}</strong> days</td>
                    <td><StatusBadge status={emp.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--space-8)', color:'var(--on-surface-variant)' }}>No employees match your filters.</div>
      )}
    </div>
  );
}
