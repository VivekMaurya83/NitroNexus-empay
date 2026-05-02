import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { UserPlus, ChevronLeft, Check, Mail, User, Building2, Calendar, Briefcase, Save, Upload, Loader2, Users } from 'lucide-react';
import { getDepartments, getEmployee, updateEmployee } from '../../services/employeeService';
import { inviteEmployee } from '../../services/adminService';
import { parseCSVWithGroq } from '../../services/ocrService';

const EMPLOYMENT_TYPES = [
  { value: 'full_time',  label: 'Full Time' },
  { value: 'part_time',  label: 'Part Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'intern',     label: 'Intern' },
];

export default function AddEmployee() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_of_joining: '',
    date_of_birth: '',
    department_id: '',
    employment_type: 'full_time',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { login_id, email }
  const [uploadMode, setUploadMode] = useState('manual');
  const [bulkState, setBulkState] = useState('idle'); // idle, processing, done
  const [bulkResults, setBulkResults] = useState([]);

  useEffect(() => {
    getDepartments().then(data => setDepts(data || [])).catch(() => {});
    if (isEdit) {
      getEmployee(id).then(emp => {
        setForm({
          first_name: emp.firstName || '',
          last_name: emp.lastName || '',
          email: emp.email || '',
          date_of_joining: emp.joined || '',
          date_of_birth: emp.dateOfBirth || '',
          department_id: emp.departmentId || '',
          employment_type: emp.employmentType || 'full_time',
          phone: emp.phone || '',
        });
      }).catch(err => setError('Failed to load employee details'));
    }
  }, [id, isEdit]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        department_id: form.department_id ? parseInt(form.department_id) : null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone || null,
      };
      
      if (isEdit) {
        await updateEmployee(id, payload);
        navigate('/hr-directory');
      } else {
        const result = await inviteEmployee(payload);
        setSuccess({ login_id: result?.login_id || result?.data?.login_id, email: form.email });
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} employee. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (file) => {
    if (!file) return;
    
    // Validate file type
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setError('Excel files (.xlsx/.xls) are not supported directly. Please save your file as a .CSV and upload again.');
      return;
    }

    setBulkState('processing');
    setError('');
    setBulkResults([]);

    try {
      const text = await file.text();
      // AI Parsing
      const parsedEmployees = await parseCSVWithGroq(text, depts);

      if (!parsedEmployees || parsedEmployees.length === 0) {
        throw new Error("No employees found in CSV.");
      }

      // Validation & Creation (Sequential to avoid backend race conditions on ID generation)
      const formattedResults = [];
      
      for (const emp of parsedEmployees) {
        try {
          if (!emp.first_name || !emp.last_name || !emp.email || !emp.date_of_joining) {
            throw new Error("Missing required fields (First, Last, Email, Join Date)");
          }
          
          const payload = {
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            date_of_joining: emp.date_of_joining,
            employment_type: emp.employment_type || 'full_time',
            phone: emp.phone || null,
            date_of_birth: emp.date_of_birth || null,
            department_id: emp.department_id || null,
          };

          const res = await inviteEmployee(payload);
          formattedResults.push({
            emp: payload,
            status: 'success',
            login_id: res?.login_id || res?.data?.login_id
          });
        } catch (err) {
          formattedResults.push({
            emp,
            status: 'error',
            error: err?.response?.data?.detail || err?.message || 'Failed'
          });
        }
      }

      setBulkResults(formattedResults);
      setBulkState('done');
    } catch (err) {
      setError(err.message || 'Failed to process CSV file.');
      setBulkState('idle');
    }
  };

  if (success) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hr-directory')}>
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Add New Employee</h1>
        </div>
        <motion.div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 40, textAlign: 'center' }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={28} color="#10b981" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Employee Created!</h2>
          <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: 24 }}>
            A welcome email with login credentials has been sent to <strong>{success.email}</strong>.
          </p>
          {success.login_id && (
            <div style={{ background: 'var(--surface-container-high)', borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Employee Login ID</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: '#a5b4fc', letterSpacing: 2 }}>{success.login_id}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => { setSuccess(null); setForm({ first_name: '', last_name: '', email: '', date_of_joining: '', date_of_birth: '', department_id: '', employment_type: 'full_time', phone: '' }); }}>
              Add Another
            </button>
            <Link to="/hr-directory" className="btn btn-primary">
              View Directory
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hr-directory')}>
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {isEdit ? 'Update employee details' : 'A Login ID will be auto-generated and credentials emailed to the employee'}
          </p>
        </div>
      </div>

      {!isEdit && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button type="button" className={`btn ${uploadMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('manual')}><User size={16} /> Manual Entry</button>
          <button type="button" className={`btn ${uploadMode === 'bulk' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('bulk')}><Users size={16} /> Bulk Upload (AI)</button>
        </div>
      )}

      {uploadMode === 'bulk' ? (
        <motion.div className="card" style={{ padding: 30 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {bulkState === 'idle' && (
            <div 
               style={{ border: '2px dashed var(--outline)', borderRadius: 12, padding: '60px 40px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}
               onDragOver={e => e.preventDefault()}
               onDrop={e => { e.preventDefault(); handleBulkUpload(e.dataTransfer.files[0]); }}
               onClick={() => document.getElementById('csv-upload').click()}
            >
              <Upload size={36} style={{ color: 'var(--on-surface-variant)', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 16 }}>Drag & drop CSV or Excel file</div>
              <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Up to 10 employees at once. Unstructured columns are automatically matched.</div>
              <input id="csv-upload" type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => handleBulkUpload(e.target.files[0])} />
            </div>
          )}

          {bulkState === 'processing' && (
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: 16 }} />
              <div style={{ fontWeight: 600, fontSize: 16 }}>Processing Document with AI...</div>
              <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>Extracting rows, mapping departments, validating, and creating accounts.</div>
            </div>
          )}

          {bulkState === 'done' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ marginBottom: 0 }}>Import Results</h3>
                <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                  {bulkResults.filter(r => r.status === 'success').length} / {bulkResults.length} Created
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bulkResults.map((r, i) => (
                  <div key={i} style={{ padding: 16, background: r.status === 'success' ? 'rgba(16,185,129,.05)' : 'rgba(239,68,68,.05)', border: `1px solid ${r.status === 'success' ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`, borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.status === 'success' ? <Check size={16} color="#10b981" /> : <ChevronLeft size={16} color="#ef4444" style={{ transform: 'rotate(180deg)' }} />}
                      {r.emp.first_name || 'Unknown'} {r.emp.last_name || ''} <span style={{ fontWeight: 400, color: 'var(--on-surface-variant)' }}>({r.emp.email || 'No email'})</span>
                    </div>
                    {r.status === 'success' ? (
                      <div style={{ color: '#10b981', fontSize: 13, marginTop: 4, paddingLeft: 24 }}>Successfully created! Login ID: <strong>{r.login_id}</strong></div>
                    ) : (
                      <div style={{ color: '#ef4444', fontSize: 13, marginTop: 4, paddingLeft: 24 }}>Error: {r.error}</div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => setBulkState('idle')}>Upload Another File</button>
                <Link to="/hr-directory" className="btn btn-secondary">View Directory</Link>
              </div>
            </div>
          )}

          {error && <div style={{ color: 'var(--error)', marginTop: 16, padding: '10px 14px', background: 'var(--error-container)', borderRadius: 8, fontSize: 'var(--font-size-sm)' }}>{error}</div>}
        </motion.div>
      ) : (
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

          {/* Personal Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><User size={15} style={{ display: 'inline', marginRight: 8 }} />Personal Information</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handle} className="form-input" placeholder="John" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handle} className="form-input" placeholder="Doe" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div className="input-icon-wrap">
                <Mail size={15} className="input-icon" />
                <input name="email" type="email" value={form.email} onChange={handle} className="form-input with-icon" placeholder="john.doe@company.com" required />
              </div>
              <div className="form-hint" style={{ marginTop: 4 }}>
                {isEdit ? 'Cannot change email for existing employee directly' : 'Login credentials will be sent to this email'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handle} className="form-input" placeholder="+91 98765 43210" />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <div className="input-icon-wrap">
                <Calendar size={15} className="input-icon" />
                <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handle} className="form-input with-icon" />
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Briefcase size={15} style={{ display: 'inline', marginRight: 8 }} />Employment Details</div>
            </div>

            <div className="form-group">
              <label className="form-label">Date of Joining *</label>
              <div className="input-icon-wrap">
                <Calendar size={15} className="input-icon" />
                <input name="date_of_joining" type="date" value={form.date_of_joining} onChange={handle} className="form-input with-icon" required />
              </div>
              <div className="form-hint" style={{ marginTop: 4 }}>Used to generate Employee Login ID</div>
            </div>

            <div className="form-group">
              <label className="form-label">Type of Employee *</label>
              <select name="employment_type" value={form.employment_type} onChange={handle} className="form-select">
                {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400 }}>(optional)</span></label>
              <div className="input-icon-wrap">
                <Building2 size={15} className="input-icon" />
                <select name="department_id" value={form.department_id} onChange={handle} className="form-select with-icon" style={{ paddingLeft: 36 }}>
                  <option value="">No Department</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {/* Login ID preview */}
            {!isEdit && form.first_name && form.last_name && form.date_of_joining && (
              <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#a5b4fc', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Login ID Preview</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#a5b4fc', letterSpacing: 1 }}>
                  ??{form.first_name.substring(0, 2).toUpperCase()}{form.last_name.substring(0, 2).toUpperCase()}{form.date_of_joining.substring(0, 4)}????
                </div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                  Company code + Name initials + Year + Serial (auto-assigned)
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 12 }}>
              <div style={{ color: 'var(--error)', padding: '10px 14px', background: 'var(--error-container)', borderRadius: 8, fontSize: 'var(--font-size-sm)' }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/hr-directory')}>Cancel</button>
          <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            {isEdit ? <Save size={16} /> : <UserPlus size={16} />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee & Send Email'}
          </motion.button>
        </div>
      </motion.form>
      )}
    </div>
  );
}
