import React from 'react';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
}

export function EmailButton({
  href,
  children,
  backgroundColor = '#2563eb',
  color = '#ffffff',
}: EmailButtonProps) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        padding: '10px 24px',
        backgroundColor,
        color,
        textDecoration: 'none',
        borderRadius: '6px',
        fontSize: '15px',
        fontWeight: 500,
        lineHeight: '1.5',
      }}
    >
      {children}
    </a>
  );
}
