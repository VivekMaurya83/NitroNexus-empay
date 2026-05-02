import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth, ROLES } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard':                 'Dashboard',
  '/status-board':              'Employee Status Board',
  '/employee-portal':           'My Portal',
  '/hr-directory':              'HR Directory',
  '/hr/add-employee':           'Add Employee',
  '/hr/leave-allocation':       'Leave Allocation',
  '/attendance':                'Attendance',
  '/leave':                     'Leave Management',
  '/payroll':                   'Payroll',
  '/payroll/salary-structure':  'Salary Structure',
  '/payslip':                   'Payslip',
  '/analytics':                 'Analytics',
  '/profile':                   'My Profile',
  '/admin/settings':            'Settings',
  '/admin/configurations':      'Configurations',
  '/admin/payroll-rules':       'Payroll Rules',
};

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const title      = PAGE_TITLES[location.pathname] || 'EmPay';
  const alertCount = 0; // fetched dynamically by TopBar/Dashboard

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          user={user}
          pageTitle={title}
          alertCount={alertCount}
          onMenuToggle={() => setCollapsed(c => !c)}
          onAlertClick={() => navigate('/dashboard')}
        />
        <main className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="page-wrapper"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
