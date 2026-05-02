// src/services/employeeService.js
import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { employees } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const getEmployees = async (filters = {}) => {
  if (USE_MOCK) {
    let data = [...employees];
    if (filters.department) data = data.filter(e => e.department === filters.department);
    if (filters.status)     data = data.filter(e => e.status === filters.status);
    if (filters.role)       data = data.filter(e => e.role === filters.role);
    if (filters.search)     data = data.filter(e =>
      e.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      e.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      e.code.toLowerCase().includes(filters.search.toLowerCase())
    );
    return data;
  }
  const params = new URLSearchParams(filters).toString();
  return apiGet(`/employees?${params}`);
};

export const getEmployee = async (id) => {
  if (USE_MOCK) return employees.find(e => e.id === id) || null;
  return apiGet(`/employees/${id}`);
};

export const createEmployee = async (data) => {
  if (USE_MOCK) { console.log('[MOCK] createEmployee', data); return { ...data, id: `emp_${Date.now()}` }; }
  return apiPost('/employees', data);
};

export const updateEmployee = async (id, data) => {
  if (USE_MOCK) { console.log('[MOCK] updateEmployee', id, data); return { id, ...data }; }
  return apiPut(`/employees/${id}`, data);
};

export const deleteEmployee = async (id) => {
  if (USE_MOCK) { console.log('[MOCK] deleteEmployee', id); return { success: true }; }
  return apiDelete(`/employees/${id}`);
};
