import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Building2, ShieldCheck, UserPlus, Trash2, 
  Search, Mail, Shield, Clock, X, AlertTriangle, Save
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getCompanyUsers, deleteUser, inviteHR, invitePayroll } from '../../services/adminService';
import { getPayrollRules, updatePayrollRules } from '../../services/payrollService';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import PremiumHeader from '../../components/ui/PremiumHeader';

const TABS = [
  { key: 'users',   label: 'All Users',     icon: Users },
  { key: 'invite',  label: 'Invite Staff',  icon: UserPlus },
  { key: 'rules',   label: 'Payroll Rules', icon: ShieldCheck },
];

const RULE_FIELDS = [
  { key:'pfPercentage',       label:'Employee PF %',          suffix:'%', desc:'Employee provident fund deduction rate',      group:'Provident Fund'  },
  { key:'employerPf',         label:'Employer PF %',          suffix:'%', desc:'Employer contribution to PF',                 group:'Provident Fund'  },
  { key:'professionalTax',    label:'Professional Tax',        suffix:'₹', desc:'Fixed monthly professional tax deduction',    group:'Tax'             },
  { key:'taxSlab1Rate',       label:'Tax Slab 1 (≤ 5L) %',    suffix:'%', desc:'Income tax rate for annual income up to ₹5L', group:'Tax'             },
  { key:'taxSlab2Rate',       label:'Tax Slab 2 (5–10L) %',   suffix:'%', desc:'Income tax rate for ₹5L – ₹10L bracket',     group:'Tax'             },
  { key:'taxSlab3Rate',       label:'Tax Slab 3 (>10L) %',    suffix:'%', desc:'Income tax rate above ₹10L',                 group:'Tax'             },
  { key:'overtimeMultiplier', label:'Overtime Multiplier',     suffix:'x', desc:'Hourly rate multiplier for overtime hours',   group:'Payroll'         },
  { key:'cutoffDate',         label:'Payroll Cutoff Day',      suffix:'',  desc:'Day of month payroll calculations close',     group:'Payroll'         },
  { key:'gratuityRate',       label:'Gratuity Rate %',         suffix:'%', desc:'Annual gratuity accrual rate',               group:'Benefits'        },
  { key:'esiRate',            label:'ESI Rate %',              suffix:'%', desc:'Employee State Insurance contribution rate',  group:'Benefits'        },
  { key:'esiThreshold',       label:'ESI Salary Threshold',   suffix:'₹', desc:'Monthly gross limit for ESI eligibility',     group:'Benefits'        },
];
const GROUPS = ['Provident Fund', 'Tax', 'Payroll', 'Benefits'];

export default function CompanyUsers() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [activeTab, setTab] = useState('users');
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Invite state
  const [inviteForm, setInviteForm] = useState({ name:'', email:'', role:'hr_officer' });
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  // Rules state
  const [rules, setRules] = useState(null);
  const [rulesDirty, setRulesDirty] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uData, rData] = await Promise.all([
        getCompanyUsers(),
        getPayrollRules()
      ]);
      setUsers(uData);
      setRules(rData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (uId, email) => {
    if (!window.confirm(`Are you sure you want to completely delete access for ${email}? This cannot be undone.`)) return;
    try {
      await deleteUser(uId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true); setInviteMsg(null);
    try {
      if (inviteForm.role === 'hr_officer') {
        await inviteHR({ name: inviteForm.name, email: inviteForm.email });
      } else {
        await invitePayroll({ name: inviteForm.name, email: inviteForm.email });
      }
      setInviteMsg({ type:'success', text:`Invite sent to ${inviteForm.email}` });
      setInviteForm({ name:'', email:'', role:'hr_officer' });
      loadData();
    } catch (err) {
      setInviteMsg({ type:'error', text: err.message || 'Failed to send invite' });
    } finally {
      setInviting(false);
    }
  };

  const saveRules = async () => {
    setRulesSaving(true);
    try {
      await updatePayrollRules(rules);
      setRulesDirty(false);
      alert('Payroll rules updated successfully');
    } finally {
      setRulesSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="company-users-page">
      <PremiumHeader
        title="Company Management"
        subtitle="Manage all system users, invite staff, and configure payroll rules"
      />

      {/* User summary stat cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard icon={Users} label="Total Users" value={users.length} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" delay={0} />
          <StatCard icon={ShieldCheck} label="Admins" value={users.filter(u => u.role === 'admin').length} gradient="linear-gradient(135deg, #ef4444, #dc2626)" delay={0.07} />
          <StatCard icon={Building2} label="HR Officers" value={users.filter(u => u.role === 'hr_officer').length} gradient="linear-gradient(135deg, #10b981, #059669)" delay={0.14} />
          <StatCard icon={Users} label="Employees" value={users.filter(u => u.role === 'employee').length} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" delay={0.21} />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--outline-variant)' }}>
                <div className="search-wrap" style={{ flex: 1, maxWidth: 400 }}>
                  <Search size={15} className="search-icon" />
                  <input className="form-input search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name, email or role..." />
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Department / Dept</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="loading-state">Loading users...</td></tr>
                    ) : filteredUsers.map((u, i) => (
                      <motion.tr key={u.user_id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.02 }}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div className="avatar avatar-sm" style={{ background: u.role === 'admin' ? 'var(--primary)' : 'var(--secondary-container)' }}>
                              {u.name[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <Shield size={12} color="var(--primary)" />
                            <span style={{ fontSize: 'var(--font-size-sm)', textTransform:'capitalize' }}>{u.role.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-draft">{u.department || '—'}</span>
                        </td>
                        <td>
                          <StatusBadge status={u.is_active ? 'active' : 'terminated'} />
                        </td>
                        <td style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <Clock size={12} /> {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isAdmin && u.role !== 'admin' && u.is_active && (
                            <button className="btn btn-sm btn-ghost" style={{ color:'var(--error)' }} onClick={() => handleDelete(u.user_id, u.email)} title="Delete Access">
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'invite' && (
          <motion.div key="invite" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-6)' }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-2)' }}>Invite Management Staff</div>
                <p className="card-subtitle" style={{ marginBottom: 'var(--space-5)' }}>Add HR Officers or Payroll Officers to your team</p>
                
                <form onSubmit={handleInvite} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" required value={inviteForm.name} onChange={e=>setInviteForm(f=>({...f, name:e.target.value}))} placeholder="e.g. Sarah Connor" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" required value={inviteForm.email} onChange={e=>setInviteForm(f=>({...f, email:e.target.value}))} placeholder="sarah@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={inviteForm.role} onChange={e=>setInviteForm(f=>({...f, role:e.target.value}))}>
                      <option value="hr_officer">HR Officer</option>
                      <option value="payroll_officer">Payroll Officer</option>
                    </select>
                  </div>
                  
                  {inviteMsg && (
                    <div style={{ padding:'10px 14px', borderRadius:8, fontSize:'var(--font-size-sm)', background: inviteMsg.type==='success'?'var(--success-container)':'var(--error-container)', color: inviteMsg.type==='success'?'var(--on-success-container)':'var(--on-error-container)' }}>
                      {inviteMsg.text}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={inviting} style={{ marginTop:'var(--space-2)' }}>
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </form>
              </div>

              <div className="card" style={{ background:'var(--secondary-container)', color:'var(--on-secondary-container)', borderColor:'transparent' }}>
                <div style={{ display:'flex', flexDirection:'column', height:'100%', justifyContent:'center', padding:'var(--space-4)' }}>
                  <div style={{ background:'rgba(255,255,255,0.2)', width:48, height:48, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <Mail size={24} />
                  </div>
                  <h3 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Staff Privileges</h3>
                  <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12, fontSize:'var(--font-size-sm)' }}>
                    <li style={{ display:'flex', gap:10 }}>
                      <ShieldCheck size={16} /> <strong>HR Officers</strong> can manage employees, departments, and review leave requests.
                    </li>
                    <li style={{ display:'flex', gap:10 }}>
                      <ShieldCheck size={16} /> <strong>Payroll Officers</strong> can run payroll, manage salary structures, and confirm payments.
                    </li>
                    <li style={{ display:'flex', gap:10 }}>
                      <ShieldCheck size={16} /> Both will receive an email with a temporary password to login.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rules' && (
          <motion.div key="rules" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-5)' }}>
              <div>
                <h3 className="card-title">Global Payroll Configuration</h3>
                <p className="card-subtitle">These settings define how salary, taxes, and deductions are calculated company-wide.</p>
              </div>
              <button className="btn btn-primary" onClick={saveRules} disabled={!rulesDirty || rulesSaving}>
                <Save size={16} /> {rulesSaving ? 'Saving...' : 'Save Rules'}
              </button>
            </div>

            {rulesDirty && (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#fff7ed', border:'1px solid #f59e0b', borderRadius:'var(--radius-md)', marginBottom:'var(--space-4)', fontSize:'var(--font-size-sm)', color:'#92400e' }}>
                <AlertTriangle size={16} color="#f59e0b" />
                You have unsaved changes. These will affect the next payroll run.
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'var(--space-4)' }}>
              {GROUPS.map(group => {
                const fields = RULE_FIELDS.filter(f => f.group === group);
                return (
                  <div key={group} className="card">
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-4)' }}>
                      <ShieldCheck size={18} color="var(--primary)" />
                      <div className="card-title" style={{ margin:0 }}>{group}</div>
                    </div>
                    {fields.map(f => (
                      <div key={f.key} className="form-group">
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <label className="form-label" style={{ margin:0 }}>{f.label}</label>
                          <span style={{ fontSize:10, color:'var(--on-surface-variant)' }}>{f.desc}</span>
                        </div>
                        <div style={{ position:'relative' }}>
                          <input type="number" className="form-input" value={rules?.[f.key] ?? ''} onChange={e => { setRules(r => ({ ...r, [f.key]: parseFloat(e.target.value) })); setRulesDirty(true); }} style={{ paddingRight: f.suffix ? 36 : undefined }} step="0.01" />
                          {f.suffix && (
                            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:'var(--font-size-sm)', color:'var(--on-surface-variant)', fontWeight:600 }}>
                              {f.suffix}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
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
