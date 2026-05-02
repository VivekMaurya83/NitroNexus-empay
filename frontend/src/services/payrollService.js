import api from './api';
import { payrolls } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function adaptSalary(s, name='') {
  const gross = s.basic + s.hra + s.conveyance + s.medical + s.special_allowance + s.lta + s.bonus;
  const ptMap = { Maharashtra:200, Karnataka:200, 'West Bengal':200 };
  return {
    id: s.id, employeeId: s.employee_id, employee: name || `Employee #${s.employee_id}`,
    basic: s.basic, hra: s.hra, conveyance: s.conveyance, medical: s.medical,
    specialAllowance: s.special_allowance, lta: s.lta, bonus: s.bonus,
    grossEarnings: gross, pfApplicable: s.pf_applicable,
    professionalTaxState: s.professional_tax_state,
    isActive: s.is_active, createdAt: s.created_at,
    // legacy UI fields
    allowances: s.special_allowance, pf: s.pf_applicable ? 12 : 0,
    profTax: ptMap[s.professional_tax_state] || 200,
    effective: s.created_at?.slice(0,10),
  };
}

function adaptPayrun(p) {
  return {
    id: p.id, month: p.month, year: p.year,
    period: `${MONTHS[p.month]} ${p.year}`,
    status: p.status, totalGross: p.total_gross,
    totalDeductions: p.total_deductions, totalNet: p.total_net,
    employees: p.employee_count, isAmended: p.is_amended, notes: p.notes,
    total: `₹${Number(p.total_net||0).toLocaleString('en-IN')}`,
  };
}

function adaptPayslip(s) {
  return {
    id: s.id, payrunId: s.payrun_id, employeeId: s.employee_id,
    employee: s.employee_name || `Employee #${s.employee_id}`,
    employeeCode: s.employee_code,
    totalWorkingDays: s.total_working_days, daysPresent: s.days_present,
    daysAbsent: s.days_absent, paidLeaveDays: s.paid_leave_days,
    unpaidLeaveDays: s.unpaid_leave_days, effectivePaidDays: s.effective_paid_days,
    basic: s.basic, hra: s.hra, conveyance: s.conveyance, medical: s.medical,
    specialAllowance: s.special_allowance, lta: s.lta, bonus: s.bonus,
    grossEarnings: s.gross_earnings, pfEmployee: s.pf_employee,
    pfEmployer: s.pf_employer, professionalTax: s.professional_tax,
    tds: s.tds, otherDeductions: s.other_deductions,
    totalDeductions: s.total_deductions, netPay: s.net_pay,
    isAnomalous: s.is_anomalous, anomalyFlags: s.anomaly_flags,
    isAmended: s.is_amended, amendmentReason: s.amendment_reason,
  };
}

// ── Salary Structures ─────────────────────────────────────────────────────────
export async function getSalaryStructure(employeeId) {
  if (USE_MOCK) return null;
  const data = await api.get(`/salary/${employeeId}`);
  return adaptSalary(data);
}

export async function getSalaryStructures({ employeeId } = {}) {
  if (USE_MOCK) { const { salaryStructures } = await import('../utils/mockData'); return salaryStructures || []; }
  if (employeeId) { const d = await api.get(`/salary/${employeeId}`); return [adaptSalary(d)]; }
  return [];
}

export async function createSalaryStructure(payload) {
  const data = await api.post('/salary/', payload);
  return adaptSalary(data);
}

export async function updateSalaryStructure(employeeId, payload) {
  if (USE_MOCK) return {};
  // Backend: POST creates new active structure (deactivates old)
  const data = await api.post('/salary/', { employee_id: employeeId, ...payload });
  return adaptSalary(data);
}

// ── Payruns ────────────────────────────────────────────────────────────────────
export async function getPayruns() {
  if (USE_MOCK) return payrolls;
  const data = await api.get('/payroll/runs');
  return (data || []).map(adaptPayrun);
}

export async function runPayroll(month, year) {
  const data = await api.post('/payroll/run', { month, year });
  return adaptPayrun(data);
}

export async function getPendingAmendments() {
  if (USE_MOCK) return [];
  return api.get('/payroll/pending-amendments');
}

// ── Payslips ───────────────────────────────────────────────────────────────────
export async function getPayslipsForRun(payrunId) {
  if (USE_MOCK) return [];
  const data = await api.get(`/payroll/runs/${payrunId}/payslips`);
  return (data || []).map(s => adaptPayslip(s));
}

export async function getPayslip(payslipId) {
  if (USE_MOCK) return null;
  const data = await api.get(`/payroll/payslips/${payslipId}`);
  return adaptPayslip(data);
}

export async function downloadPayslip(payslipId) {
  const blob = await api.blob(`/payroll/payslips/${payslipId}/download`);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `payslip_${payslipId}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

export async function updatePayslip(payslipId, payload) {
  if (USE_MOCK) return {};
  const data = await api.patch(`/payroll/payslips/${payslipId}`, payload);
  return adaptPayslip(data);
}

// ── Payroll Rules (no backend endpoint — local only) ──────────────────────────
const DEFAULT_RULES = {
  pfPercentage:12, employerPf:12, professionalTax:200,
  taxSlab1Rate:5, taxSlab2Rate:20, taxSlab3Rate:30,
  overtimeMultiplier:1.5, cutoffDate:28,
  gratuityRate:4.81, esiRate:0.75, esiThreshold:21000,
};
export const getPayrollRules    = async () => DEFAULT_RULES;
export const updatePayrollRules = async (r) => r;
