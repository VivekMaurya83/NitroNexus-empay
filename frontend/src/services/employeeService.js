/**
 * Employee Service
 * Endpoint prefix: /employees
 * Adapter: maps backend EmployeeOut → frontend Employee shape
 */
import api from './api';
import { employees as MOCK_EMPLOYEES } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Shape adapter ─────────────────────────────────────────────────────────────
// Resolves department_id / designation_id using cached lookup maps passed in,
// OR uses the string fields if backend joins them later.
const PHOTO_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6','#8b5cf6','#06b6d4','#f97316'];
let _deptCache = {};
let _desigCache = {};

export function adaptEmployee(e, idx = 0) {
  const fullName = `${e.first_name} ${e.last_name}`.trim();
  return {
    id:              e.id,
    employeeId:      e.id,
    code:            e.employee_code,
    name:            fullName,
    firstName:       e.first_name,
    lastName:        e.last_name,
    email:           e.email || '',
    phone:           e.phone || '',
    address:         e.address || '',
    dateOfBirth:     e.date_of_birth || '',
    panNumber:       e.pan_number || '',
    bankName:        e.bank_name || '',
    accountNumber:   e.account_number || '',
    ifscCode:        e.ifsc_code || '',
    department:      _deptCache[e.department_id]  || `Dept #${e.department_id || '—'}`,
    departmentId:    e.department_id,
    designation:     _desigCache[e.designation_id] || `Desig #${e.designation_id || '—'}`,
    designationId:   e.designation_id,
    employmentType:  e.employment_type  || 'full_time',
    status:          e.employment_status || 'active',
    joined:          e.date_of_joining  || '',
    avatar:          fullName.split(' ').map(n => n[0]).join('').toUpperCase(),
    photoColor:      PHOTO_COLORS[idx % PHOTO_COLORS.length],
    hasBankDetails:  !!(e.bank_name && e.account_number && e.ifsc_code),
    managerId:       e.manager_id || null,
  };
}

// ── Cache departments & designations for name resolution ─────────────────────
async function warmCaches() {
  if (Object.keys(_deptCache).length) return; // already warm
  const [depts, desigs] = await Promise.all([
    api.get('/employees/departments').catch(() => []),
    api.get('/employees/designations').catch(() => []),
  ]);
  (depts || []).forEach(d => { _deptCache[d.id] = d.name; });
  (desigs || []).forEach(d => { _desigCache[d.id] = d.title; });
}

// ── Employees ─────────────────────────────────────────────────────────────────
export async function getEmployees({ search = '', status = '', departmentId = '' } = {}) {
  if (USE_MOCK) return MOCK_EMPLOYEES;
  await warmCaches();
  const params = new URLSearchParams();
  if (search)       params.set('search',       search);
  if (status)       params.set('status',       status);
  if (departmentId) params.set('department_id', departmentId);
  params.set('limit', '200');
  const data = await api.get(`/employees/?${params}`);
  const list  = data?.employees || data || [];
  return list.map((e, i) => adaptEmployee(e, i));
}

export async function getEmployee(id) {
  if (USE_MOCK) return MOCK_EMPLOYEES.find(e => e.id === id);
  await warmCaches();
  const data = await api.get(`/employees/${id}`);
  return adaptEmployee(data);
}

export async function createEmployee(payload) {
  if (USE_MOCK) return { ...payload, id: Date.now() };
  const data = await api.post('/employees/', payload);
  return adaptEmployee(data);
}

export async function updateEmployee(id, payload) {
  if (USE_MOCK) return { id, ...payload };
  const data = await api.patch(`/employees/${id}`, payload);
  return adaptEmployee(data);
}

export async function terminateEmployee(id) {
  if (USE_MOCK) return {};
  return api.delete(`/employees/${id}`);
}

// ── Departments & Designations ────────────────────────────────────────────────
export async function getDepartments() {
  if (USE_MOCK) return [{ id:1, name:'Engineering' },{ id:2, name:'HR' },{ id:3, name:'Finance' }];
  return api.get('/employees/departments');
}

export async function createDepartment(data) {
  return api.post('/employees/departments', data);
}

export async function getDesignations() {
  if (USE_MOCK) return [{ id:1, title:'Software Engineer' },{ id:2, title:'HR Manager' }];
  return api.get('/employees/designations');
}

export async function createDesignation(data) {
  return api.post('/employees/designations', data);
}
