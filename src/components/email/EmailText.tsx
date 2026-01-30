import React from 'react';

interface EmailTextProps {
  children: React.ReactNode;
  variant?: 'body' | 'muted';
  margin?: string;
  style?: React.CSSProperties;
}

export function EmailText({ children, variant = 'body', margin = '0', style }: EmailTextProps) {
  const baseStyles = {
    body: {
      margin,
      fontSize: '15px',
      color: '#1e293b',
      lineHeight: '1.6',
    },
    muted: {
      margin,
      fontSize: '16px',
      color: '#64748b',
      lineHeight: '1.5',
    },
  };

  return <p style={{ ...baseStyles[variant], ...style }}>{children}</p>;
}
