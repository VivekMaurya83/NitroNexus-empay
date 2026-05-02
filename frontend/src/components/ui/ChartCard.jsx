import React from 'react';
import { motion } from 'motion/react';

export default function ChartCard({ title, subtitle, children, delay = 0, style = {}, headerAction }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      style={{ 
        background: 'var(--surface-container-lowest)', 
        border: '1px solid var(--outline-variant)',
        borderRadius: 16, 
        padding: '20px 22px', 
        ...style 
      }}
    >
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--on-surface)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      {children}
    </motion.div>
  );
}
