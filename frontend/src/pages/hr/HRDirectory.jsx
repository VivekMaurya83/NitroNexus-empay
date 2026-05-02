import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, Filter, Edit, Trash2, Eye } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { employees } from '../../utils/mockData';

export default function HRDirectory() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">HR Directory</h1>
          <p className="page-subtitle">Manage and view all employee profiles</p>
        </div>
        <motion.a href="/hr/add-employee" className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <UserPlus size={16} /> Add Employee
        </motion.a>
      </div>

      {/* Filters */}
      <div className="card card-sm" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
            <Search size={16} className="search-icon" />
            <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, designation..." style={{ paddingLeft: 40 }} />
          </div>
          <select className="form-select" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="badge badge-present">{filtered.length} employees</div>
        </div>
      </div>

      {/* Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <motion.tr key={emp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{emp.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{emp.name}</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{emp.code}</td>
                  <td>{emp.designation}</td>
                  <td><span className="badge badge-draft">{emp.department}</span></td>
                  <td style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-sm)' }}>{emp.role.replace('_', ' ')}</td>
                  <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>{emp.joined}</td>
                  <td><StatusBadge status={emp.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-icon btn-ghost" title="View"><Eye size={14} /></button>
                      <button className="btn btn-icon btn-ghost" title="Edit"><Edit size={14} /></button>
                      <button className="btn btn-icon btn-ghost" style={{ color: 'var(--error)' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-text">No employees found matching your search.</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
