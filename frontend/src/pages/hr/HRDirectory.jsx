import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, Eye, Edit, Trash2, Phone, Mail } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/mockData';
import { getEmployees } from '../../services/employeeService';

const DEPT_FILTERS   = ['All', 'Engineering', 'HR', 'Finance', 'Design', 'Analytics', 'Product'];
const STATUS_FILTERS = ['All', 'active', 'inactive'];

export default function HRDirectory() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isHR    = user?.role === ROLES.HR;
  // Both Admin and HR can see personal details; Payroll can't access this page (route guard handles it)

  const [search,  setSearch]  = useState('');
  const [deptF,   setDeptF]   = useState('All');
  const [statusF, setStatusF] = useState('All');
  const [emps,    setEmps]    = useState(() => {
    // Preload synchronously from mock for instant render; services refetch on mount
    const { employees } = require('../../utils/mockData');
    return employees;
  });

  React.useEffect(() => {
    getEmployees().then(setEmps);
  }, []);

  const filtered = emps.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptF   === 'All' || e.department === deptF;
    const matchStatus = statusF === 'All' || e.status     === statusF;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
        <div>
          <h1 className="page-title">HR Directory</h1>
          <p className="page-subtitle">Manage and view all employee profiles</p>
        </div>
        <motion.a href="/hr/add-employee" className="btn btn-primary" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
          <UserPlus size={16}/> Add Employee
        </motion.a>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom:'var(--space-4)' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:240 }}>
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, code, designation…" />
        </div>

        <div className="filter-chips">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`filter-chip ${statusF===s?'active':''}`} onClick={()=>setStatusF(s)}>
              {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>

        <select className="form-select" style={{ width:160, padding:'7px 12px', fontSize:'var(--font-size-sm)' }} value={deptF} onChange={e=>setDeptF(e.target.value)}>
          {DEPT_FILTERS.map(d => <option key={d}>{d}</option>)}
        </select>

        <span className="badge badge-present">{filtered.length} employees</span>
      </div>

      {/* Table */}
      <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Designation</th>
                <th>Department</th>
                {/* Personal details — visible to Admin and HR only */}
                {(isAdmin || isHR) && <th>Phone</th>}
                {(isAdmin || isHR) && <th>Bank Details</th>}
                {isAdmin           && <th>Manager</th>}
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const manager = emps.find(e => e.id === emp.managerId);
                return (
                  <motion.tr key={emp.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar avatar-sm" style={{ background: emp.photoColor }}>
                          {emp.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight:600 }}>{emp.name}</div>
                          <div style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{emp.code}</td>
                    <td>{emp.designation}</td>
                    <td><span className="badge badge-draft">{emp.department}</span></td>

                    {(isAdmin || isHR) && (
                      <td style={{ fontSize:'var(--font-size-sm)' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><Phone size={12}/> {emp.phone}</span>
                      </td>
                    )}
                    {(isAdmin || isHR) && (
                      <td>
                        {emp.hasBankDetails
                          ? <span className="badge badge-approved">✓ Complete</span>
                          : <span className="badge badge-rejected" title="No bank details — payroll will be held">⚠ Missing</span>
                        }
                      </td>
                    )}
                    {isAdmin && (
                      <td style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>
                        {manager ? manager.name : <span style={{ color:'var(--error)', fontWeight:500 }}>⚠ Unassigned</span>}
                      </td>
                    )}

                    <td style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)' }}>{emp.joined}</td>
                    <td><StatusBadge status={emp.status}/></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-icon btn-ghost" title="View"><Eye size={14}/></button>
                        {(isAdmin || isHR) && <button className="btn btn-icon btn-ghost" title="Edit"><Edit size={14}/></button>}
                        {isAdmin && <button className="btn btn-icon btn-ghost" style={{ color:'var(--error)' }} title="Remove"><Trash2 size={14}/></button>}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state"><div className="empty-state-text">No employees match your search.</div></div>
        )}
      </motion.div>
    </div>
  );
}
