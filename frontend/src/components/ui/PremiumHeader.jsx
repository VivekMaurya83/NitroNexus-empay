import React from 'react';
import { motion } from 'motion/react';

export default function PremiumHeader({ title, subtitle, pretitle, actionRight, children }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
        borderRadius: 20, 
        padding: '32px 36px', 
        color: '#fff', 
        position: 'relative', 
        overflow: 'hidden',
        marginBottom: 24, 
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: '40%', height: '150%', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', transform: 'rotate(-15deg)' }}/>
      <div style={{ position: 'absolute', right: '10%', top: '20%', width: '20%', height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', transform: 'rotate(-15deg)' }}/>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          {pretitle && <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.8, marginBottom: 6 }}>{pretitle}</div>}
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
          {subtitle && <div style={{ fontSize: 14, opacity: 0.9 }}>{subtitle}</div>}
        </div>
        {children && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            {children}
          </div>
        )}
      </div>
      
      {actionRight && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {actionRight}
        </div>
      )}
    </motion.div>
  );
}
