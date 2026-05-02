import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign,
  Settings, ChevronLeft, ChevronRight, LogOut, Building2,
  FileText, UserPlus, SlidersHorizontal, UserCheck,
  BarChart2, Bell, MonitorSmartphone, ShieldCheck
} from 'lucide-react';
import { ROLES } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV = {
  [ROLES.ADMIN]: [
    { icon: LayoutDashboard,   label: 'Dashboard',        path: '/dashboard'            },
    { icon: MonitorSmartphone, label: 'Status Board',     path: '/status-board'         },
    { icon: Users,             label: 'HR Directory',     path: '/hr-directory'         },
    { icon: Clock,             label: 'Attendance',       path: '/attendance'           },
    { icon: CalendarDays,      label: 'Leave',            path: '/leave'                },
    { icon: DollarSign,        label: 'Payroll',          path: '/payroll'              },
    { icon: ShieldCheck,       label: 'Company Users',    path: '/admin/settings'       },
  ],
  [ROLES.HR]: [
    { icon: MonitorSmartphone, label: 'Status Board',     path: '/status-board'         },
    { icon: Users,             label: 'HR Directory',     path: '/hr-directory'         },
    { icon: UserPlus,          label: 'Add Employee',     path: '/hr/add-employee'      },
    { icon: Clock,             label: 'Attendance',       path: '/attendance'           },
    { icon: CalendarDays,      label: 'Leave',            path: '/leave'                },
  ],
  [ROLES.PAYROLL]: [
    { icon: MonitorSmartphone, label: 'Status Board',     path: '/status-board'         },
    { icon: DollarSign,        label: 'Payroll',          path: '/payroll'              },
    { icon: CalendarDays,      label: 'Leave',            path: '/leave'                },
    { icon: Clock,             label: 'Attendance',       path: '/attendance'           },
  ],
  [ROLES.EMPLOYEE]: [
    { icon: LayoutDashboard,   label: 'My Portal',        path: '/employee-portal'      },
    { icon: MonitorSmartphone, label: 'Status Board',     path: '/status-board'         },
    { icon: Clock,             label: 'My Attendance',    path: '/attendance'           },
    { icon: CalendarDays,      label: 'My Leave',         path: '/leave'                },
    { icon: FileText,          label: 'My Payslip',       path: '/payslip'              },
    { icon: UserCheck,         label: 'My Profile',       path: '/profile'              },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const items = NAV[user?.role] || NAV[ROLES.EMPLOYEE];

  return (
    <motion.aside className="sidebar" animate={{ width: collapsed ? 64 : 240 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon"><DollarSign size={20} /></div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span className="logo-text" initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:'auto' }} exit={{ opacity:0, width:0 }} transition={{ duration:0.2 }}>
              EmPay
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* User badge */}
      {!collapsed && user && (
        <div className="sidebar-role">
          <div className="avatar avatar-sm" style={{ marginRight: 8, background: user.photoColor || 'var(--primary-container)' }}>
            {user.avatar || user.name?.[0]}
          </div>
          <div>
            <div className="sidebar-username">{user.name?.split(' ')[0]}</div>
            <div className="sidebar-rolename">{user.role?.replace('_', ' ')}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {items.map(item => {
          const Icon   = item.icon;
          const active = location.pathname === item.path;
          return (
            <motion.button key={item.path + item.label} className={`sidebar-item ${active ? 'active' : ''}`} onClick={() => navigate(item.path)} whileHover={{ x: collapsed ? 0 : 4 }} whileTap={{ scale: 0.97 }} title={collapsed ? item.label : ''}>
              <Icon size={18} className="sidebar-item-icon" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:'auto' }} exit={{ opacity:0, width:0 }} transition={{ duration:0.15 }} className="sidebar-item-label">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <motion.button className="sidebar-item" onClick={() => navigate('/profile')} whileHover={{ x: collapsed ? 0 : 4 }} title={collapsed ? 'Profile' : ''}>
          <UserCheck size={18} className="sidebar-item-icon" />
          {!collapsed && <span className="sidebar-item-label">My Profile</span>}
        </motion.button>
        <motion.button className="sidebar-item" onClick={logout} whileHover={{ x: collapsed ? 0 : 4 }} title={collapsed ? 'Logout' : ''}>
          <LogOut size={18} className="sidebar-item-icon" />
          {!collapsed && <span className="sidebar-item-label">Logout</span>}
        </motion.button>
      </div>

      {/* Toggle */}
      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}
