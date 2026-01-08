'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'メール編集', icon: Mail },
  { href: '/help', label: '使い方', icon: HelpCircle },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-3 py-4" role="navigation" aria-label="メインナビゲーション">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-800 text-white border-l-4 border-primary'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className="w-5 h-5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
