import api from './api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const now = new Date();

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ANALYTICS = {
  leaveByDept: [
    { dept:'Engineering', approved:18, pending:3, rejected:2 },
    { dept:'HR',          approved:8,  pending:1, rejected:1 },
    { dept:'Finance',     approved:12, pending:2, rejected:0 },
    { dept:'Design',      approved:6,  pending:1, rejected:1 },
    { dept:'Analytics',   approved:9,  pending:0, rejected:2 },
  ],
  hoursWorked: [
    { employee:'Arjun Singh',   hours:168, target:176 },
    { employee:'Priya Sharma',  hours:152, target:176 },
    { employee:'Rahul Gupta',   hours:180, target:176 },
    { employee:'Sneha Patel',   hours:140, target:176 },
    { employee:'Vikram Das',    hours:176, target:176 },
  ],
  monthlyAttendance: [
    { month:'Jan', present:22, absent:2, late:2 },
    { month:'Feb', present:20, absent:4, late:2 },
    { month:'Mar', present:24, absent:1, late:1 },
    { month:'Apr', present:21, absent:2, late:3 },
    { month:'May', present:18, absent:3, late:2 },
  ],
};

// ── Leave Utilization ─────────────────────────────────────────────────────────
export async function getLeaveUtilization(year = now.getFullYear()) {
  if (USE_MOCK) return MOCK_ANALYTICS.leaveByDept;
  const data = await api.get(`/analytics/leave-utilization?year=${year}`);
  // Backend returns array of { department, leave_type, total_allocated, total_used, pending_count }
  // Aggregate by department for the stacked bar chart
  const deptMap = {};
  (data || []).forEach(r => {
    if (!deptMap[r.department]) deptMap[r.department] = { dept: r.department, approved:0, pending:0, rejected:0 };
    deptMap[r.department].approved += r.total_used    || 0;
    deptMap[r.department].pending  += r.pending_count || 0;
  });
  return Object.values(deptMap);
}

// ── Payroll Breakdown (by dept) ───────────────────────────────────────────────
export async function getPayrollBreakdown(month = now.getMonth()+1, year = now.getFullYear()) {
  if (USE_MOCK) return [];
  return api.get(`/analytics/payroll-breakdown?month=${month}&year=${year}`);
}

// ── Payroll Trend ─────────────────────────────────────────────────────────────
export async function getPayrollTrend(months = 6) {
  if (USE_MOCK) return [];
  return api.get(`/analytics/payroll-trend?months=${months}`);
}

// ── Headcount ─────────────────────────────────────────────────────────────────
export async function getHeadcount() {
  if (USE_MOCK) return [];
  return api.get('/analytics/headcount');
}

// ── Attendance Heatmap (per employee) ─────────────────────────────────────────
export async function getAttendanceHeatmap(employeeId, month = now.getMonth()+1, year = now.getFullYear()) {
  if (USE_MOCK) return {};
  return api.get(`/analytics/attendance-heatmap/${employeeId}?month=${month}&year=${year}`);
}

// ── Composite: all analytics in one call (used by Analytics page) ─────────────
export async function getAnalytics() {
  if (USE_MOCK) return MOCK_ANALYTICS;
  const [leaveByDept, trend] = await Promise.all([
    getLeaveUtilization().catch(() => MOCK_ANALYTICS.leaveByDept),
    getPayrollTrend().catch(() => []),
  ]);
  return {
    leaveByDept,
    hoursWorked:        MOCK_ANALYTICS.hoursWorked,      // no direct backend endpoint yet
    monthlyAttendance:  MOCK_ANALYTICS.monthlyAttendance, // derived from summary; simplified
    payrollTrend:       trend,
  };
}

// ── System alerts (derived from employee data) ─────────────────────────────────
export async function getSystemAlerts() {
  if (USE_MOCK) {
    const { systemAlerts } = await import('../utils/mockData');
    return systemAlerts || [];
  }
  try {
    // Fetch employees and flag those missing bank details
    const { getEmployees } = await import('./employeeService');
    const employees = await getEmployees();
    const alerts = [];
    employees.forEach(e => {
      if (!e.hasBankDetails) {
        alerts.push({
          id: `bank_${e.id}`, type:'no_bank_details', severity:'warning',
          employee: e.name, department: e.department,
          message: 'Bank details missing — salary cannot be processed',
        });
      }
      if (!e.managerId) {
        alerts.push({
          id: `mgr_${e.id}`, type:'no_manager', severity:'info',
          employee: e.name, department: e.department,
          message: 'No manager assigned',
        });
      }
    });
    return alerts;
  } catch { return []; }
}

export async function dismissAlert(id) {
  // Client-side dismiss only (no backend endpoint)
  return true;
}
