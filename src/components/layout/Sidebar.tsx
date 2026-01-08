'use client';

import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { ArchiveAccordion } from './ArchiveAccordion';
import type { MailArchive } from '@/lib/archive-loader';

interface SidebarProps {
  archives: MailArchive[];
}

export function Sidebar({ archives }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-[280px] md:bg-[#1e1e1e] md:border-r md:border-gray-800 md:z-40">
      <SidebarHeader />
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
        <div className="mt-6 px-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            配信履歴
          </h3>
          <ArchiveAccordion archives={archives} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">© 2026 Resend Mail</p>
      </div>
    </aside>
  );
}
