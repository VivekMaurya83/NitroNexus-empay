import React from 'react';
import { motion } from 'motion/react';
import { Bell, Search, Menu } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ user, pageTitle, onMenuToggle, alertCount = 0, onAlertClick }) {
  return (
    <motion.header
      className="topbar"
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div className="topbar-breadcrumb">
          <span className="topbar-company">{user?.company}</span>
          <span className="topbar-sep">/</span>
          <span className="topbar-page">{pageTitle}</span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <Search size={16} className="topbar-search-icon" />
          <input type="text" placeholder="Search employees, payrolls..." />
        </div>
      </div>

      <div className="topbar-right">
        <motion.button
          className="topbar-icon-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Notifications"
          onClick={onAlertClick}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {alertCount > 0 ? (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--error)', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--surface-container-lowest)',
            }}>
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          ) : (
            <span className="notif-dot" />
          )}
        </motion.button>

        <div className="topbar-user">
          <div
            className="avatar avatar-sm topbar-avatar"
            style={{ background: user?.photoColor || 'var(--primary-container)' }}
          >
            {user?.avatar || user?.name?.[0] || 'U'}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name}</span>
            <span className="topbar-user-role">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
