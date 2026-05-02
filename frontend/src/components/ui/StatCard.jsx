import React from 'react';
import { motion } from 'motion/react';

export default function StatCard({ icon: Icon, label, value, gradient, sub, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      style={{ 
        background: gradient || 'linear-gradient(135deg, var(--primary), var(--primary-container))', 
        borderRadius: 16, 
        padding: '20px 22px', 
        position: 'relative',
        overflow: 'hidden', 
        color: '#fff', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)' 
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      {Icon && (
        <div style={{ position: 'absolute', top: 14, right: 18, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, display: 'flex' }}>
          <Icon size={20} color="#fff" />
        </div>
      )}
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.7 }}>{sub}</div>}
    </motion.div>
  );
}
