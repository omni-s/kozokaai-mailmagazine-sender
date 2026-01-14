'use client';

import { NavLink } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { IconMail, IconHelp } from '@tabler/icons-react';

const navItems = [
  { href: '/', label: 'メール編集', icon: IconMail },
  { href: '/help', label: '使い方', icon: IconHelp },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav role="navigation" aria-label="メインナビゲーション">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={isActive}
            aria-current={isActive ? 'page' : undefined}
          />
        );
      })}
    </nav>
  );
}
