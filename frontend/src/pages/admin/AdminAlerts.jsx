import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, Info, X, Send, UserPlus, ChevronDown, Check, Loader2 } from 'lucide-react';
import { getSystemAlerts, dismissAlert } from '../../services/analyticsService';
import { sendEmployeeNudge, getEmployees, getDepartments, updateDepartment, updateEmployee } from '../../services/employeeService';
import PremiumHeader from '../../components/ui/PremiumHeader';
import StatCard from '../../components/ui/StatCard';

const ICONS   = { no_bank_details: '⚠️', no_manager: '👤' };
const COLORS  = { warning: '#f59e0b', info: '#3b82f6' };
const BG      = { warning: '#fff7ed', info: '#eff6ff' };
const BORDER  = { warning: '#f59e0b40', info: '#3b82f640' };
const TYPES   = ['All', 'no_bank_details', 'no_manager'];
const LABELS  = { no_bank_details: 'No Bank Details', no_manager: 'No Manager' };

export default function AdminAlerts({ embedded = false }) {
  const [alerts, setAlerts]           = useState([]);
  const [filter, setFilter]           = useState('All');
  const [nudged, setNudged]           = useState({});
  // Assign-manager state: maps alertId → { open, saving, saved, candidates[] }
  const [assignState, setAssignState] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [deptMap, setDeptMap]           = useState({}); // deptName → dept object
  const [managerDeptMap, setManagerDeptMap] = useState({}); // managerName → dept object

  useEffect(() => {
    getSystemAlerts().then(setAlerts);
    // Pre-load all employees & departments
    getEmployees().then(setAllEmployees);
    getDepartments().then(depts => {
      const byName = {};
      const byMgr  = {};
      (depts || []).forEach(d => {
        byName[d.name] = d;
        if (d.manager_name) byMgr[d.manager_name] = d;
      });
      setDeptMap(byName);
      setManagerDeptMap(byMgr);
    });
  }, []);

  const dismiss = (id) => {
    dismissAlert(id);
    setAlerts(a => a.filter(x => x.id !== id));
  };

  const nudge = async (id, type) => {
    setNudged(n => ({ ...n, [id]: 'loading' }));
    try {
      const empId = parseInt(id.split('_')[1]);
      await sendEmployeeNudge(empId, type);
      setNudged(n => ({ ...n, [id]: 'sent' }));
    } catch {
      setNudged(n => ({ ...n, [id]: null }));
    }
  };

  /** Open the dropdown for a specific alert */
  const openAssign = (alert) => {
    // Collect unique manager names from ALL departments (manager_name field)
    const managerNames = [...new Set(
      Object.values(deptMap)
        .map(d => d.manager_name)
        .filter(name => name && name.trim() !== '')
    )];
    setAssignState(prev => ({
      ...prev,
      [alert.id]: { open: true, saving: false, saved: false, candidates: managerNames, selected: '' },
    }));
  };

  const closeAssign = (id) => {
    setAssignState(prev => ({ ...prev, [id]: { ...prev[id], open: false } }));
  };

  const selectManager = (alertId, managerName) => {
    setAssignState(prev => ({
      ...prev,
      [alertId]: { ...prev[alertId], selected: managerName },
    }));
  };

  const confirmAssign = async (alertItem) => {
    const state = assignState[alertItem.id];
    if (!state?.selected) return;

    // The selected manager name → find which dept they manage
    const managerDept = managerDeptMap[state.selected];

    // Also get the employee's own dept (if they have one)
    const empId = parseInt(alertItem.id.split('_')[1]);
    const emp = allEmployees.find(e => e.id === empId);

    if (!managerDept) {
      console.error(`No department found for manager "${state.selected}"`);
      return;
    }

    setAssignState(prev => ({ ...prev, [alertItem.id]: { ...prev[alertItem.id], saving: true } }));
    try {
      // If employee has no department, assign them to the manager's department
      if (emp && !emp.departmentId) {
        await updateEmployee(empId, { department_id: managerDept.id });
      }
      // Update the department's manager_name
      await updateDepartment(managerDept.id, {
        name:         managerDept.name,
        description:  managerDept.description || null,
        headcount:    managerDept.headcount    || null,
        manager_name: state.selected,
      });
      setAssignState(prev => ({
        ...prev,
        [alertItem.id]: { ...prev[alertItem.id], saving: false, saved: true, open: false },
      }));
      // Remove the no_manager alert since it's resolved
      setTimeout(() => dismiss(alertItem.id), 800);
    } catch (e) {
      setAssignState(prev => ({ ...prev, [alertItem.id]: { ...prev[alertItem.id], saving: false } }));
      console.error('Failed to assign manager', e);
    }
  };

  const visible = filter === 'All' ? alerts : alerts.filter(a => a.type === filter);

  return (
    <div>
      {!embedded && (
        <PremiumHeader title="System Alerts" subtitle="Action-required items that need your attention" />
      )}

      {!embedded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard icon={AlertTriangle} label="Missing Bank Details" value={alerts.filter(a => a.type === 'no_bank_details').length} gradient="linear-gradient(135deg, #f59e0b, #d97706)" delay={0} />
          <StatCard icon={UserPlus} label="No Manager Assigned" value={alerts.filter(a => a.type === 'no_manager').length} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" delay={0.08} />
          <StatCard icon={Bell} label="Total Alerts" value={alerts.length} gradient="linear-gradient(135deg, #ef4444, #dc2626)" delay={0.16} />
        </div>
      )}

      {/* Filter chips */}
      <div className="filter-chips" style={{ marginBottom: 'var(--space-4)' }}>
        {TYPES.map(t => (
          <button key={t} className={`filter-chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'All' ? 'All Alerts' : LABELS[t]}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <AnimatePresence>
        {visible.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--on-surface-variant)' }}>
            <Bell size={40} style={{ opacity: 0.3, marginBottom: 'var(--space-3)' }} />
            <div>No alerts — everything looks good! 🎉</div>
          </motion.div>
        )}
        {visible.map((alert, i) => {
          const as = assignState[alert.id] || {};
          return (
            <motion.div key={alert.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: 'var(--space-4)',
                background: BG[alert.severity],
                border: `1px solid ${BORDER[alert.severity]}`,
                borderLeft: `4px solid ${COLORS[alert.severity]}`,
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-3)',
                gap: 'var(--space-3)',
              }}
            >
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{ICONS[alert.type]}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', marginBottom: 3 }}>{alert.employee}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)', marginBottom: 4 }}>{alert.department}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: COLORS[alert.severity] }}>{alert.message}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                  {alert.type === 'no_bank_details' && (
                    <motion.button className="btn btn-sm btn-warning" whileHover={{ scale: 1.04 }}
                      onClick={() => nudge(alert.id, alert.type)} disabled={!!nudged[alert.id]}>
                      <Send size={12} />
                      {nudged[alert.id] === 'sent' ? 'Reminder Sent' : nudged[alert.id] === 'loading' ? 'Sending...' : 'Send Nudge'}
                    </motion.button>
                  )}
                  {alert.type === 'no_manager' && (
                    as.saved ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-sm)', color: '#10b981', fontWeight: 600 }}>
                        <Check size={14} /> Manager Assigned
                      </span>
                    ) : (
                      <motion.button
                        className="btn btn-sm btn-secondary"
                        whileHover={{ scale: 1.04 }}
                        onClick={() => as.open ? closeAssign(alert.id) : openAssign(alert)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <UserPlus size={12} />
                        Assign Manager
                        <ChevronDown size={12} style={{ transform: as.open ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                      </motion.button>
                    )
                  )}
                  <button className="btn btn-icon btn-ghost" onClick={() => dismiss(alert.id)} title="Dismiss" style={{ color: 'var(--on-surface-variant)' }}>
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Assign Manager Dropdown Panel */}
              <AnimatePresence>
                {alert.type === 'no_manager' && as.open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                          Select Manager to assign to <strong>{alert.employee}</strong>
                        </label>
                        <select
                          className="form-select"
                          value={as.selected || ''}
                          onChange={e => selectManager(alert.id, e.target.value)}
                          style={{ width: '100%', padding: '7px 12px', fontSize: 'var(--font-size-sm)', borderRadius: 6 }}
                        >
                          <option value="">— Choose a manager —</option>
                          {as.candidates && as.candidates.length > 0
                            ? as.candidates.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))
                            : <option disabled value="">No managers defined in departments yet</option>
                          }
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end', paddingBottom: 2 }}>
                        <motion.button
                          className="btn btn-sm btn-primary"
                          whileHover={{ scale: 1.04 }}
                          disabled={!as.selected || as.saving}
                          onClick={() => confirmAssign(alert)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          {as.saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                          {as.saving ? 'Saving...' : 'Confirm'}
                        </motion.button>
                        <button className="btn btn-sm btn-ghost" onClick={() => closeAssign(alert.id)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
