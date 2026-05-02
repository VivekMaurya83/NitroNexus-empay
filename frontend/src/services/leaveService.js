// src/services/leaveService.js
import { apiGet, apiPost, apiPatch } from './api';
import { leaveRequests, leaveAllocations, leaveTypes } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const getLeaveRequests = async (filters = {}) => {
  if (USE_MOCK) {
    let data = [...leaveRequests];
    if (filters.status)     data = data.filter(r => r.status === filters.status);
    if (filters.employeeId) data = data.filter(r => r.employeeId === filters.employeeId);
    if (filters.type)       data = data.filter(r => r.type === filters.type);
    return data;
  }
  const params = new URLSearchParams(filters).toString();
  return apiGet(`/leave/requests?${params}`);
};

export const applyLeave = async (data) => {
  if (USE_MOCK) { console.log('[MOCK] applyLeave', data); return { ...data, id: `lr_${Date.now()}`, status: 'pending' }; }
  return apiPost('/leave/requests', data);
};

export const updateLeaveStatus = async (id, status, actorName) => {
  if (USE_MOCK) { console.log('[MOCK] updateLeaveStatus', id, status, actorName); return { id, status, approvedBy: actorName }; }
  return apiPatch(`/leave/requests/${id}`, { status });
};

export const getLeaveAllocations = async (filters = {}) => {
  if (USE_MOCK) {
    let data = [...leaveAllocations];
    if (filters.employeeId) data = data.filter(a => a.employeeId === filters.employeeId);
    return data;
  }
  return apiGet('/leave/allocations');
};

export const createAllocation = async (data) => {
  if (USE_MOCK) { console.log('[MOCK] createAllocation', data); return { ...data, id: `la_${Date.now()}`, used: 0 }; }
  return apiPost('/leave/allocations', data);
};

export const getLeaveTypes = async () => {
  if (USE_MOCK) return leaveTypes;
  return apiGet('/leave/types');
};
