'use client';

import { useState, useCallback } from 'react';
import { AppShell, Box, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { Sidebar } from './Sidebar';
import { useArchiveAccordionState } from '@/hooks/useArchiveAccordionState';
import type { MailArchive } from '@/lib/archive-loader';
import styles from './AppShellLayout.module.css';

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 280;

export interface AppShellLayoutProps {
  archives: MailArchive[];
  children: React.ReactNode;
}

export function AppShellLayout({ archives, children }: AppShellLayoutProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [searchQuery, setSearchQuery] = useState('');

  const accordionState = useArchiveAccordionState();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX);
        setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidebarWidth]
  );

  return (
    <AppShell
      navbar={{
        width: sidebarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding={0}
      style={{ height: '100vh' }}
    >
      <AppShell.Navbar>
        <Box style={{ position: 'relative', height: '100%', width: '100%' }}>
          <Sidebar
            archives={archives}
            mobileOpened={mobileOpened}
            toggleMobile={toggleMobile}
            toggleDesktop={toggleDesktop}
            accordionState={accordionState}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          {/* リサイズハンドル（サイドバー表示時のみ） */}
          {desktopOpened && (
            <Box className={styles.resizeHandle} onMouseDown={handleMouseDown} />
          )}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main style={{ overflow: 'auto', height: '100vh' }}>
        {/* サイドバー再表示ボタン（デスクトップ非表示時のみ） */}
        {!desktopOpened && (
          <ActionIcon
            variant="default"
            onClick={toggleDesktop}
            size="lg"
            aria-label="サイドバーを開く"
            visibleFrom="sm"
            style={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 100,
            }}
          >
            <IconLayoutSidebarLeftExpand size={18} />
          </ActionIcon>
        )}
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
