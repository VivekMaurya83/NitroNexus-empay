import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES } from './utils/mockData';
import './styles/global.css';

// Layout
import Layout from './components/layout/Layout';

// Auth
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin
import AdminDashboard      from './pages/admin/AdminDashboard';
import AdminSettings       from './pages/admin/AdminSettings';
import AdminConfigurations from './pages/admin/AdminConfigurations';
import PayrollRules        from './pages/admin/PayrollRules';

// HR
import HRDirectory    from './pages/hr/HRDirectory';
import AddEmployee    from './pages/hr/AddEmployee';
import LeaveAllocation from './pages/hr/LeaveAllocation';

// Employee
import EmployeePortal    from './pages/employee/EmployeePortal';
import AttendanceTracker from './pages/employee/AttendanceTracker';
import LeaveManagement   from './pages/employee/LeaveManagement';
import UserProfile       from './pages/employee/UserProfile';

// Payroll
import PayrollManagement from './pages/payroll/PayrollManagement';
import SalaryStructure   from './pages/payroll/SalaryStructure';
import DetailedPayslip   from './pages/payroll/DetailedPayslip';

// Shared
import EmployeeStatusBoard from './pages/shared/EmployeeStatusBoard';
import Analytics           from './pages/shared/Analytics';

// ─── Route guard ────────────────────────────────────────────────────────────
function RoleRoute({ element, allowed }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowed && !allowed.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Layout>{element}</Layout>;
}

function homeFor(role) {
  const map = {
    [ROLES.ADMIN]:   '/dashboard',
    [ROLES.HR]:      '/hr-directory',
    [ROLES.PAYROLL]: '/payroll',
    [ROLES.EMPLOYEE]:'/employee-portal',
  };
  return map[role] || '/login';
}

// ─── Root redirect based on role ────────────────────────────────────────────
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeFor(user.role)} replace />;
}

const A  = [ROLES.ADMIN];
const AH = [ROLES.ADMIN, ROLES.HR];
const AP = [ROLES.ADMIN, ROLES.PAYROLL];
const AHP= [ROLES.ADMIN, ROLES.HR, ROLES.PAYROLL];
const ALL= [ROLES.ADMIN, ROLES.HR, ROLES.PAYROLL, ROLES.EMPLOYEE];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin only */}
          <Route path="/dashboard"            element={<RoleRoute element={<AdminDashboard />}      allowed={A}   />} />
          <Route path="/admin/configurations" element={<RoleRoute element={<AdminConfigurations />} allowed={A}   />} />
          <Route path="/admin/settings"       element={<RoleRoute element={<AdminSettings />}       allowed={A}   />} />
          <Route path="/admin/payroll-rules"  element={<RoleRoute element={<PayrollRules />}        allowed={A}   />} />

          {/* Admin + HR */}
          <Route path="/hr-directory"        element={<RoleRoute element={<HRDirectory />}    allowed={AH}  />} />
          <Route path="/hr/add-employee"     element={<RoleRoute element={<AddEmployee />}    allowed={AH}  />} />
          <Route path="/hr/leave-allocation" element={<RoleRoute element={<LeaveAllocation />}allowed={AH}  />} />

          {/* Admin + Payroll */}
          <Route path="/payroll"                  element={<RoleRoute element={<PayrollManagement />} allowed={AP}  />} />
          <Route path="/payroll/salary-structure" element={<RoleRoute element={<SalaryStructure />}   allowed={AP}  />} />

          {/* All staff - leave management (approve/reject for HR+Payroll, apply for Employee) */}
          <Route path="/leave"   element={<RoleRoute element={<LeaveManagement />} allowed={ALL} />} />
          <Route path="/payslip" element={<RoleRoute element={<DetailedPayslip />} allowed={ALL} />} />

          {/* Shared - attendance (own vs all gated inside component) */}
          <Route path="/attendance" element={<RoleRoute element={<AttendanceTracker />} allowed={ALL} />} />

          {/* Shared pages - all roles */}
          <Route path="/status-board" element={<RoleRoute element={<EmployeeStatusBoard />} allowed={ALL} />} />
          <Route path="/analytics"    element={<RoleRoute element={<Analytics />}           allowed={AHP} />} />

          {/* Profile - all roles (component gates admin extras) */}
          <Route path="/profile" element={<RoleRoute element={<UserProfile />} allowed={ALL} />} />

          {/* Employee portal */}
          <Route path="/employee-portal" element={<RoleRoute element={<EmployeePortal />} allowed={[ROLES.EMPLOYEE]} />} />

          {/* Default */}
          <Route path="/"  element={<RootRedirect />} />
          <Route path="*"  element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
