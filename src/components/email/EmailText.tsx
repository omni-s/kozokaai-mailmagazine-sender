import React from 'react';

interface EmailTextProps {
  children: React.ReactNode;
  variant?: 'body' | 'muted';
  margin?: string;
}

export function EmailText({ children, variant = 'body', margin = '0' }: EmailTextProps) {
  const styles = {
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

  return <p style={styles[variant]}>{children}</p>;
}
