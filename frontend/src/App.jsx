import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import './styles/global.css';

// Layout
import Layout from './components/layout/Layout';

// Auth & Landing
import LandingPage from './pages/auth/LandingPage';
import Login       from './pages/auth/Login';
import Register    from './pages/auth/Register';

// Admin
import AdminDashboard      from './pages/admin/AdminDashboard';
import CompanyUsers       from './pages/admin/CompanyUsers';
import AdminSetup          from './pages/admin/AdminSetup';

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
import DetailedPayslip   from './pages/payroll/DetailedPayslip';

// Shared
import EmployeeStatusBoard from './pages/shared/EmployeeStatusBoard';
import Analytics           from './pages/shared/Analytics';

// ─── Route guard ────────────────────────────────────────────────────────────
function RoleRoute({ element, allowed }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    console.warn('RoleRoute: No user found, redirecting to /');
    return <Navigate to="/" replace />;
  }
  if (allowed && !allowed.includes(user.role)) {
    console.log(`RoleRoute: Access denied for ${user.role} to ${window.location.pathname}`);
    console.warn(`RoleRoute: Role ${user.role} not allowed for this route. Redirecting to ${homeFor(user.role)}`);
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return <Layout>{element}</Layout>;
}

function homeFor(role) {
  const map = {
    [ROLES.ADMIN]:   '/dashboard',
    [ROLES.HR]:      '/hr-directory',
    [ROLES.PAYROLL]: '/payroll',
    [ROLES.EMPLOYEE]:'/employee-portal',
  };
  return map[role] || '/';
}

// ─── Root redirect based on role ────────────────────────────────────────────
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={homeFor(user.role)} replace />;
}

const A   = [ROLES.ADMIN];
const AH  = [ROLES.ADMIN, ROLES.HR];
const AP  = [ROLES.ADMIN, ROLES.PAYROLL];
const AHP = [ROLES.ADMIN, ROLES.HR, ROLES.PAYROLL];
const ALL = [ROLES.ADMIN, ROLES.HR, ROLES.PAYROLL, ROLES.EMPLOYEE];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing page — role selector */}
          <Route path="/"         element={<LandingPage />} />

          {/* Public auth routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin first-time setup wizard (no Layout wrapper) */}
          <Route path="/admin/setup" element={<SetupGuard />} />

          {/* Admin only */}
          <Route path="/dashboard"            element={<RoleRoute element={<AdminDashboard />}      allowed={A}   />} />
          <Route path="/admin/settings"       element={<RoleRoute element={<CompanyUsers />}       allowed={A}   />} />

          {/* Admin + HR */}
          <Route path="/hr-directory"        element={<RoleRoute element={<HRDirectory />}    allowed={AH}  />} />
          <Route path="/hr/leave-allocation" element={<RoleRoute element={<LeaveAllocation />}allowed={AH}  />} />

          {/* Add Employee — Admin + HR + Payroll */}
          <Route path="/hr/add-employee"     element={<RoleRoute element={<AddEmployee />}    allowed={AHP} />} />
          <Route path="/hr/edit-employee/:id"element={<RoleRoute element={<AddEmployee />}    allowed={AHP} />} />

          {/* Admin + Payroll */}
          <Route path="/payroll"                  element={<RoleRoute element={<PayrollManagement />} allowed={AP}  />} />

          {/* All staff */}
          <Route path="/leave"   element={<RoleRoute element={<LeaveManagement />} allowed={ALL} />} />
          <Route path="/payslip" element={<RoleRoute element={<DetailedPayslip />} allowed={ALL} />} />

          {/* Shared */}
          <Route path="/attendance"  element={<RoleRoute element={<AttendanceTracker />}   allowed={ALL} />} />
          <Route path="/status-board"element={<RoleRoute element={<EmployeeStatusBoard />} allowed={ALL} />} />
          <Route path="/analytics"   element={<RoleRoute element={<Analytics />}           allowed={AHP} />} />

          {/* Profile */}
          <Route path="/profile" element={<RoleRoute element={<UserProfile />} allowed={ALL} />} />

          {/* Employee portal */}
          <Route path="/employee-portal" element={<RoleRoute element={<EmployeePortal />} allowed={[ROLES.EMPLOYEE]} />} />

          {/* Default */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// ─── Setup Guard — only Admins, no Layout wrapper ────────────────────────────
function SetupGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    console.warn('SetupGuard: No user found, redirecting to /');
    return <Navigate to="/" replace />;
  }
  if (user.role !== ROLES.ADMIN) {
    console.warn(`SetupGuard: User is not admin (${user.role}), redirecting.`);
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return <AdminSetup />;
}
