import React from 'react';

interface EmailCardProps {
  children: React.ReactNode;
  backgroundColor?: string;
  padding?: string;
  style?: React.CSSProperties;
}

export function EmailCard({
  children,
  backgroundColor = '#f8fafc',
  padding = '24px',
  style,
}: EmailCardProps) {
  return (
    <div
      style={{
        padding,
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        backgroundColor,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
