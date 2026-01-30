import React from 'react';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  target?: string;
  rel?: string;
}

export function EmailButton({
  href,
  children,
  backgroundColor = '#2563eb',
  color = '#ffffff',
  target,
  rel,
}: EmailButtonProps) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
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
