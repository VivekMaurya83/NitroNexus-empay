import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Save, Plus, X, Upload, Briefcase, Award, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../context/AuthContext';
import { resumeData } from '../../utils/mockData';

export default function UserProfile() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [form, setForm]   = useState({
    firstName: user?.firstName || user?.name?.split(' ')[0] || '',
    lastName:  user?.lastName  || user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email    || '',
    phone:     user?.phone    || '',
    dateOfBirth: user?.dateOfBirth || '',
    address:   user?.address  || '',
    panNumber: user?.panNumber || '',
    ifscCode:  user?.ifscCode || '',
    about:     resumeData.about,
  });
  const [skills,  setSkills]  = useState([...resumeData.skills]);
  const [newSkill,setNewSkill]= useState('');
  const [exp,     setExp]     = useState([...resumeData.experience]);
  const [certs,   setCerts]   = useState([...resumeData.certifications]);
  const [saved,   setSaved]   = useState(false);
  const [activeTab, setTab]   = useState('personal');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addSkill = () => {
    if (newSkill.trim()) { setSkills(s => [...s, newSkill.trim()]); setNewSkill(''); }
  };

  const TABS = [
    { key:'personal',  label:'Personal Info'   },
    { key:'resume',    label:'Resume & Skills' },
    ...(isAdmin ? [{ key:'payroll_rules', label:'Payroll Rules' }] : []),
  ];

  return (
    <div>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Manage your personal information, resume and account settings</p>

      <form onSubmit={save}>
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'var(--space-4)', alignItems:'start' }}>
          {/* Avatar card */}
          <motion.div className="card" style={{ textAlign:'center', position:'sticky', top:80 }} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}>
            <div style={{ position:'relative', display:'inline-block', marginBottom:'var(--space-3)' }}>
              <div className="avatar avatar-xl" style={{ margin:'0 auto', fontSize:36, background: user?.photoColor || 'var(--primary-container)' }}>
                {user?.avatar || user?.name?.[0]}
              </div>
              <button type="button" style={{ position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:'50%', background:'var(--primary-container)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid white' }}>
                <Camera size={13}/>
              </button>
            </div>
            <div style={{ fontWeight:700, fontSize:'var(--font-size-lg)', marginBottom:2 }}>{form.firstName} {form.lastName}</div>
            <div style={{ color:'var(--on-surface-variant)', fontSize:'var(--font-size-sm)', marginBottom:'var(--space-3)' }}>{user?.designation}</div>
            <span className="badge badge-draft" style={{ display:'inline-block', marginBottom:'var(--space-4)' }}>{user?.department}</span>
            <div style={{ textAlign:'left', fontSize:'var(--font-size-sm)' }}>
              {[
                { label:'Employee Code', value: user?.empCode || 'ADM001' },
                { label:'Company',       value: user?.company },
                { label:'Role',          value: user?.role?.replace('_',' ')},
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--outline-variant)' }}>
                  <span style={{ color:'var(--on-surface-variant)' }}>{r.label}</span>
                  <span style={{ fontWeight:500, textTransform:'capitalize' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right panel */}
          <div>
            {/* Tabs */}
            <div className="tabs" style={{ marginBottom:'var(--space-4)' }}>
              {TABS.map(t => (
                <button key={t.key} type="button" className={`tab-btn ${activeTab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>{t.label}</button>
              ))}
            </div>

            {/* Personal Info */}
            {activeTab === 'personal' && (
              <motion.div className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                <div className="form-section-title">Personal Information</div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name</label><input name="firstName" value={form.firstName} onChange={handle} className="form-input"/></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input name="lastName" value={form.lastName} onChange={handle} className="form-input"/></div>
                </div>
                <div className="form-group"><label className="form-label">Email</label><input name="email" type="email" value={form.email} onChange={handle} className="form-input"/></div>
                <div className="form-group"><label className="form-label">Phone</label><input name="phone" value={form.phone} onChange={handle} className="form-input"/></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date of Birth</label><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handle} className="form-input"/></div>
                  <div className="form-group"><label className="form-label">PAN Number</label><input name="panNumber" value={form.panNumber} onChange={handle} className="form-input"/></div>
                </div>
                <div className="form-group"><label className="form-label">Address</label><textarea name="address" value={form.address} onChange={handle} className="form-input" rows={2}/></div>
                <div className="form-group"><label className="form-label">Bank IFSC Code</label><input name="ifscCode" value={form.ifscCode} onChange={handle} className="form-input"/></div>
                <div className="form-section-title" style={{ marginTop:'var(--space-4)' }}>About</div>
                <div className="form-group"><textarea name="about" value={form.about} onChange={handle} className="form-textarea" rows={4} placeholder="Tell us about yourself…"/></div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'var(--space-3)', marginTop:'var(--space-4)' }}>
                  <motion.button type="submit" className="btn btn-primary" whileHover={{ scale:1.02 }} style={{ background: saved?'var(--success)':undefined }}>
                    <Save size={15}/> {saved?'Saved! ✓':'Save Changes'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Resume */}
            {activeTab === 'resume' && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                {/* Skills */}
                <div className="card">
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-4)' }}>
                    <Briefcase size={16} color="var(--primary-container)"/>
                    <div className="card-title" style={{ margin:0 }}>Skills</div>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)', marginBottom:'var(--space-3)' }}>
                    {skills.map((sk,i) => (
                      <motion.span key={sk} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.04 }}
                        style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', background:'var(--primary-container)20', border:'1px solid var(--primary-container)40', borderRadius:'var(--radius-full)', fontSize:'var(--font-size-sm)', fontWeight:500, color:'var(--primary-container)' }}>
                        {sk}
                        <button type="button" onClick={()=>setSkills(s=>s.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', lineHeight:1, padding:0 }}><X size={11}/></button>
                      </motion.span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'var(--space-2)' }}>
                    <input value={newSkill} onChange={e=>setNewSkill(e.target.value)} className="form-input" placeholder="Add skill…" style={{ flex:1 }} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addSkill())}/>
                    <motion.button type="button" className="btn btn-secondary" onClick={addSkill} whileHover={{ scale:1.04 }}><Plus size={15}/></motion.button>
                  </div>
                </div>

                {/* Experience */}
                <div className="card">
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-4)' }}>
                    <BookOpen size={16} color="var(--primary-container)"/>
                    <div className="card-title" style={{ margin:0 }}>Experience</div>
                  </div>
                  {exp.map((e,i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                      style={{ padding:'var(--space-4)', background:'var(--surface-container-low)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-3)', borderLeft:'3px solid var(--primary-container)' }}>
                      <div style={{ fontWeight:700 }}>{e.title}</div>
                      <div style={{ fontSize:'var(--font-size-sm)', color:'var(--primary-container)', fontWeight:600 }}>{e.company}</div>
                      <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)', marginBottom:4 }}>{e.from} — {e.to}</div>
                      <div style={{ fontSize:'var(--font-size-sm)' }}>{e.desc}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Certifications */}
                <div className="card">
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-4)' }}>
                    <Award size={16} color="var(--primary-container)"/>
                    <div className="card-title" style={{ margin:0 }}>Certifications</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                    {certs.map((c,i) => (
                      <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                        style={{ padding:'var(--space-3)', background:'var(--surface-container-low)', borderRadius:'var(--radius-md)', border:'1px solid var(--outline-variant)' }}>
                        <div style={{ fontWeight:700, fontSize:'var(--font-size-sm)', marginBottom:2 }}>{c.name}</div>
                        <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>{c.issuer} · {c.year}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Resume Upload */}
                <div className="card">
                  <div className="card-title" style={{ marginBottom:'var(--space-3)' }}>Resume File</div>
                  <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'var(--space-2)', padding:'var(--space-6)', border:'2px dashed var(--outline-variant)', borderRadius:'var(--radius-lg)', cursor:'pointer', background:'var(--surface-container-low)', transition:'border-color 0.2s' }}
                    onDragOver={e=>{e.preventDefault();}} onDrop={e=>{e.preventDefault();}}>
                    <Upload size={28} color="var(--on-surface-variant)"/>
                    <div style={{ fontWeight:600 }}>Drop PDF here or click to upload</div>
                    <div style={{ fontSize:'var(--font-size-xs)', color:'var(--on-surface-variant)' }}>PDF, DOC or DOCX · Max 5MB</div>
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }}/>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Payroll Rules shortcut for Admin */}
            {activeTab === 'payroll_rules' && isAdmin && (
              <motion.div className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                <div className="card-title" style={{ marginBottom:8 }}>Payroll Rules</div>
                <p style={{ color:'var(--on-surface-variant)', fontSize:'var(--font-size-sm)', marginBottom:'var(--space-4)' }}>
                  Configure global payroll rules that affect all employee salary calculations.
                </p>
                <a href="/admin/payroll-rules" className="btn btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none' }}>
                  Go to Payroll Rules →
                </a>
              </motion.div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
