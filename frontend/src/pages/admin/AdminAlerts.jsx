import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, Info, X, Send, UserPlus } from 'lucide-react';
import { getSystemAlerts, dismissAlert } from '../../services/analyticsService';
import { sendEmployeeNudge } from '../../services/employeeService';
import PremiumHeader from '../../components/ui/PremiumHeader';
import StatCard from '../../components/ui/StatCard';

const ICONS   = { no_bank_details:'⚠️', no_manager:'👤' };
const COLORS  = { warning:'#f59e0b', info:'#3b82f6' };
const BG      = { warning:'#fff7ed', info:'#eff6ff' };
const BORDER  = { warning:'#f59e0b40', info:'#3b82f640' };
const TYPES   = ['All', 'no_bank_details', 'no_manager'];
const LABELS  = { no_bank_details:'No Bank Details', no_manager:'No Manager' };

export default function AdminAlerts({ embedded = false }) {
  const [alerts, setAlerts]   = useState([]);
  const [filter, setFilter]   = useState('All');
  const [nudged, setNudged]   = useState({});

  useEffect(() => { getSystemAlerts().then(setAlerts); }, []);

  const dismiss = (id) => {
    dismissAlert(id);
    setAlerts(a => a.filter(x => x.id !== id));
  };

  const nudge = async (id, type) => {
    setNudged(n => ({ ...n, [id]: 'loading' }));
    try {
      // id format: "bank_123" -> employeeId = 123
      const empId = parseInt(id.split('_')[1]);
      await sendEmployeeNudge(empId, type);
      setNudged(n => ({ ...n, [id]: 'sent' }));
    } catch (e) {
      setNudged(n => ({ ...n, [id]: null }));
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
          <StatCard icon={AlertTriangle} label="Missing Bank Details" value={alerts.filter(a=>a.type==='no_bank_details').length} gradient="linear-gradient(135deg, #f59e0b, #d97706)" delay={0} />
          <StatCard icon={UserPlus} label="No Manager Assigned" value={alerts.filter(a=>a.type==='no_manager').length} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" delay={0.08} />
          <StatCard icon={Bell} label="Total Alerts" value={alerts.length} gradient="linear-gradient(135deg, #ef4444, #dc2626)" delay={0.16} />
        </div>
      )}


      {/* Filter chips */}
      <div className="filter-chips" style={{ marginBottom:'var(--space-4)' }}>
        {TYPES.map(t => (
          <button key={t} className={`filter-chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'All' ? 'All Alerts' : LABELS[t]}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <AnimatePresence>
        {visible.length === 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'var(--space-8)', color:'var(--on-surface-variant)' }}>
            <Bell size={40} style={{ opacity:0.3, marginBottom:'var(--space-3)' }} />
            <div>No alerts — everything looks good! 🎉</div>
          </motion.div>
        )}
        {visible.map((alert, i) => (
          <motion.div key={alert.id}
            layout
            initial={{ opacity:0, x:-16 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:16, height:0, marginBottom:0 }}
            transition={{ delay: i * 0.05 }}
            style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'var(--space-4)', background: BG[alert.severity], border:`1px solid ${BORDER[alert.severity]}`, borderLeft:`4px solid ${COLORS[alert.severity]}`, borderRadius:'var(--radius-md)', marginBottom:'var(--space-3)', gap:'var(--space-3)', flexWrap:'wrap' }}
          >
            <div style={{ display:'flex', alignItems:'flex-start', gap:'var(--space-3)', flex:1, minWidth:0 }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{ICONS[alert.type]}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:'var(--font-size-md)', marginBottom:3 }}>{alert.employee}</div>
                <div style={{ fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)', marginBottom:4 }}>{alert.department}</div>
                <div style={{ fontSize:'var(--font-size-sm)', color: COLORS[alert.severity] }}>{alert.message}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'var(--space-2)', flexShrink:0, flexWrap:'wrap' }}>
              {alert.type === 'no_bank_details' && (
                <motion.button className="btn btn-sm btn-warning" whileHover={{ scale:1.04 }} onClick={() => nudge(alert.id, alert.type)} disabled={nudged[alert.id]}>
                  <Send size={12} /> {nudged[alert.id] === 'sent' ? 'Reminder Sent' : nudged[alert.id] === 'loading' ? 'Sending...' : 'Send Nudge'}
                </motion.button>
              )}
              {alert.type === 'no_manager' && (
                <motion.button className="btn btn-sm btn-secondary" whileHover={{ scale:1.04 }}>
                  <UserPlus size={12} /> Assign Manager
                </motion.button>
              )}
              <button className="btn btn-icon btn-ghost" onClick={() => dismiss(alert.id)} title="Dismiss" style={{ color:'var(--on-surface-variant)' }}>
                <X size={15} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
