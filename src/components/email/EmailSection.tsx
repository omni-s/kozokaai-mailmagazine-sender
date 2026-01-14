import React from 'react';

interface EmailSectionProps {
  children: React.ReactNode;
  marginBottom?: string;
}

export function EmailSection({ children, marginBottom = '24px' }: EmailSectionProps) {
  return (
    <div style={{ marginBottom }}>
      {children}
    </div>
  );
}
