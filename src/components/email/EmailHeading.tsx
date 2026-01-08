import React from 'react';

interface EmailHeadingProps {
  level?: 1 | 2;
  children: React.ReactNode;
  margin?: string;
}

export function EmailHeading({ level = 1, children, margin }: EmailHeadingProps) {
  const baseStyles = {
    fontWeight: 600,
    letterSpacing: '-0.025em',
  };

  if (level === 1) {
    return (
      <h1
        style={{
          ...baseStyles,
          margin: margin || '0 0 8px 0',
          fontSize: '30px',
          color: '#0f172a',
          lineHeight: '1.2',
        }}
      >
        {children}
      </h1>
    );
  }

  return (
    <h2
      style={{
        ...baseStyles,
        margin: margin || '0 0 16px 0',
        fontSize: '24px',
        color: '#0f172a',
        lineHeight: '1.3',
      }}
    >
      {children}
    </h2>
  );
}
