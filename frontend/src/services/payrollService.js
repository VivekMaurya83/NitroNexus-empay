// src/services/payrollService.js
import { apiGet, apiPost, apiPut } from './api';
import { payrolls, payslipData, salaryStructures, payrollRules } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const getPayrolls = async () => {
  if (USE_MOCK) return payrolls;
  return apiGet('/payroll');
};

export const runPayroll = async (month, year) => {
  if (USE_MOCK) { console.log('[MOCK] runPayroll', month, year); return { success: true, message: `Payroll for ${month} ${year} queued.` }; }
  return apiPost('/payroll/run', { month, year });
};

export const getPayslip = async (employeeId, month, year) => {
  if (USE_MOCK) return payslipData;
  return apiGet(`/payroll/payslip/${employeeId}?month=${month}&year=${year}`);
};

export const getSalaryStructures = async (filters = {}) => {
  if (USE_MOCK) {
    let data = [...salaryStructures];
    if (filters.employeeId) data = data.filter(s => s.employeeId === filters.employeeId);
    return data;
  }
  return apiGet('/payroll/salary-structures');
};

export const updateSalaryStructure = async (id, data) => {
  if (USE_MOCK) { console.log('[MOCK] updateSalaryStructure', id, data); return { id, ...data }; }
  return apiPut(`/payroll/salary-structures/${id}`, data);
};

export const getPayrollRules = async () => {
  if (USE_MOCK) return payrollRules;
  return apiGet('/payroll/rules');
};

export const updatePayrollRules = async (data) => {
  if (USE_MOCK) { console.log('[MOCK] updatePayrollRules', data); return { ...data, updatedAt: new Date().toISOString() }; }
  return apiPut('/payroll/rules', data);
};
