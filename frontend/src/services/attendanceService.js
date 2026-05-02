// src/services/attendanceService.js
import { apiGet, apiPost, apiPatch } from './api';
import { attendanceLogs, allAttendance, todayAttendance } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const getMyAttendance = async (employeeId, filters = {}) => {
  if (USE_MOCK) {
    let data = [...attendanceLogs];
    if (filters.status) data = data.filter(a => a.status === filters.status);
    return data;
  }
  return apiGet(`/attendance/me?employeeId=${employeeId}`);
};

export const getAllAttendance = async (filters = {}) => {
  if (USE_MOCK) {
    let data = [...allAttendance];
    if (filters.status)     data = data.filter(a => a.status === filters.status);
    if (filters.department) data = data.filter(a => a.department === filters.department);
    return data;
  }
  const params = new URLSearchParams(filters).toString();
  return apiGet(`/attendance?${params}`);
};

export const getTodayStatusBoard = async () => {
  if (USE_MOCK) return todayAttendance;
  return apiGet('/attendance/today-board');
};

export const clockIn = async (employeeId) => {
  const ts = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  if (USE_MOCK) { console.log('[MOCK] clockIn', employeeId, ts); return { checkIn: ts, status: 'present' }; }
  return apiPost('/attendance/clock-in', { employeeId });
};

export const clockOut = async (employeeId) => {
  const ts = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  if (USE_MOCK) { console.log('[MOCK] clockOut', employeeId, ts); return { checkOut: ts }; }
  return apiPost('/attendance/clock-out', { employeeId });
};
