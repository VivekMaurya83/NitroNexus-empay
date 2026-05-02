import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { currentUser } from '../../utils/mockData';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/employee-portal': 'Employee Portal',
  '/hr-directory': 'HR Directory',
  '/attendance': 'Attendance',
  '/leave': 'Leave Management',
  '/payroll': 'Payroll',
  '/payroll/salary-structure': 'Salary Structure',
  '/payslip': 'Payslip',
  '/profile': 'My Profile',
  '/admin/settings': 'Settings',
  '/admin/configurations': 'Configurations',
  '/hr/add-employee': 'Add Employee',
  '/hr/leave-allocation': 'Leave Allocation',
};

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'EmPay';

  return (
    <div className="app-layout">
      <Sidebar
        user={currentUser}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <div className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          user={currentUser}
          pageTitle={title}
          onMenuToggle={() => setCollapsed(c => !c)}
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
