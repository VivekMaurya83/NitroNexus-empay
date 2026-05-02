import React from 'react';
import { STATUS_SYMBOLS } from '../../utils/mockData';

export default function StatusBadge({ status }) {
  const s = STATUS_SYMBOLS[status] || { symbol: '○', label: status, badge: 'badge-draft' };
  return (
    <span className={`badge ${s.badge}`}>
      <span role="img" aria-label={s.label}>{s.symbol}</span>
      {s.label}
    </span>
  );
}
