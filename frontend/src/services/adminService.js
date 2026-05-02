/**
 * adminService.js — Admin-specific API calls: invites, onboarding status, payroll config.
 */
import api from './api';

// ── Onboarding ────────────────────────────────────────────────────────────────
export async function getOnboardingStatus() {
  return api.get('/companies/me/onboarding-status');
}

// ── Invite staff ──────────────────────────────────────────────────────────────
export async function inviteHR({ name, email }) {
  return api.post('/auth/invite-hr', { name, email });
}

export async function invitePayroll({ name, email }) {
  return api.post('/auth/invite-payroll', { name, email });
}

/**
 * Invite an employee — creates user + employee record + sends temp password email.
 * @param {object} data - { first_name, last_name, email, date_of_joining,
 *                          date_of_birth?, department_id?, employment_type?, phone? }
 */
export async function inviteEmployee(data) {
  return api.post('/auth/invite-employee', data);
}

// ── Payroll Config ────────────────────────────────────────────────────────────
export async function getPayrollConfig() {
  return api.get('/payroll/config');
}

export async function savePayrollConfig(rules) {
  return api.post('/payroll/config', rules);
}
