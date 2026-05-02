/**
 * Attendance Service
 * Key backend note: check-out requires attendance_id returned from check-in
 * Endpoint prefix: /attendance
 */
import api from './api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Mock fallback data ─────────────────────────────────────────────────────────
import { attendanceLogs, todayAttendance } from '../utils/mockData';

// ── Adapters ──────────────────────────────────────────────────────────────────
function fmtTime(isoStr) {
  if (!isoStr) return null;
  return new Date(isoStr).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
}

function adaptRecord(r) {
  return {
    id:           r.id,
    employeeId:   r.employee_id,
    date:         r.date,
    status:       r.status,
    checkIn:      fmtTime(r.check_in),
    checkOut:     fmtTime(r.check_out),
    checkInRaw:   r.check_in,
    checkOutRaw:  r.check_out,
    hours:        r.working_hours ? `${r.working_hours.toFixed(1)}h` : '—',
    workingHours: r.working_hours,
    remarks:      r.remarks,
  };
}

function adaptSummary(s) {
  return {
    presentDays: s.present_days,
    absentDays:  s.absent_days,
    lateDays:    s.late_days,
    halfDays:    s.half_day_days || 0,
    totalHours:  s.total_hours,
    records:     (s.records || []).map(adaptRecord),
  };
}

// ── Clock In ──────────────────────────────────────────────────────────────────
export async function clockIn(employeeId) {
  if (USE_MOCK) return { id: Date.now(), checkIn: new Date().toLocaleTimeString() };
  const data = await api.post('/attendance/check-in', {
    employee_id: employeeId,
    check_in:    new Date().toISOString(),
  });
  return { ...adaptRecord(data), attendanceId: data.id };
}

// ── Clock Out (requires attendanceId from check-in) ───────────────────────────
export async function clockOut(attendanceId) {
  if (USE_MOCK) return { checkOut: new Date().toLocaleTimeString() };
  const data = await api.patch(`/attendance/${attendanceId}/check-out`, {
    check_out: new Date().toISOString(),
  });
  return adaptRecord(data);
}

// ── Manual Entry (HR/Payroll/Admin) ───────────────────────────────────────────
export async function manualEntry(payload) {
  if (USE_MOCK) return {};
  const data = await api.post('/attendance/manual', payload);
  return adaptRecord(data);
}

// ── Today's status board ───────────────────────────────────────────────────────
export async function getTodayStatusBoard(allEmployees = []) {
  if (USE_MOCK) return todayAttendance;
  const records = await api.get('/attendance/today');
  // records is an array for HR/Admin, single record or null for Employee
  const list = Array.isArray(records) ? records : (records ? [records] : []);
  // Merge attendance records with employee names from allEmployees array
  return list.map(r => {
    const emp = allEmployees.find(e => e.employeeId === r.employee_id) || {};
    return {
      employeeId:  r.employee_id,
      name:        emp.name         || `Employee #${r.employee_id}`,
      designation: emp.designation  || '',
      department:  emp.department   || '',
      avatar:      emp.avatar       || String(r.employee_id)[0],
      photoColor:  emp.photoColor   || '#6366f1',
      status:      r.status,
      checkIn:     fmtTime(r.check_in),
      checkOut:    fmtTime(r.check_out),
      daysPresent: null, // summary loaded separately per employee
    };
  });
}

// ── My today record (Employee) ────────────────────────────────────────────────
export async function getMyTodayRecord() {
  if (USE_MOCK) return null;
  const data = await api.get('/attendance/today');
  return data ? adaptRecord(data) : null;
}

// ── Monthly summary ────────────────────────────────────────────────────────────
export async function getMonthlySummary(employeeId, month, year) {
  if (USE_MOCK) return { presentDays:18, absentDays:2, lateDays:3, totalHours:162, records:[] };
  const data = await api.get(`/attendance/summary/${employeeId}?month=${month}&year=${year}`);
  return adaptSummary(data);
}

// ── Date range (for history table) ────────────────────────────────────────────
export async function getAttendanceRange(employeeId, fromDate, toDate) {
  if (USE_MOCK) return attendanceLogs.map(adaptRecord);
  const data = await api.get(
    `/attendance/employee/${employeeId}?from_date=${fromDate}&to_date=${toDate}`
  );
  return (data || []).map(adaptRecord);
}

// ── Backward-compat aliases used by older components ─────────────────────────
export const getMyAttendance       = (empId) => {
  const now = new Date();
  return getAttendanceRange(empId, `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, now.toISOString().slice(0,10));
};
export const getAllAttendance       = () => getTodayStatusBoard();
