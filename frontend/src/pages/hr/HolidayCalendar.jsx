import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Calendar, Globe } from 'lucide-react';
import { holidayService } from '../../services/holidayService';

export default function HolidayCalendar() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [form, setForm] = useState({ date: '', name: '', holiday_type: 'national' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const data = await holidayService.getHolidays(selectedYear);
      setHolidays(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.name) return;
    setSubmitting(true);
    setError('');
    try {
      const newHoliday = await holidayService.createHoliday(form);
      setHolidays(prev => [...prev, newHoliday].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setForm({ date: '', name: '', holiday_type: 'national' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await holidayService.deleteHoliday(id);
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete holiday');
    }
  };

  const handleSeedIndianHolidays = async () => {
    if (!window.confirm(`This will add standard Indian public holidays for ${selectedYear}. Continue?`)) return;
    setSeeding(true);
    setError('');
    try {
      await holidayService.seedIndianHolidays(selectedYear);
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to seed holidays');
    } finally {
      setSeeding(false);
    }
  };

  // Group holidays by month
  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const month = new Date(holiday.date).toLocaleString('default', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  return (
    <div className="holiday-calendar-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">Holiday Calendar</h1>
          <p className="page-subtitle">Manage company and public holidays</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <select 
            className="form-select" 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ width: 100 }}
          >
            {[selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button 
            className="btn btn-secondary" 
            onClick={handleSeedIndianHolidays}
            disabled={seeding || loading}
          >
            <Globe size={14} /> {seeding ? 'Seeding...' : 'Seed Indian Holidays'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-3)', background: 'var(--error-container)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
        {/* Add Holiday Form */}
        <motion.div className="card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add Custom Holiday</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Holiday Name *</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleInputChange} 
                className="form-input" 
                placeholder="e.g., Company Foundation Day" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input 
                type="date" 
                name="date" 
                value={form.date} 
                onChange={handleInputChange} 
                className="form-input" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select name="holiday_type" value={form.holiday_type} onChange={handleInputChange} className="form-select">
                <option value="national">National</option>
                <option value="regional">Regional</option>
                <option value="company">Company</option>
              </select>
            </div>
            <motion.button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }} 
              disabled={submitting}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> {submitting ? 'Adding...' : 'Add Holiday'}
            </motion.button>
          </form>
        </motion.div>

        {/* Holidays List */}
        <motion.div className="card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={18} /> {selectedYear} Holidays
            </div>
            <span className="badge badge-draft">{holidays.length} total</span>
          </div>

          {loading ? (
            <div className="loading-state" style={{ padding: 'var(--space-8)' }}>Loading holidays...</div>
          ) : holidays.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              No holidays found for {selectedYear}.
              <br/>
              <span style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Use the form or click "Seed Indian Holidays" to add some.</span>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
                <div key={month}>
                  <div style={{ 
                    padding: 'var(--space-2) var(--space-4)', 
                    background: 'var(--surface-container-low)', 
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                    position: 'sticky',
                    top: 0,
                    borderBottom: '1px solid var(--border)',
                    borderTop: '1px solid var(--border)'
                  }}>
                    {month}
                  </div>
                  <table className="data-table" style={{ margin: 0, border: 'none' }}>
                    <tbody>
                      {monthHolidays.map((holiday) => {
                        const dateObj = new Date(holiday.date);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateNum = dateObj.getDate();
                        
                        return (
                          <tr key={holiday.id}>
                            <td style={{ width: '80px' }}>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                background: 'var(--primary-container)',
                                color: 'var(--on-primary-container)',
                                borderRadius: 'var(--radius-md)',
                                padding: '4px'
                              }}>
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{dayName}</span>
                                <span style={{ fontSize: 16, fontWeight: 800 }}>{dateNum}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{holiday.name}</div>
                              <span style={{ 
                                fontSize: 10, 
                                padding: '2px 6px', 
                                background: 'var(--surface-container-high)', 
                                borderRadius: 4,
                                textTransform: 'capitalize'
                              }}>
                                {holiday.holiday_type}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn btn-ghost btn-sm" 
                                style={{ color: 'var(--error)' }}
                                onClick={() => handleDelete(holiday.id)}
                                title="Delete Holiday"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
