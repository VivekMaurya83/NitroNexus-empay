/**
 * Leave Service
 * 2-stage approval workflow:
 *   Employee applies → HR reviews (hr_approved / rejected)
 *   → Payroll confirms (approved / rejected)
 * Admin can invoke either endpoint directly (backend requires_roles check allows admin on both)
 * Endpoint prefix: /leaves
 */
import api from './api';
import { leaveRequests } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Adapters ──────────────────────────────────────────────────────────────────
function adaptApplication(a, employeeName = '') {
  return {
    id:                       a.id,
    employeeId:               a.employee_id,
    employee:                 employeeName || `Employee #${a.employee_id}`,
    type:                     leaveTypeLabel(a.leave_type),
    leaveType:                a.leave_type,
    from:                     a.start_date,
    to:                       a.end_date,
    days:                     a.total_days,
    reason:                   a.reason || '',
    status:                   a.status,         // pending | hr_approved | approved | rejected | cancelled
    hrRemarks:                a.hr_remarks      || '',
    payrollRemarks:           a.payroll_remarks || '',
    requiresPayrunAmendment:  a.requires_payrun_amendment,
    affectsPayrunId:          a.affects_payrun_id,
    appliedAt:                a.created_at,
  };
}

function adaptPolicy(p) {
  return {
    id:             p.id,
    name:           leaveTypeLabel(p.leave_type),
    leaveType:      p.leave_type,
    maxDays:        p.max_days_per_year,
    isPaid:         p.is_paid,
    carryForward:   p.carry_forward,
  };
}

function adaptAllocation(a) {
  return {
    id:         a.id,
    employeeId: a.employee_id,
    policyId:   a.policy_id,
    leaveType:  a.leave_type,
    year:       a.year,
    allocated:  a.total_days,
    used:       a.used_days,
    remaining:  a.remaining_days,
  };
}

function leaveTypeLabel(t) {
  return {
    casual:'Casual Leave', sick:'Sick Leave', earned:'Earned Leave',
    maternity:'Maternity Leave', paternity:'Paternity Leave',
    unpaid:'Unpaid Leave', comp_off:'Comp Off',
  }[t] || t;
}

// ── Leave Applications ─────────────────────────────────────────────────────────
export async function getLeaveRequests({ status = '', employeeId = '' } = {}) {
  if (USE_MOCK) return leaveRequests.map(l => adaptApplication(l, l.employee));
  const params = new URLSearchParams({ limit:'200' });
  if (status)     params.set('status',      status);
  if (employeeId) params.set('employee_id', employeeId);
  const data = await api.get(`/leaves/?${params}`);
  const list = data?.applications || data || [];
  return list.map(a => adaptApplication(a));
}

export async function applyLeave({ leaveType, fromDate, toDate, reason }) {
  if (USE_MOCK) return { id: Date.now(), status:'pending', employee:'Me', type: leaveType };
  const data = await api.post('/leaves/apply', {
    leave_type: leaveType,
    start_date: fromDate,
    end_date:   toDate,
    reason,
  });
  return adaptApplication(data);
}

export async function cancelLeave(id) {
  if (USE_MOCK) return {};
  const data = await api.patch(`/leaves/${id}/cancel`, {});
  return adaptApplication(data);
}

// ── HR Review (Admin & HR Officer) ────────────────────────────────────────────
export async function hrReviewLeave(id, action, remarks = '') {
  if (USE_MOCK) return {};
  const data = await api.patch(`/leaves/${id}/hr-review`, { action, remarks });
  return adaptApplication(data);
}

// ── Payroll Review (Admin & Payroll Officer) ───────────────────────────────────
export async function payrollReviewLeave(id, action, remarks = '') {
  if (USE_MOCK) return {};
  const data = await api.patch(`/leaves/${id}/payroll-review`, { action, remarks });
  return adaptApplication(data);
}

// ── Policies ──────────────────────────────────────────────────────────────────
export async function getLeavePolicies() {
  if (USE_MOCK) return [
    { id:1, name:'Casual Leave',  leaveType:'casual',  maxDays:12, isPaid:true },
    { id:2, name:'Sick Leave',    leaveType:'sick',    maxDays:12, isPaid:true },
    { id:3, name:'Earned Leave',  leaveType:'earned',  maxDays:15, isPaid:true },
    { id:4, name:'Unpaid Leave',  leaveType:'unpaid',  maxDays:30, isPaid:false },
  ];
  const data = await api.get('/leaves/policies');
  return (data || []).map(adaptPolicy);
}

export async function createLeavePolicy(payload) {
  return api.post('/leaves/policies', payload);
}

// ── Allocations ────────────────────────────────────────────────────────────────
export async function getLeaveAllocations(employeeId, year) {
  if (USE_MOCK) return [
    { id:1, leaveType:'Casual Leave',  allocated:12, used:4, remaining:8 },
    { id:2, leaveType:'Sick Leave',    allocated:12, used:2, remaining:10 },
    { id:3, leaveType:'Earned Leave',  allocated:15, used:5, remaining:10 },
  ];
  const params = year ? `?year=${year}` : '';
  const data = await api.get(`/leaves/allocations/${employeeId}${params}`);
  return (data || []).map(adaptAllocation);
}

export async function createAllocation(payload) {
  return api.post('/leaves/allocations', payload);
}

// ── Backward-compat aliases ───────────────────────────────────────────────────
export const getLeaveTypes = getLeavePolicies; // old alias used by LeaveManagement modal

// Unified action router — picks the right review endpoint based on user role
export async function updateLeaveStatus(id, status, reviewerRole, remarks = '') {
  const action = status === 'approved' ? 'approve' : 'reject';
  if (reviewerRole === 'hr_officer' || reviewerRole === 'admin') {
    return hrReviewLeave(id, action, remarks);
  }
  return payrollReviewLeave(id, action, remarks);
}
