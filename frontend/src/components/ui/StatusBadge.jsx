import React from 'react';

/**
 * StatusBadge — covers all backend enum values:
 * AttendanceStatus: present, absent, late, half_day, work_from_home, on_leave, holiday, weekend
 * LeaveStatus:      pending, hr_approved, approved, rejected, cancelled
 * PayrunStatus:     processing, completed, amended, failed
 * EmploymentStatus: active, inactive, terminated, on_notice
 */
const STATUS_MAP = {
  // Attendance
  present:       { label:'Present',        badge:'badge-present',   symbol:'✓' },
  absent:        { label:'Absent',         badge:'badge-absent',    symbol:'✗' },
  late:          { label:'Late',           badge:'badge-late',      symbol:'⏰' },
  half_day:      { label:'Half Day',       badge:'badge-warning',   symbol:'½' },
  work_from_home:{ label:'WFH',            badge:'badge-processed', symbol:'🏠' },
  on_leave:      { label:'On Leave',       badge:'badge-pending',   symbol:'🏖' },
  holiday:       { label:'Holiday',        badge:'badge-draft',     symbol:'🎉' },
  weekend:       { label:'Weekend',        badge:'badge-draft',     symbol:'⛔' },
  // Leave status
  pending:       { label:'Pending',        badge:'badge-pending',   symbol:'⏳' },
  hr_approved:   { label:'HR Approved',    badge:'badge-hr',        symbol:'✓ HR' },
  approved:      { label:'Approved',       badge:'badge-approved',  symbol:'✓' },
  rejected:      { label:'Rejected',       badge:'badge-rejected',  symbol:'✗' },
  cancelled:     { label:'Cancelled',      badge:'badge-draft',     symbol:'⊘' },
  // Payroll / Payrun
  processing:    { label:'Processing',     badge:'badge-pending',   symbol:'⟳' },
  completed:     { label:'Completed',      badge:'badge-approved',  symbol:'✓' },
  amended:       { label:'Amended',        badge:'badge-warning',   symbol:'✎' },
  failed:        { label:'Failed',         badge:'badge-rejected',  symbol:'✗' },
  paid:          { label:'Paid',           badge:'badge-paid',      symbol:'₹' },
  // Employment
  active:        { label:'Active',         badge:'badge-active',    symbol:'●' },
  inactive:      { label:'Inactive',       badge:'badge-inactive',  symbol:'○' },
  terminated:    { label:'Terminated',     badge:'badge-rejected',  symbol:'✗' },
  on_notice:     { label:'On Notice',      badge:'badge-warning',   symbol:'⚠' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status || '—', badge:'badge-draft', symbol:'○' };
  return (
    <span className={`badge ${s.badge}`}>
      <span role="img" aria-label={s.label}>{s.symbol}</span>{' '}
      {s.label}
    </span>
  );
}

export { STATUS_MAP };
